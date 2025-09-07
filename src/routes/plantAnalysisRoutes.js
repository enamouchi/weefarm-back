const express = require('express');
const { uploadImage, analyzePlant } = require('../controllers/plantAnalysisController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/plant-analysis/analyze
 * @desc    Upload an image and analyze plant health
 * @access  Private (JWT required)
 */
router.post('/analyze', authMiddleware, uploadImage, analyzePlant);

module.exports = router;
