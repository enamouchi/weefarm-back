// src/middleware/validationMiddleware.js
const { body, param, query } = require('express-validator');

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('216')) {
    return cleaned.substring(3);
  }
  return cleaned;
};

// Custom phone validator for Tunisia
const validateTunisianPhone = (value) => {
  const cleaned = cleanPhoneNumber(value);
  // Tunisian mobile numbers are 8 digits and typically start with 2, 3, 4, 5, 7, or 9
  return /^[23459][0-9]{7}$/.test(cleaned);
};

const validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters')
    .trim(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      if (!validateTunisianPhone(value)) {
        throw new Error('Invalid Tunisian phone number format. Must be 8 digits starting with 2, 3, 4, 5, 7, or 9');
      }
      return true;
    })
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['farmer', 'citizen', 'service_provider', 'company'])
    .withMessage('Invalid role'),
  // Updated to handle governorateId and delegationId
  body('governorateId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Governorate ID must be a positive integer'),
  body('delegationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Delegation ID must be a positive integer'),
  // Keep backward compatibility with governorate/municipality names
  body('governorate')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Governorate name too long')
    .trim(),
  body('municipality')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Municipality name too long')
    .trim(),
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  // Custom validator to ensure both governorate and delegation are provided together
  body('governorateId').custom((value, { req }) => {
    if (value && !req.body.delegationId) {
      throw new Error('Delegation ID is required when governorate ID is provided');
    }
    if (!value && req.body.delegationId) {
      throw new Error('Governorate ID is required when delegation ID is provided');
    }
    return true;
  }),
];

const validateLogin = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      if (!validateTunisianPhone(value)) {
        throw new Error('Invalid Tunisian phone number format');
      }
      return true;
    })
    .trim(),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

const validateOTP = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      if (!validateTunisianPhone(value)) {
        throw new Error('Invalid Tunisian phone number format');
      }
      return true;
    })
    .trim()
];

const validateUpdateProfile = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .custom((value) => {
      if (value && !validateTunisianPhone(value)) {
        throw new Error('Invalid Tunisian phone number format');
      }
      return true;
    })
    .trim(),
  body('governorateId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Governorate ID must be a positive integer'),
  body('delegationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Delegation ID must be a positive integer'),
  body('governorate')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Governorate name too long')
    .trim(),
  body('municipality')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Municipality name too long')
    .trim(),
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

const validateCreateProduct = [
  body('title')
    .notEmpty()
    .withMessage('Product title is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Title must be between 2 and 255 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description is too long')
    .trim(),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('originalQuantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a positive integer'),
  body('unit')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Unit is too long')
    .trim(),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category is too long')
    .trim()
];

const validateUpdateProduct = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid product ID'),
  body('title')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Title must be between 2 and 255 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description is too long')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('originalQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a positive integer'),
  body('unit')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Unit is too long')
    .trim(),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category is too long')
    .trim()
];

const validateUpdateOrderStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['approved', 'declined', 'delivered'])
    .withMessage('Status must be either approved, declined, or delivered'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes are too long')
    .trim()
];

const validateSendMessage = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid conversation ID'),
  body('body')
    .notEmpty()
    .withMessage('Message body is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim(),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Invalid message type')
];

const validateCreateConversation = [
  body('participantId')
    .notEmpty()
    .withMessage('Participant ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid participant ID')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateOTP,
  validateUpdateProfile,
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateOrderStatus,
  validateSendMessage,
  validateCreateConversation,
  // Export helper functions for use in other parts of the app
  cleanPhoneNumber,
  validateTunisianPhone
};