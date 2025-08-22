// src/routes/serviceRoutes.js
const express = require('express');
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware('farmer'));

router.get('/', serviceController.getServices);
router.get('/categories', serviceController.getServiceCategories);
router.get('/:id', serviceController.getServiceDetails);

module.exports = router;