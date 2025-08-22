// src/models/notification.js
const { DataTypes, Model } = require('sequelize');

class Notification extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.ENUM('order_received', 'out_of_stock', 'order_status_changed', 'new_message'),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      data: {
        type: DataTypes.JSON,
        allowNull: true
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      indexes: [
        {
          fields: ['userId']
        },
        {
          fields: ['type']
        },
        {
          fields: ['isRead']
        },
        {
          fields: ['createdAt']
        }
      ]
    });
  }
}

module.exports = Notification;