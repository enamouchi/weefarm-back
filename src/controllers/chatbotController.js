const freeAiService = require('../services/freeAiService');
const { Message, Conversation } = require('../models');
const asyncHandler = require('express-async-handler');


exports.chatbotResponse = asyncHandler(async (req, res) => {
    const { message, conversationId } = req.body;
    const userId = req.user.id;
    
    if (!message || message.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'الرسالة مطلوبة'
        });
    }

    try {
        // Create conversation if it doesn't exist
        let conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            conversation = await Conversation.create({
                id: conversationId,
                participants: [userId, 'bot']
            });
        }

        // Save user message
        await Message.create({
            conversationId,
            senderId: userId,
            content: message.trim(),
            type: 'user'
        });

        // Get AI response
        const aiResponse = await freeAiService.getArabicFarmingResponse(message.trim());
        
        // Save bot response
        const botMessage = await Message.create({
            conversationId,
            senderId: 'bot',
            content: aiResponse,
            type: 'bot'
        });

        res.json({
            success: true,
            response: {
                id: botMessage.id,
                content: aiResponse,
                type: 'bot',
                timestamp: botMessage.createdAt
            },
            confidence: aiResponse.includes('يمكنني مساعدتك') ? 'fallback' : 'high'
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        
        // Emergency fallback
        const fallbackResponse = 'عذرا، حدث خطأ مؤقت. أنا هنا لمساعدتك في أمور الزراعة. حاول مرة أخرى.';
        
        res.json({
            success: true,
            response: {
                content: fallbackResponse,
                type: 'bot',
                timestamp: new Date()
            },
            confidence: 'error_fallback'
        });
    }
});

exports.getChatHistory = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    try {
        const messages = await Message.findAll({
            where: { conversationId },
            order: [['createdAt', 'ASC']],
            limit: 50
        });

        res.json({
            success: true,
            messages: messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                type: msg.type,
                timestamp: msg.createdAt
            }))
        });
    } catch (error) {
        res.json({
            success: true,
            messages: []
        });
    }
});