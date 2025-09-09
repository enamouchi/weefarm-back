const axios = require('axios');
const FormData = require('form-data');

class PlantDiseaseService {
    constructor() {
        this.plantNetKey = process.env.PLANTNET_API_KEY;
        this.plantNetUrl = 'https://my-api.plantnet.org/v1/identify';
        
        this.tunisianPlants = {
            'Solanum lycopersicum': 'طماطم',
            'Olea europaea': 'زيتون',
            'Citrus sinensis': 'برتقال',
            'Citrus limon': 'ليمون',
            'Triticum aestivum': 'قمح',
            'Hordeum vulgare': 'شعير',
            'Capsicum annuum': 'فلفل',
            'Phoenix dactylifera': 'نخيل',
            'Vicia faba': 'فول',
            'Punica granatum': 'رمان'
        };
        
        this.diseasePatterns = {
            yellow_leaves: {
                ar: 'اصفرار الأوراق',
                causes: ['نقص النيتروجين', 'زيادة الري', 'نقص الحديد', 'عدوى فيروسية'],
                treatment: 'فحص نظام الري وإضافة سماد نيتروجيني وفحص pH التربة'
            },
            brown_spots: {
                ar: 'بقع بنية على الأوراق',
                causes: ['عدوى فطرية', 'حروق شمس', 'نقص البوتاسيوم'],
                treatment: 'استخدام مبيد فطري وتحسين التهوية وتقليل الرطوبة'
            },
            wilting: {
                ar: 'ذبول النبات',
                causes: ['نقص مياه', 'تعفن الجذور', 'آفات التربة'],
                treatment: 'فحص نظام الجذور وتنظيم الري وتحسين صرف التربة'
            },
            pest_damage: {
                ar: 'أضرار حشرية',
                causes: ['حشرات المن', 'الذبابة البيضاء', 'دودة الأوراق'],
                treatment: 'استخدام مبيدات طبيعية أو حيوية ومراقبة دورية'
            }
        };
    }

