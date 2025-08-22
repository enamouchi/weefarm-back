// src/models/user.js
const { DataTypes, Model } = require('sequelize');

class User extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('farmer', 'citizen', 'service_provider', 'company'),
        allowNull: false,
        defaultValue: 'farmer'
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
      avatar: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      indexes: [
        {
          fields: ['phone']
        },
        {
          fields: ['email']
        },
        {
          fields: ['lat', 'lng']
        }
      ]
    });
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.refreshToken;
    return values;
  }
}

module.exports = User;