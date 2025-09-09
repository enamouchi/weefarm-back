const multer = require('multer');
const plantDiseaseService = require('../services/plantDiseaseService');
const asyncHandler = require('express-async-handler');

const upload = multer({ 
    memory: true,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1 
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم. استخدم JPEG أو PNG فقط'), false);
        }
    }
});

exports.uploadImage = upload.single('plantImage');

exports.analyzePlant = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            success: false,
            error: 'لم يتم رفع صورة. الرجاء اختيار صورة للنبات' 
        });
    }

    try {
        console.log('Analyzing plant image:', req.file.originalname, req.file.size, 'bytes');
        
        const analysis = await plantDiseaseService.analyzePlantImage(
            req.file.buffer, 
            req.file.originalname
        );

        res.json({
            success: true,
            analysis: {
                plant: {
                    name: analysis.plant.name,
                    arabicName: analysis.plant.arabicName,
                    confidence: analysis.plant.confidence
                },
                diseases: analysis.diseases,
                recommendations: analysis.recommendations,
                analysisDate: new Date().toISOString()
            },
            message: 'تم تحليل الصورة بنجاح'
        });

    } catch (error) {
        console.error('Plant analysis error:', error);
        
        res.status(500).json({
            success: false,
            error: 'فشل في تحليل الصورة. حاول مرة أخرى',
            analysis: {
                plant: {
                    name: 'غير محدد',
                    arabicName: 'نبات غير محدد',
                    confidence: 0.1
                },
                diseases: [],
                recommendations: [
                    'لم نتمكن من تحليل الصورة بدقة',
                    'تأكد من وضوح الصورة وجودة الإضاءة',
                    'استشر خبير زراعي للحصول على تشخيص دقيق'
                ]
            }
        });
    }
});
