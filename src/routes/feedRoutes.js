// src/routes/feedRoutes.js
const express = require('express');
const feedController = require('../controllers/feedController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware('farmer'));

router.get('/', feedController.getFeedPosts);
router.get('/:id', feedController.getFeedPostDetails);
router.post('/:id/like', feedController.likeFeedPost);

module.exports = router;