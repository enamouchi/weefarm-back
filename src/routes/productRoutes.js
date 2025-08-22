// src/routes/productRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateCreateProduct, validateUpdateProduct } = require('../middleware/validationMiddleware');

const router = express.Router();

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG and PNG images are allowed'));
    }
  }
});

router.use(authMiddleware('farmer'));

router.get('/me', productController.getMyProducts);
router.post('/', productUpload.array('images', 5), validateCreateProduct, productController.createProduct);
router.put('/:id', productUpload.array('images', 5), validateUpdateProduct, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;