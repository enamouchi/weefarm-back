// src/models/product.js
const { DataTypes, Model } = require('sequelize');

class Product extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      farmerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      originalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      remainingQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'kg'
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      lng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      indexes: [
        {
          fields: ['farmerId']
        },
        {
          fields: ['category']
        },
        {
          fields: ['isActive']
        },
        {
          fields: ['lat', 'lng']
        }
      ]
    });
  }
}

module.exports = Product;