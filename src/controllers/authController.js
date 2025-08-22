// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const locationHelper = require('../utils/locationHelper');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

const simulateOTP = (phone) => {
  return '123456';
};

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    name, 
    phone, 
    email, 
    role = 'farmer', 
    governorateId, 
    delegationId 
  } = req.body;

  const existingUser = await User.findOne({ where: { phone } });
  if (existingUser) {
    return res.status(400).json({ error: 'Phone number already registered' });
  }

  // Get coordinates from selected location
  let locationData = null;
  if (governorateId && delegationId) {
    locationData = locationHelper.getLocationCoordinates(governorateId, delegationId);
  }

  const otp = simulateOTP(phone);

  const userData = {
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : null,
    role
  };

  // Set location data if available
  if (locationData) {
    userData.lat = locationData.lat;
    userData.lng = locationData.lng;
    userData.governorate = locationData.governorate;
    userData.municipality = locationData.municipality;
  }

  // Set avatar if uploaded
  if (req.file) {
    userData.avatar = `/uploads/profiles/${req.file.filename}`;
  }

  const user = await User.create(userData);

  const tokens = generateTokens(user.id);
  
  await user.update({ refreshToken: tokens.refreshToken });

  res.status(201).json({
    message: 'Registration successful',
    user: user.toJSON(),
    tokens,
    location: locationData,
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  });
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone, otp } = req.body;

  const user = await User.findOne({ where: { phone, isActive: true } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid phone number or account deactivated' });
  }

  const expectedOTP = simulateOTP(phone);
  if (otp !== expectedOTP) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  const tokens = generateTokens(user.id);
  
  await user.update({ refreshToken: tokens.refreshToken });

  res.json({
    message: 'Login successful',
    user: user.toJSON(),
    tokens
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findOne({ 
      where: { id: decoded.userId, refreshToken, isActive: true } 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user.id);
    await user.update({ refreshToken: tokens.refreshToken });

    res.json({
      message: 'Tokens refreshed successfully',
      tokens
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  await User.update(
    { refreshToken: null },
    { where: { id: userId } }
  );

  res.json({ message: 'Logout successful' });
});

const requestOTP = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone } = req.body;
  const otp = simulateOTP(phone);

  res.json({
    message: 'OTP sent successfully',
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  });
});

const getLocations = asyncHandler(async (req, res) => {
  const locations = locationHelper.getAllGovernoratesWithDelegations();
  
  res.json({
    message: 'Locations retrieved successfully',
    locations
  });
});

const searchLocations = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const results = locationHelper.searchLocation(q.trim());
  
  res.json({
    message: 'Location search completed',
    query: q.trim(),
    results,
    total: results.length
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  requestOTP,
  getLocations,
  searchLocations
};