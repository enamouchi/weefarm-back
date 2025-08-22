// src/models/message.js
const { DataTypes, Model } = require('sequelize');

class Message extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        }
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      messageType: {
        type: DataTypes.ENUM('text', 'image', 'file'),
        defaultValue: 'text'
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      indexes: [
        {
          fields: ['conversationId']
        },
        {
          fields: ['senderId']
        },
        {
          fields: ['createdAt']
        }
      ]
    });
  }
}

module.exports = Message;