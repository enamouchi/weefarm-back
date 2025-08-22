// src/controllers/userController.js
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const locationHelper = require('../utils/locationHelper');
const fs = require('fs').promises;
const path = require('path');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    message: 'Profile retrieved successfully',
    user: user.toJSON()
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.id;
  const { name, email, governorateId, delegationId } = req.body;

  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updateData = {
    name: name || user.name,
    email: email || user.email
  };

  // Handle location update
  if (governorateId && delegationId) {
    const locationData = locationHelper.getLocationCoordinates(governorateId, delegationId);
    if (locationData) {
      updateData.lat = locationData.lat;
      updateData.lng = locationData.lng;
      updateData.governorate = locationData.governorate;
      updateData.municipality = locationData.municipality;
    }
  }

  // Handle avatar update
  if (req.file) {
    if (user.avatar) {
      try {
        const oldAvatarPath = path.join(__dirname, '../../', user.avatar);
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.log('Could not delete old avatar:', error.message);
      }
    }
    updateData.avatar = `/uploads/profiles/${req.file.filename}`;
  }

  await user.update(updateData);

  res.json({
    message: 'Profile updated successfully',
    user: user.toJSON()
  });
});

const deleteProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await user.update({ 
    isActive: false,
    refreshToken: null 
  });

  if (user.avatar) {
    try {
      const avatarPath = path.join(__dirname, '../../', user.avatar);
      await fs.unlink(avatarPath);
    } catch (error) {
      console.log('Could not delete avatar:', error.message);
    }
  }

  res.json({ message: 'Account deactivated successfully' });
});

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile
};
