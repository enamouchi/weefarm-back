// src/models/index.js
const { sequelize } = require('../config/database');
const User = require('./user');
const Product = require('./product');
const Order = require('./order');
const Service = require('./service');
const FeedPost = require('./feed');
const Message = require('./message');
const Conversation = require('./conversation');
const Notification = require('./notification');

// Initialize models
User.init(sequelize);
Product.init(sequelize);
Order.init(sequelize);
Service.init(sequelize);
FeedPost.init(sequelize);
Message.init(sequelize);
Conversation.init(sequelize);
Notification.init(sequelize);

// Define associations
User.hasMany(Product, { foreignKey: 'farmerId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'farmerId', as: 'farmer' });

Product.hasMany(Order, { foreignKey: 'productId', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Conversation.belongsTo(User, { foreignKey: 'participant1Id', as: 'participant1' });
Conversation.belongsTo(User, { foreignKey: 'participant2Id', as: 'participant2' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  Service,
  FeedPost,
  Message,
  Conversation,
  Notification
};