const axios = require('axios');

class FreeAiService {
    constructor() {
        this.baseUrl = 'https://api-inference.huggingface.co/models/';
        this.token = process.env.HUGGINGFACE_TOKEN;
    }

    async getArabicFarmingResponse(question) {
        try {
            // Try Hugging Face first (if token available)
            if (this.token) {
                const response = await this.tryHuggingFace(question);
                if (response) return response;
            }
            
            // Fallback to local knowledge
            return this.getFallbackArabicResponse(question);
        } catch (error) {
            console.log('AI service error:', error.message);
            return this.getFallbackArabicResponse(question);
        }
    }

    async tryHuggingFace(question) {
        try {
            const response = await axios.post(
                `${this.baseUrl}microsoft/DialoGPT-medium`,
                { 
                    inputs: `Farming question: ${question}`,
                    parameters: { max_length: 150, temperature: 0.7 }
                },
                { 
                    headers: { 
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json' 
                    },
                    timeout: 10000 
                }
            );
            
            return response.data.generated_text || null;
        } catch (error) {
            console.log('Hugging Face error:', error.message);
            return null;
        }
    }

    getFallbackArabicResponse(question) {
        const q = question.toLowerCase();
        
        // Enhanced Arabic farming responses
        if (q.includes('طماطم') || q.includes('بندورة')) {
            return 'الطماطم تحتاج زراعة في الربيع مع ري منتظم وحماية من الآفات. أفضل وقت للزراعة في تونس من مارس إلى مايو للحصول على أفضل إنتاج.';
        }
        if (q.includes('زيتون')) {
            return 'الزيتون محصول مهم في تونس. يحتاج مناخ معتدل وري قليل. التقليم في الشتاء مهم للإنتاج الجيد. احذر من ذبابة الزيتون في الصيف.';
        }
        if (q.includes('ري') || q.includes('مياه')) {
            return 'استخدم الري بالتنقيط لتوفير المياه خاصة في المناخ الجاف التونسي. الري في الصباح الباكر أو المساء أفضل لتجنب التبخر.';
        }
        if (q.includes('آفات') || q.includes('حشرات')) {
            return 'افحص النباتات يومياً للكشف المبكر عن الآفات. استخدم المبيدات الطبيعية أولاً مثل زيت النيم. للحالات الشديدة استشر خبير زراعي.';
        }
        if (q.includes('سماد')) {
            return 'السماد العضوي في الشتاء والكيميائي في موسم النمو. تجنب الإفراط في التسميد لأنه يضر النبات ويلوث التربة.';
        }
        if (q.includes('طقس') || q.includes('مناخ')) {
            return 'راقب توقعات الطقس يومياً. في الصيف احمِ النباتات من الحر الشديد بالظلال أو الرش. في الشتاء احذر الصقيع.';
        }
        if (q.includes('مرحب') || q.includes('أهلا') || q.includes('السلام')) {
            return 'مرحبا بك في مساعد المزارع الذكي! 🌱 أنا هنا لمساعدتك في جميع أمور الزراعة. كيف يمكنني مساعدتك اليوم؟';
        }
        if (q.includes('شكر') || q.includes('متشكر')) {
            return 'العفو! سعيد لمساعدتك. لا تتردد في سؤالي عن أي شيء يخص الزراعة. نجاحك في الزراعة هو هدفي! 🚜';
        }
        
        return 'يمكنني مساعدتك في الزراعة والري والآفات والأسمدة. اسأل سؤالاً محدداً وسأحاول مساعدتك بأفضل ما أستطيع. 🌾';
    }
}

module.exports = new FreeAiService();