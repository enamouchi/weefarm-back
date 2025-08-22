// src/middleware/validationMiddleware.js
const { body, param, query } = require('express-validator');

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
    .matches(/^[+]?[0-9]{8,15}$/)
    .withMessage('Please provide a valid phone number')
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

const validateLogin = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
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
    .matches(/^[+]?[0-9]{8,15}$/)
    .withMessage('Please provide a valid phone number')
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
  validateCreateConversation
};