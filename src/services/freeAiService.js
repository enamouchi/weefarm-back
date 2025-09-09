const axios = require('axios');

class FreeAiService {
    constructor() {
        this.huggingFaceUrl = 'https://api-inference.huggingface.co/models/';
        this.token = process.env.HUGGINGFACE_TOKEN;
        this.cache = new Map();
    }

    async getArabicFarmingResponse(question) {
        try {
            // Check cache first
            const cacheKey = question.toLowerCase().trim();
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Try Hugging Face API
            let response = null;
            if (this.token) {
                response = await this.tryHuggingFaceAPI(question);
            }

            // Fallback to local responses
            if (!response) {
                response = this.getLocalArabicResponse(question);
            }

            // Cache the response
            this.cache.set(cacheKey, response);
            if (this.cache.size > 100) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            return response;

        } catch (error) {
            console.error('AI Service error:', error);
            return this.getLocalArabicResponse(question);
        }
    }

    async tryHuggingFaceAPI(question) {
        try {
            const response = await axios.post(
                this.huggingFaceUrl + 'microsoft/DialoGPT-medium',
                { 
                    inputs: `Farming question in Arabic: ${question}`,
                    parameters: { 
                        max_length: 200, 
                        temperature: 0.7,
                        do_sample: true 
                    }
                },
                { 
                    headers: { 
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json' 
                    },
                    timeout: 10000 
                }
            );
            
            if (response.data && response.data.generated_text) {
                return this.translateToArabic(response.data.generated_text);
            }
            
            return null;
        } catch (error) {
            console.log('Hugging Face API error:', error.message);
            return null;
        }
    }

    translateToArabic(englishText) {
        // Simple translation mapping for common terms
        const translations = {
            'tomato': 'طماطم',
            'olive': 'زيتون', 
            'water': 'مياه',
            'plant': 'نبات',
            'disease': 'مرض',
            'fertilizer': 'سماد'
        };
        
        let arabicText = englishText;
        Object.entries(translations).forEach(([en, ar]) => {
            arabicText = arabicText.replace(new RegExp(en, 'gi'), ar);
        });
        
        return arabicText;
    }

