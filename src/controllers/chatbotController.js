const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/message');
const freeAiService = require('../services/freeAiService');

exports.chatbotResponse = asyncHandler(async (req, res) => {
    const { message, conversationId } = req.body;
    const userId = req.user.id;
    
    if (!message || !conversationId) {
        return res.status(400).json({ error: 'Message and conversationId are required' });
    }
    
    try {
        // Save user message
        await Message.create({
            conversationId,
            senderId: userId,
            content: message,
            type: 'user'
        });
        
        // Get AI response
        const aiResponse = await freeAiService.getArabicFarmingResponse(message);
        
        // Save bot response
        const botMessage = await Message.create({
            conversationId,
            senderId: 'bot',
            content: aiResponse,
            type: 'bot'
        });
        
        res.json({ 
            response: botMessage,
            isAi: true,
            confidence: aiResponse.includes('يمكنني مساعدتك') ? 'fallback' : 'ai'
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

exports.getChatHistory = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    
    try {
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .limit(20);
        
        res.json({ messages });
    } catch (error) {
        console.error('Chat history error:', error);
        res.json({ messages: [] });
    }
});