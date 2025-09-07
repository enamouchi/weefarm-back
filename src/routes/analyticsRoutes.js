const express = require('express');
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Fetch analytics data for farmer dashboard
 * @access  Private (JWT required)
 */
router.get('/dashboard', authMiddleware, getDashboardAnalytics);

module.exports = router;
