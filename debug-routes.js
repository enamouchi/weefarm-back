// quick-test-routes.js
const express = require('express');

const routeFiles = [
  './src/routes/authRoutes',
  './src/routes/userRoutes', 
  './src/routes/productRoutes',
  './src/routes/orderRoutes',
  './src/routes/messageRoutes',
  './src/routes/serviceRoutes',
  './src/routes/feedRoutes'
];

console.log('🧪 Testing route files individually...\n');

routeFiles.forEach(routeFile => {
  try {
    console.log(`Testing ${routeFile}...`);
    const app = express();
    const routes = require(routeFile);
    app.use('/test', routes);
    console.log(`✅ ${routeFile} - OK\n`);
  } catch (error) {
    console.log(`❌ ${routeFile} - ERROR:`);
    console.log(error.message);
    console.log('---');
    if (error.stack) {
      console.log(error.stack);
    }
    console.log('\n');
  }
});

console.log('🏁 Test complete!');