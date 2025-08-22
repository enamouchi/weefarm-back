// src/routes/orderRoutes.js
const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateUpdateOrderStatus } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authMiddleware('farmer'));

router.get('/incoming', orderController.getIncomingOrders);
router.get('/:id', orderController.getOrderDetails);
router.put('/:id/status', validateUpdateOrderStatus, orderController.updateOrderStatus);

module.exports = router;