    getLocalArabicResponse(question) {
        const q = question.toLowerCase().trim();
        
        // Comprehensive Arabic farming knowledge base
        const responses = {
            // Greetings
            'مرحب': 'مرحبا بك في مساعد المزارع الذكي! كيف يمكنني مساعدتك في أمور الزراعة اليوم؟',
            'أهلا': 'أهلا وسهلا! أنا هنا لمساعدتك في جميع استفساراتك الزراعية.',
            'السلام': 'وعليكم السلام ورحمة الله وبركاته. كيف يمكنني خدمتك؟',
            
            // Crops - Tunisian specific
            'طماطم': 'الطماطم في تونس تزرع موسمين: ربيعي (فبراير-مارس) وخريفي (أغسطس-سبتمبر). تحتاج ري منتظم وحماية من الحشرات.',
            'بندورة': 'البندورة تحتاج تربة جيدة التصريف وري بالتنقيط. احذر من دودة الطماطم والذبابة البيضاء.',
            'زيتون': 'الزيتون ثروة تونس! يحتاج تقليم شتوي وري معتدل. أفضل الأصناف: الشتوي والشملالي والزرازي.',
            'حمضيات': 'الحمضيات تنمو جيدا في المناطق الساحلية. تحتاج حماية من الصقيع وتسميد منتظم.',
            'برتقال': 'البرتقال يحتاج مناخ معتدل وري منتظم. احذر من حشرة البق الدقيقي.',
            'ليمون': 'الليمون ينتج طوال السنة. يحتاج تسميد آزوتي وحماية من الرياح القوية.',
            'قمح': 'القمح يزرع في نوفمبر-ديسمبر ويحصد في يونيو. مناسب للمناطق الشمالية ذات الأمطار الكافية.',
            'شعير': 'الشعير أكثر تحملا للجفاف من القمح. مناسب للمناطق الجافة ويزرع في الخريف.',
            'فلفل': 'الفلفل يحتاج حرارة معتدلة وحماية من الرياح. يزرع ربيعا في البيوت المحمية.',
            
            // Irrigation & Water
            'ري': 'في المناخ التونسي استخدم الري بالتنقيط لتوفير المياه. أفضل أوقات الري: الصباح الباكر أو المساء.',
            'مياه': 'إدارة المياه مهمة جدا في تونس. استخدم تقنيات حفظ المياه والري الذكي.',
            'تنقيط': 'الري بالتنقيط يوفر 30-50% من المياه ويزيد الإنتاج. استثمار مربح طويل المدى.',
            'رش': 'الري بالرش مناسب للمحاصيل الحقلية. تجنبه في الأيام العاصفة.',
            
            // Fertilizers & Soil
            'سماد': 'استخدم السماد العضوي في الشتاء والكيميائي في موسم النمو. تجنب الإفراط في التسميد.',
            'كمبوست': 'الكمبوست ممتاز لتحسين التربة التونسية. اصنعه من مخلفات النباتات والمطبخ.',
            'آزوت': 'السماد الآزوتي ضروري للنمو الخضري. استخدمه باعتدال لتجنب الترف.',
            'فوسفور': 'الفوسفور مهم للجذور والإزهار. ضروري في بداية الزراعة.',
            'بوتاسيوم': 'البوتاسيوم يحسن جودة الثمار ومقاومة الأمراض.',
            
            // Pests & Diseases
            'آفات': 'الوقاية خير من العلاج. افحص النباتات يوميا واستخدم المبيدات الطبيعية أولا.',
            'حشرات': 'استخدم المصائد الفرمونية والمبيدات الحيوية قبل الكيميائية.',
            'مرض': 'أغلب أمراض النباتات سببها الرطوبة الزائدة. حسن التهوية والصرف.',
            'فطريات': 'الفطريات تنتشر في الرطوبة. استخدم مبيدات فطرية وقائية.',
            'بكتيريا': 'الأمراض البكتيرية صعبة العلاج. ركز على الوقاية والنظافة.',
            
            // Weather & Climate
            'طقس': 'راقب توقعات الطقس يوميا. في الصيف احم النباتات من الحر الشديد.',
            'مناخ': 'المناخ التونسي متوسطي مع صيف حار وجاف. اختر أصنافا متكيفة.',
            'صقيع': 'احم النباتات من الصقيع بالري قبل الغروب أو بالأغطية.',
            'رياح': 'الرياح القوية تضر النباتات. استخدم مصدات الرياح.',
            'حرارة': 'الحرارة الزائدة تجهد النباتات. وفر الظل والري الكافي.',
            
            // Seasonal advice
            'شتاء': 'الشتاء وقت الراحة للنباتات. قم بالتقليم والتسميد العضوي.',
            'ربيع': 'الربيع موسم النمو النشط. ابدأ التسميد الكيميائي والري المنتظم.',
            'صيف': 'الصيف يحتاج ري مكثف وحماية من الشمس الحارقة.',
            'خريف': 'الخريف وقت الزراعة والحصاد. استعد للموسم القادم.',
            
            // Thanks
            'شكر': 'العفو! سعيد لمساعدتك. لا تتردد في السؤال عن أي شيء يخص الزراعة.',
            'متشكر': 'أهلا وسهلا! نجاحك في الزراعة هو هدفي.',
            
            // Market & Economics
            'أسعار': 'أسعار المحاصيل تتغير حسب العرض والطلب. تابع أسعار السوق المركزي.',
            'تسويق': 'سوق المنتجات الزراعية مباشرة للمستهلك يحقق ربح أكبر.',
            'تصدير': 'تونس تصدر الزيتون والحمضيات والتمور. اهتم بالجودة للتصدير.',
        };
        
        // Find matching response
        for (const [keyword, response] of Object.entries(responses)) {
            if (q.includes(keyword)) {
                return response;
            }
        }
        
        // Default response
        return 'يمكنني مساعدتك في الزراعة والري والآفات والأسمدة والأمراض النباتية. اسأل سؤالا محددا وسأحاول مساعدتك بأفضل ما أستطيع. مثلا: "كيف أزرع الطماطم؟" أو "ما علاج آفات الزيتون؟"';
    }
}

module.exports = new FreeAiService();