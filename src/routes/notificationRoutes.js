// src/routes/notificationRoutes.js
const express = require('express');
const { Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware('farmer'));

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;

  const whereClause = { userId };
  if (isRead !== undefined) {
    whereClause.isRead = isRead === 'true';
  }

  const { count, rows: notifications } = await Notification.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    message: 'Notifications retrieved successfully',
    notifications,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOne({
    where: { id, userId }
  });

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  await notification.update({ isRead: true });

  res.json({
    message: 'Notification marked as read',
    notification
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );

  res.json({
    message: 'All notifications marked as read'
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await Notification.count({
    where: { userId, isRead: false }
  });

  res.json({
    message: 'Unread notifications count retrieved',
    unreadCount: count
  });
});

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;