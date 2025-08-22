// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const authMiddleware = (requiredRole = null) => {
  return asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'access') {
        return res.status(401).json({ error: 'Invalid token type' });
      }

      const user = await User.findOne({
        where: { id: decoded.userId, isActive: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: `Access denied. ${requiredRole} role required.` });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  });
};

module.exports = authMiddleware;