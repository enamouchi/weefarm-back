// src/services/businessLogicService.js
const { sequelize, Product, Order, User, Conversation, Message } = require('../models');
const { ConflictError, ValidationAppError, NotFoundError } = require('../middleware/errorMiddleware');

class BusinessLogicService {
  
  // Thread-safe order creation with stock management
  static async createOrderSafely(orderData, buyerId) {
    const transaction = await sequelize.transaction({
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      const { productId, quantity, ...otherOrderData } = orderData;

      // 1. Lock the product row to prevent concurrent modifications
      const product = await Product.findByPk(productId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!product) {
        throw new NotFoundError('المنتج غير موجود');
      }

      // 2. Validate product availability
      if (!product.isAvailable()) {
        throw new ValidationAppError('المنتج غير متوفر حالياً');
      }

      if (!product.canOrderQuantity(quantity)) {
        throw new ValidationAppError(
          `الكمية غير متوفرة. المتوفر: ${product.remainingQuantity} ${product.quantityUnit}`
        );
      }

      // 3. Prevent self-ordering
      if (product.farmerId === buyerId) {
        throw new ValidationAppError('لا يمكن طلب منتجاتك الخاصة');
      }

      // 4. Get buyer details
      const buyer = await User.findByPk(buyerId, { transaction });
      if (!buyer || !buyer.isActive) {
        throw new NotFoundError('المشتري غير موجود');
      }

      // 5. Calculate pricing
      const unitPrice = product.price;
      let deliveryFee = 0;
      
      if (otherOrderData.deliveryMethod === 'delivery') {
        deliveryFee = 5; // Base delivery fee
      } else if (otherOrderData.deliveryMethod === 'shipping') {
        deliveryFee = 10; // Shipping fee
      }

      // 6. Create order
      const order = await Order.create({
        buyerId,
        farmerId: product.farmerId,
        productId,
        quantity,
        unitPrice,
        deliveryFee,
        buyerName: buyer.fullName,
        buyerPhone: buyer.phoneNumber,
        buyerEmail: buyer.email,
        ...otherOrderData
      }, { transaction });

      // 7. Reserve stock (don't reduce until confirmed)
      // You could add a 'reservedQuantity' field to track this
      // For now, we'll trust the order system

      await transaction.commit();

      // 8. Return the created order with details
      return await Order.findByPk(order.id, {
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'images'] },
          { model: User, as: 'buyer', attributes: ['id', 'fullName', 'phoneNumber'] },
          { model: User, as: 'farmer', attributes: ['id', 'fullName', 'phoneNumber', 'businessName'] }
        ]
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Thread-safe order confirmation with stock deduction
  static async confirmOrderSafely(orderId, farmerId, confirmationData = {}) {
    const transaction = await sequelize.transaction({
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // 1. Lock the order
      const order = await Order.findByPk(orderId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
        include: [{ model: Product, as: 'product' }]
      });

      if (!order) {
        throw new NotFoundError('الطلب غير موجود');
      }

      // 2. Verify farmer ownership
      if (order.farmerId !== farmerId) {
        throw new ValidationAppError('ليس لديك صلاحية لتأكيد هذا الطلب');
      }

      // 3. Check if order can be confirmed
      if (!order.canBeConfirmed()) {
        throw new ValidationAppError('لا يمكن تأكيد هذا الطلب في حالته الحالية');
      }

      // 4. Lock the product and verify stock
      const product = await Product.findByPk(order.productId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!product.canOrderQuantity(order.quantity)) {
        throw new ConflictError('المخزون غير كافي لتأكيد الطلب');
      }

      // 5. Deduct stock atomically
      await product.updateQuantity(order.quantity);

      // 6. Update order status
      await order.update({
        status: 'confirmed',
        ...confirmationData
      }, { transaction });

      await transaction.commit();

      return order;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Thread-safe order cancellation with stock restoration
  static async cancelOrderSafely(orderId, userId, reason, cancelledBy) {
    const transaction = await sequelize.transaction();

    try {
      const order = await Order.findByPk(orderId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
        include: [{ model: Product, as: 'product' }]
      });

      if (!order) {
        throw new NotFoundError('الطلب غير موجود');
      }

      // Verify permissions
      const canCancel = order.buyerId === userId || order.farmerId === userId;
      if (!canCancel) {
        throw new ValidationAppError('ليس لديك صلاحية لإلغاء هذا الطلب');
      }

      if (!order.canBeCancelled()) {
        throw new ValidationAppError('لا يمكن إلغاء هذا الطلب في حالته الحالية');
      }

      // If order was confirmed, restore stock
      if (order.status === 'confirmed' || order.status === 'preparing') {
        const product = await Product.findByPk(order.productId, {
          lock: transaction.LOCK.UPDATE,
          transaction
        });

        if (product) {
          await product.update({
            remainingQuantity: product.remainingQuantity + order.quantity,
            status: product.remainingQuantity + order.quantity > 0 ? 'active' : product.status
          }, { transaction });
        }
      }

      // Cancel the order
      await order.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: new Date()
      }, { transaction });

      await transaction.commit();

      return order;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Thread-safe conversation creation
  static async createConversationSafely(user1Id, user2Id, metadata = {}) {
    const transaction = await sequelize.transaction();

    try {
      const { productId, orderId, serviceId, type = 'direct' } = metadata;

      // Order user IDs consistently to prevent deadlocks
      const [userId1, userId2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

      // Check for existing conversation
      const existingConversation = await Conversation.findOne({
        where: {
          user1Id: userId1,
          user2Id: userId2,
          ...(productId && { productId }),
          ...(orderId && { orderId }),
          ...(serviceId && { serviceId })
        },
        transaction
      });

      if (existingConversation) {
        await transaction.commit();
        return existingConversation;
      }

      // Create new conversation
      const conversation = await Conversation.create({
        user1Id: userId1,
        user2Id: userId2,
        productId,
        orderId,
        serviceId,
        type,
        title: this.generateConversationTitle(type, metadata)
      }, { transaction });

      await transaction.commit();

      return conversation;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Thread-safe message sending with conversation updates
  static async sendMessageSafely(conversationId, senderId, messageData) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Lock conversation
      const conversation = await Conversation.findByPk(conversationId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!conversation) {
        throw new NotFoundError('المحادثة غير موجودة');
      }

      // 2. Verify sender permissions
      if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
        throw new ValidationAppError('ليس لديك صلاحية للإرسال في هذه المحادثة');
      }

      // 3. Check if conversation is blocked
      const isBlocked = (conversation.user1Id === senderId && conversation.isBlockedByUser2) ||
                       (conversation.user2Id === senderId && conversation.isBlockedByUser1);
      
      if (isBlocked) {
        throw new ValidationAppError('المحادثة محظورة');
      }

      // 4. Create message
      const message = await Message.create({
        conversationId,
        senderId,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        attachments: messageData.attachments || [],
        replyToMessageId: messageData.replyToMessageId
      }, { transaction });

      // 5. Update conversation atomically
      const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
      
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: messageData.content.length > 100 ? 
          messageData.content.substring(0, 100) + '...' : messageData.content,
        [conversation.user1Id === recipientId ? 'user1UnreadCount' : 'user2UnreadCount']: 
          sequelize.literal(`${conversation.user1Id === recipientId ? 'user1UnreadCount' : 'user2UnreadCount'} + 1`)
      }, { transaction });

      await transaction.commit();

      return message;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Thread-safe product stock update
  static async updateProductStockSafely(productId, quantityChange, operation = 'subtract') {
    const transaction = await sequelize.transaction({
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      const product = await Product.findByPk(productId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!product) {
        throw new NotFoundError('المنتج غير موجود');
      }

      let newQuantity;
      if (operation === 'subtract') {
        newQuantity = product.remainingQuantity - quantityChange;
        if (newQuantity < 0) {
          throw new ConflictError('الكمية المطلوبة أكبر من المتوفر');
        }
      } else if (operation === 'add') {
        newQuantity = product.remainingQuantity + quantityChange;
        if (newQuantity > product.originalQuantity) {
          newQuantity = product.originalQuantity; // Cap at original quantity
        }
      }

      await product.update({
        remainingQuantity: newQuantity,
        status: newQuantity === 0 ? 'sold_out' : 'active',
        orderCount: operation === 'subtract' ? product.orderCount + 1 : product.orderCount
      }, { transaction });

      await transaction.commit();

      return product;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Bulk operations with transaction safety
  static async bulkOperationSafely(operations, options = {}) {
    const transaction = await sequelize.transaction({
      isolationLevel: options.isolationLevel || sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      const results = [];

      for (const operation of operations) {
        const result = await operation(transaction);
        results.push(result);
      }

      await transaction.commit();
      return results;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Deadlock-safe retry mechanism
  static async withRetry(operation, maxRetries = 3, baseDelay = 100) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // Retry on deadlock or lock timeout
        if ((error.name === 'SequelizeDatabaseError' && 
             (error.original?.code === 'ER_LOCK_DEADLOCK' || 
              error.original?.code === 'ER_LOCK_WAIT_TIMEOUT')) && 
            attempt < maxRetries) {
          
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
          console.warn(`Deadlock detected, retrying operation (attempt ${attempt}/${maxRetries}) after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }
  }

  // Utility methods
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateConversationTitle(type, metadata = {}) {
    switch (type) {
      case 'product_inquiry':
        return 'استفسار عن المنتج';
      case 'order_related':
        return `بخصوص الطلب ${metadata.orderNumber || ''}`;
      case 'service_inquiry':
        return 'استفسار عن الخدمة';
      default:
        return 'محادثة مباشرة';
    }
  }

  // Cache management for frequently accessed data
  static async getCachedOrFetch(cacheKey, fetchFunction, ttl = 300000) { // 5 minutes default
    // In a real implementation, you'd use Redis or similar
    // For now, we'll just call the fetch function
    return await fetchFunction();
  }

  // Rate limiting helper
  static async checkRateLimit(userId, action, limit = 10, windowMs = 60000) {
    // In a real implementation, you'd use Redis with sliding window
    // For now, just return true
    return true;
  }

  // Data integrity checks
  static async validateDataIntegrity() {
    const issues = [];

    try {
      // Check for orphaned orders
      const orphanedOrders = await Order.findAll({
        include: [
          { model: Product, as: 'product', required: false },
          { model: User, as: 'buyer', required: false },
          { model: User, as: 'farmer', required: false }
        ],
        where: {
          '$product.id': null
        }
      });

      if (orphanedOrders.length > 0) {
        issues.push({
          type: 'orphaned_orders',
          count: orphanedOrders.length,
          items: orphanedOrders.map(o => o.id)
        });
      }

      // Check for negative stock
      const negativeStock = await Product.findAll({
        where: {
          remainingQuantity: { [sequelize.Op.lt]: 0 }
        }
      });

      if (negativeStock.length > 0) {
        issues.push({
          type: 'negative_stock',
          count: negativeStock.length,
          items: negativeStock.map(p => ({ id: p.id, quantity: p.remainingQuantity }))
        });
      }

      // Check for inconsistent order totals
      const inconsistentOrders = await sequelize.query(`
        SELECT id, quantity, unit_price, delivery_fee, total_price,
               (quantity * unit_price + delivery_fee) as calculated_total
        FROM orders 
        WHERE ABS(total_price - (quantity * unit_price + delivery_fee)) > 0.01
      `, { type: sequelize.QueryTypes.SELECT });

      if (inconsistentOrders.length > 0) {
        issues.push({
          type: 'inconsistent_order_totals',
          count: inconsistentOrders.length,
          items: inconsistentOrders
        });
      }

      return {
        hasIssues: issues.length > 0,
        issues,
        checkedAt: new Date()
      };

    } catch (error) {
      console.error('Data integrity check failed:', error);
      return {
        hasIssues: true,
        error: error.message,
        checkedAt: new Date()
      };
    }
  }

  // Cleanup operations
  static async cleanupExpiredData() {
    const transaction = await sequelize.transaction();
    
    try {
      const results = {};

      // Delete expired feed posts
      const expiredFeeds = await sequelize.models.Feed.destroy({
        where: {
          expiresAt: { [sequelize.Op.lt]: new Date() },
          status: 'published'
        },
        transaction
      });
      results.expiredFeeds = expiredFeeds;

      // Archive old conversations with no recent activity
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 6); // 6 months ago

      const archivedConversations = await Conversation.update(
        { isArchivedByUser1: true, isArchivedByUser2: true },
        {
          where: {
            lastMessageAt: { [sequelize.Op.lt]: oldDate },
            isArchivedByUser1: false,
            isArchivedByUser2: false
          },
          transaction
        }
      );
      results.archivedConversations = archivedConversations[0];

      // Soft delete old pending orders
      oldDate.setDate(oldDate.getDate() - 7); // 7 days ago
      const cancelledOrders = await Order.update(
        { 
          status: 'cancelled', 
          cancellationReason: 'إلغاء تلقائي - انتهت صلاحية الطلب',
          cancelledBy: 'system',
          cancelledAt: new Date()
        },
        {
          where: {
            status: 'pending',
            createdAt: { [sequelize.Op.lt]: oldDate }
          },
          transaction
        }
      );
      results.cancelledOrders = cancelledOrders[0];

      await transaction.commit();
      
      console.log('Cleanup completed:', results);
      return results;

    } catch (error) {
      await transaction.rollback();
      console.error('Cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = BusinessLogicService;