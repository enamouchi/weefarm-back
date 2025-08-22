// test-config.js
require('dotenv').config({ path: './src/.env' });

console.log('🔍 Test de configuration:');
console.log('✅ DB_NAME:', process.env.DB_NAME);
console.log('✅ DB_USER:', process.env.DB_USER);
console.log('✅ DB_PASS:', process.env.DB_PASS ? '***masqué***' : '❌ MANQUANT');
console.log('✅ JWT_SECRET:', process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 8)}...` : '❌ MANQUANT');
console.log('✅ JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? `${process.env.JWT_REFRESH_SECRET.substring(0, 8)}...` : '❌ MANQUANT');
console.log('✅ PORT:', process.env.PORT);

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.log('⚠️  JWT_SECRET trop court (minimum 32 caractères)');
}

if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.log('⚠️  JWT_SECRET et JWT_REFRESH_SECRET doivent être différents');
}