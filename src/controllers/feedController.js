// src/controllers/feedController.js
const { FeedPost, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getFeedPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: posts } = await FeedPost.findAndCountAll({
    where: { isActive: true },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [{
      model: User,
      as: 'admin',
      attributes: ['id', 'name', 'avatar']
    }]
  });

  res.json({
    message: 'Feed posts retrieved successfully',
    posts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  });
});

const getFeedPostDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await FeedPost.findOne({
    where: { id, isActive: true },
    include: [{
      model: User,
      as: 'admin',
      attributes: ['id', 'name', 'avatar']
    }]
  });

  if (!post) {
    return res.status(404).json({ error: 'Feed post not found' });
  }

  res.json({
    message: 'Feed post details retrieved successfully',
    post
  });
});

const likeFeedPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await FeedPost.findOne({
    where: { id, isActive: true }
  });

  if (!post) {
    return res.status(404).json({ error: 'Feed post not found' });
  }

  await post.update({
    likesCount: post.likesCount + 1
  });

  res.json({
    message: 'Post liked successfully',
    likesCount: post.likesCount + 1
  });
});

module.exports = {
  getFeedPosts,
  getFeedPostDetails,
  likeFeedPost
};