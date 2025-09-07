const express = require('express');
const { chatbotResponse, getChatHistory } = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/chatbot/chat
 * @desc    Send a message to the chatbot and get a reply
 * @access  Private (JWT required)
 */
router.post('/chat', authMiddleware, chatbotResponse);

/**
 * @route   GET /api/chatbot/history/:conversationId
 * @desc    Get chat history by conversation ID
 * @access  Private (JWT required)
 */
router.get('/history/:conversationId', authMiddleware, getChatHistory);

module.exports = router;