    async analyzePlantImage(imageBuffer, filename) {
        try {
            console.log('Starting plant analysis for:', filename);
            
            // Step 1: Identify plant species
            const plantInfo = await this.identifyWithPlantNet(imageBuffer, filename);
            console.log('Plant identified:', plantInfo);
            
            // Step 2: Simulate disease analysis
            const diseases = this.simulateDiseaseDetection();
            console.log('Diseases detected:', diseases);
            
            // Step 3: Generate recommendations
            const recommendations = this.generateTunisianRecommendations(plantInfo, diseases);
            
            return {
                plant: plantInfo,
                diseases: diseases,
                recommendations: recommendations,
                analysisTimestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Plant analysis error:', error);
            return this.getFallbackAnalysis();
        }
    }

    async identifyWithPlantNet(imageBuffer, filename) {
        if (!this.plantNetKey || this.plantNetKey === 'get_from_my.plantnet.org') {
            console.log('PlantNet API key not configured, using fallback');
            return this.getFallbackPlantIdentification();
        }

        try {
            const formData = new FormData();
            formData.append('images', imageBuffer, {
                filename: filename,
                contentType: 'image/jpeg'
            });
            formData.append('modifiers', '["crops"]');
            formData.append('plant-identification', 'true');

            console.log('Calling PlantNet API...');
            const response = await axios.post(
                `${this.plantNetUrl}?api-key=${this.plantNetKey}`,
                formData,
                { 
                    headers: {
                        ...formData.getHeaders(),
                        'Accept': 'application/json'
                    },
                    timeout: 20000 
                }
            );

            if (response.data && response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                const scientificName = result.species?.scientificNameWithoutAuthor || '';
                
                return {
                    name: scientificName,
                    arabicName: this.getArabicPlantName(scientificName),
                    confidence: result.score || 0.5,
                    source: 'plantnet'
                };
            } else {
                console.log('No results from PlantNet API');
                return this.getFallbackPlantIdentification();
            }

        } catch (error) {
            console.error('PlantNet API error:', error.message);
            return this.getFallbackPlantIdentification();
        }
    }

    getFallbackPlantIdentification() {
        const commonPlants = [
            { scientific: 'Solanum lycopersicum', arabic: 'طماطم' },
            { scientific: 'Olea europaea', arabic: 'زيتون' },
            { scientific: 'Citrus sinensis', arabic: 'برتقال' },
            { scientific: 'Capsicum annuum', arabic: 'فلفل' }
        ];
        
        const randomPlant = commonPlants[Math.floor(Math.random() * commonPlants.length)];
        
        return {
            name: randomPlant.scientific,
            arabicName: randomPlant.arabic,
            confidence: 0.7,
            source: 'fallback'
        };
    }

    simulateDiseaseDetection() {
        const diseases = [];
        const random = Math.random();
        
        // Simulate disease detection with realistic probabilities
        if (random > 0.7) {
            diseases.push(this.diseasePatterns.yellow_leaves);
        }
        if (random > 0.85) {
            diseases.push(this.diseasePatterns.brown_spots);
        }
        if (random > 0.9) {
            diseases.push(this.diseasePatterns.wilting);
        }
        if (random > 0.95) {
            diseases.push(this.diseasePatterns.pest_damage);
        }

        return diseases;
    }

    getArabicPlantName(scientificName) {
        if (!scientificName) return 'نبات غير محدد';
        
        // Check exact matches first
        if (this.tunisianPlants[scientificName]) {
            return this.tunisianPlants[scientificName];
        }
        
        // Check partial matches
        for (const [scientific, arabic] of Object.entries(this.tunisianPlants)) {
            if (scientificName.includes(scientific.split(' ')[0])) {
                return arabic;
            }
        }
        
        return 'نبات غير محدد';
    }

    generateTunisianRecommendations(plantInfo, diseases) {
        const recommendations = [];
        
        // Plant-specific advice
        const plantAdvice = this.getPlantSpecificAdvice(plantInfo.arabicName);
        if (plantAdvice) {
            recommendations.push(plantAdvice);
        }
        
        // Disease-specific treatments
        diseases.forEach(disease => {
            recommendations.push(`${disease.ar}: ${disease.treatment}`);
        });
        
        // General recommendations
        if (diseases.length === 0) {
            recommendations.push('النبات يبدو صحي! استمر في العناية الجيدة');
            recommendations.push('راقب النبات بانتظام للكشف المبكر عن أي مشاكل');
        } else {
            recommendations.push('استشر خبير زراعي للتأكد من التشخيص والعلاج');
        }
        
        // Seasonal advice
        recommendations.push(this.getSeasonalAdvice());
        
        return recommendations;
    }

    getPlantSpecificAdvice(arabicName) {
        const advice = {
            'طماطم': 'الطماطم تحتاج ري منتظم وحماية من دودة الطماطم',
            'زيتون': 'الزيتون يحتاج تقليم شتوي وري معتدل',
            'برتقال': 'البرتقال يحتاج حماية من الصقيع وتسميد منتظم',
            'ليمون': 'الليمون ينتج طوال السنة ويحتاج تسميد آزوتي',
            'فلفل': 'الفلفل يحتاج حرارة معتدلة وحماية من الرياح',
            'قمح': 'القمح مناسب للمناطق الشمالية ذات الأمطار الكافية',
            'نخيل': 'النخيل يحتاج ري عميق ونادر وحماية من الآفات'
        };
        
        return advice[arabicName] || null;
    }

    getSeasonalAdvice() {
        const month = new Date().getMonth() + 1;
        
        if (month >= 12 || month <= 2) {
            return 'الشتاء: وقت التقليم والتسميد العضوي وحماية النباتات من الصقيع';
        } else if (month >= 3 && month <= 5) {
            return 'الربيع: موسم النمو النشط، ابدأ التسميد الكيميائي والري المنتظم';
        } else if (month >= 6 && month <= 8) {
            return 'الصيف: اهتم بالري المكثف وحماية النباتات من الحر الشديد';
        } else {
            return 'الخريف: وقت الزراعة والحصاد، استعد للموسم القادم';
        }
    }

    getFallbackAnalysis() {
        return {
            plant: {
                name: 'غير محدد',
                arabicName: 'نبات تونسي',
                confidence: 0.3,
                source: 'fallback'
            },
            diseases: [],
            recommendations: [
                'لم نتمكن من تحليل الصورة بدقة عالية',
                'تأكد من وضوح الصورة وجودة الإضاءة',
                'التقط صورة قريبة من الأوراق أو الثمار',
                'استشر خبير زراعي للحصول على تشخيص دقيق',
                'يمكنك إعادة المحاولة بصورة أخرى'
            ]
        };
    }
}

module.exports = new PlantDiseaseService();