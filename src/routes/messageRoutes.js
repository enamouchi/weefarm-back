// src/routes/messageRoutes.js
const express = require('express');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSendMessage, validateCreateConversation } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authMiddleware('farmer'));

router.get('/', messageController.getConversations);
router.post('/', validateCreateConversation, messageController.createConversation);
router.get('/:id/messages', messageController.getMessages);
router.post('/:id/messages', validateSendMessage, messageController.sendMessage);

module.exports = router;
