// src/models/conversation.js
const { DataTypes, Model } = require('sequelize');

class Conversation extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      participant1Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      participant2Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      modelName: 'Conversation',
      tableName: 'conversations',
      indexes: [
        {
          fields: ['participant1Id']
        },
        {
          fields: ['participant2Id']
        },
        {
          unique: true,
          fields: ['participant1Id', 'participant2Id']
        }
      ]
    });
  }
}

module.exports = Conversation;