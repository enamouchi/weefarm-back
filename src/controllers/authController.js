// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const locationHelper = require('../utils/locationHelper');
const path = require('path');
const fs = require('fs');

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

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 216, remove it (Tunisia country code)
  if (cleaned.startsWith('216')) {
    return cleaned.substring(3);
  }
  
  return cleaned;
};

// Helper function to validate Tunisian phone
const isValidTunisianPhone = (phone) => {
  const cleaned = cleanPhoneNumber(phone);
  // Tunisian mobile numbers are 8 digits and typically start with 2, 3, 4, 5, 7, or 9
  return /^[23459][0-9]{7}$/.test(cleaned);
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

  // Clean and validate phone number
  const cleanedPhone = cleanPhoneNumber(phone);
  if (!isValidTunisianPhone(cleanedPhone)) {
    return res.status(400).json({ error: 'Invalid Tunisian phone number format' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { phone: cleanedPhone } });
  if (existingUser) {
    return res.status(400).json({ error: 'Phone number already registered' });
  }

  // Get coordinates from selected location
  let locationData = null;
  if (governorateId && delegationId) {
    try {
      // Convert to integers if they're strings
      const govId = parseInt(governorateId);
      const delId = parseInt(delegationId);
      
      locationData = locationHelper.getLocationCoordinates(govId, delId);
      
      if (!locationData) {
        return res.status(400).json({ error: 'Invalid location selection' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid location IDs provided' });
    }
  }

  const otp = simulateOTP(cleanedPhone);

  const userData = {
    name: name.trim(),
    phone: cleanedPhone, // Store cleaned phone
    email: email ? email.trim() : null,
    role: role.toLowerCase()
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
    // Ensure the uploads/profiles directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    userData.avatar = `/uploads/profiles/${req.file.filename}`;
  }

  try {
    const user = await User.create(userData);

    const tokens = generateTokens(user.id);
    
    await user.update({ refreshToken: tokens.refreshToken });

    // Return user data without sensitive info
    const { refreshToken: _, ...userResponse } = user.toJSON();

    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      tokens,
      location: locationData,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Delete uploaded file if user creation failed
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone, otp } = req.body;

  // Clean phone number for consistency
  const cleanedPhone = cleanPhoneNumber(phone);

  const user = await User.findOne({ where: { phone: cleanedPhone, isActive: true } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid phone number or account deactivated' });
  }

  const expectedOTP = simulateOTP(cleanedPhone);
  if (otp !== expectedOTP) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  const tokens = generateTokens(user.id);
  
  await user.update({ refreshToken: tokens.refreshToken });

  // Return user data without sensitive info
  const { refreshToken: _, ...userResponse } = user.toJSON();

  res.json({
    message: 'Login successful',
    user: userResponse,
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
  const cleanedPhone = cleanPhoneNumber(phone);
  
  if (!isValidTunisianPhone(cleanedPhone)) {
    return res.status(400).json({ error: 'Invalid Tunisian phone number format' });
  }
  
  const otp = simulateOTP(cleanedPhone);

  res.json({
    message: 'OTP sent successfully',
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  });
});

const getLocations = asyncHandler(async (req, res) => {
  try {
    const locations = locationHelper.getAllGovernoratesWithDelegations();
    
    res.json({
      message: 'Locations retrieved successfully',
      locations
    });
  } catch (error) {
    console.error('Error loading locations:', error);
    res.status(500).json({ error: 'Failed to load locations data' });
  }
});

const searchLocations = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  try {
    const results = locationHelper.searchLocation(q.trim());
    
    res.json({
      message: 'Location search completed',
      query: q.trim(),
      results,
      total: results.length
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  // Clean phone number for consistency
  const cleanedPhone = cleanPhoneNumber(phone);

  const user = await User.findOne({ where: { phone: cleanedPhone, isActive: true } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid phone number or account deactivated' });
  }

  const expectedOTP = simulateOTP(cleanedPhone);
  if (otp !== expectedOTP) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  const tokens = generateTokens(user.id);
  
  await user.update({ refreshToken: tokens.refreshToken });

  // Return user data without sensitive info
  const { refreshToken: _, ...userResponse } = user.toJSON();
  
  res.json({
    message: 'OTP validated',
    user: userResponse,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  requestOTP,
  getLocations,
  searchLocations,
  verifyOTP,
};