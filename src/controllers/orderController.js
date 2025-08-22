// src/controllers/orderController.js
const { Order, Product, User, Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const { checkInventory } = require('./productController');

const getIncomingOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Product,
        as: 'product',
        where: { farmerId: req.user.id },
        attributes: ['id', 'title', 'price', 'unit', 'images']
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'phone']
      }
    ]
  });

  res.json({
    message: 'Incoming orders retrieved successfully',
    orders,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status, notes } = req.body;

  const order = await Order.findByPk(id, {
    include: [{
      model: Product,
      as: 'product',
      where: { farmerId: req.user.id }
    }]
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found or you do not have permission to modify it' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending orders can be approved or declined' });
  }

  const updateData = { status };
  if (notes) {
    updateData.notes = notes;
  }

  if (status === 'approved') {
    const product = order.product;
    if (product.remainingQuantity < order.quantity) {
      return res.status(400).json({ error: 'Insufficient quantity available' });
    }
    
    await product.update({
      remainingQuantity: product.remainingQuantity - order.quantity
    });
    
    await checkInventory(product.id);
  }

  await order.update(updateData);

  const statusMessages = {
    approved: 'تم قبول طلبك',
    declined: 'تم رفض طلبك',
    delivered: 'تم تسليم طلبك'
  };

  await Notification.create({
    userId: order.customerId,
    type: 'order_status_changed',
    title: 'تحديث حالة الطلب',
    body: statusMessages[status] || 'تم تحديث حالة طلبك',
    data: { orderId: order.id, status }
  });

  const updatedOrder = await Order.findByPk(order.id, {
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'title', 'price', 'unit', 'images']
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'phone']
      }
    ]
  });

  res.json({
    message: 'Order status updated successfully',
    order: updatedOrder
  });
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findByPk(id, {
    include: [
      {
        model: Product,
        as: 'product',
        where: { farmerId: req.user.id },
        attributes: ['id', 'title', 'description', 'price', 'unit', 'images']
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'email']
      }
    ]
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found or you do not have permission to view it' });
  }

  res.json({
    message: 'Order details retrieved successfully',
    order
  });
});

module.exports = {
  getIncomingOrders,
  updateOrderStatus,
  getOrderDetails
};