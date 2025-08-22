// src/models/service.js
const { DataTypes, Model } = require('sequelize');

class Service extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      category: {
        type: DataTypes.ENUM('vet', 'equipment_rent', 'equipment_buy', 'administration'),
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      providerName: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      lng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      governorate: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      municipality: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      contact: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      modelName: 'Service',
      tableName: 'services',
      indexes: [
        {
          fields: ['category']
        },
        {
          fields: ['lat', 'lng']
        },
        {
          fields: ['isActive']
        }
      ]
    });
  }
}

module.exports = Service;