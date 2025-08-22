// src/models/feed.js
const { DataTypes, Model } = require('sequelize');

class FeedPost extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      adminId: {
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
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      likesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      commentsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      modelName: 'FeedPost',
      tableName: 'feed_posts',
      indexes: [
        {
          fields: ['adminId']
        },
        {
          fields: ['isActive']
        },
        {
          fields: ['createdAt']
        }
      ]
    });
  }
}

module.exports = FeedPost;