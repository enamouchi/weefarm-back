const asyncHandler = require('../utils/asyncHandler');
const multer = require('multer');
const plantDiseaseService = require('../services/plantDiseaseService');

const upload = multer({ 
    memory: true,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

exports.uploadImage = upload.single('plantImage');

exports.analyzePlant = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            success: false,
            error: 'لم يتم رفع صورة' 
        });
    }

    try {
        const analysis = await plantDiseaseService.analyzePlantImage(
            req.file.buffer, 
            req.file.originalname
        );

        res.json({
            success: true,
            analysis,
            message: 'تم تحليل الصورة بنجاح'
        });
    } catch (error) {
        console.error('Plant analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'فشل في تحليل الصورة'
        });
    }
});