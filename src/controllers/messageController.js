// src/controllers/messageController.js
const { Conversation, Message, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: conversations } = await Conversation.findAndCountAll({
    where: {
      [Op.or]: [
        { participant1Id: userId },
        { participant2Id: userId }
      ],
      isActive: true
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['lastMessageAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'participant1',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: User,
        as: 'participant2',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: Message,
        as: 'messages',
        limit: 1,
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'name']
        }]
      }
    ]
  });

  const conversationsWithPartner = conversations.map(conv => {
    const partner = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
    const lastMessage = conv.messages[0] || null;
    
    return {
      id: conv.id,
      partner,
      lastMessage,
      lastMessageAt: conv.lastMessageAt,
      updatedAt: conv.updatedAt
    };
  });

  res.json({
    message: 'Conversations retrieved successfully',
    conversations: conversationsWithPartner,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;

  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [
        { participant1Id: userId },
        { participant2Id: userId }
      ]
    }
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found or you do not have access to it' });
  }

  const { count, rows: messages } = await Message.findAndCountAll({
    where: { conversationId },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [{
      model: User,
      as: 'sender',
      attributes: ['id', 'name', 'avatar']
    }]
  });

  await Message.update(
    { isRead: true },
    {
      where: {
        conversationId,
        senderId: { [Op.ne]: userId },
        isRead: false
      }
    }
  );

  res.json({
    message: 'Messages retrieved successfully',
    messages: messages.reverse(),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: conversationId } = req.params;
  const { body, messageType = 'text' } = req.body;
  const senderId = req.user.id;

  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [
        { participant1Id: senderId },
        { participant2Id: senderId }
      ]
    }
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found or you do not have access to it' });
  }

  const message = await Message.create({
    conversationId,
    senderId,
    body: body.trim(),
    messageType
  });

  await conversation.update({
    lastMessageAt: new Date()
  });

  const messageWithSender = await Message.findByPk(message.id, {
    include: [{
      model: User,
      as: 'sender',
      attributes: ['id', 'name', 'avatar']
    }]
  });

  const recipientId = conversation.participant1Id === senderId 
    ? conversation.participant2Id 
    : conversation.participant1Id;

  await require('../models').Notification.create({
    userId: recipientId,
    type: 'new_message',
    title: 'رسالة جديدة',
    body: `رسالة جديدة من ${req.user.name}`,
    data: { conversationId, messageId: message.id }
  });

  res.status(201).json({
    message: 'Message sent successfully',
    message: messageWithSender
  });
});

const createConversation = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { participantId } = req.body;
  const userId = req.user.id;

  if (participantId === userId) {
    return res.status(400).json({ error: 'Cannot create conversation with yourself' });
  }

  const participant = await User.findOne({
    where: { id: participantId, isActive: true }
  });

  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  let conversation = await Conversation.findOne({
    where: {
      [Op.or]: [
        { participant1Id: userId, participant2Id: participantId },
        { participant1Id: participantId, participant2Id: userId }
      ]
    }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participant1Id: userId,
      participant2Id: participantId,
      lastMessageAt: new Date()
    });
  }

  const conversationWithParticipants = await Conversation.findByPk(conversation.id, {
    include: [
      {
        model: User,
        as: 'participant1',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: User,
        as: 'participant2',
        attributes: ['id', 'name', 'avatar']
      }
    ]
  });

  res.status(201).json({
    message: 'Conversation created successfully',
    conversation: conversationWithParticipants
  });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  createConversation
};