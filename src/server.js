// src/server.js
require('dotenv').config({ path: './src/.env' }); // AJOUTER CETTE LIGNE

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./models');
const EnvironmentValidator = require('./utils/environmentValidator');
const errorMiddleware = require('./middleware/errorMiddleware');

// Existing Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const feedRoutes = require('./routes/feedRoutes');
const messageRoutes = require('./routes/messageRoutes');

// NEW AI Routes
const analyticsRoutes = require('./routes/analyticsRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const plantAnalysisRoutes = require('./routes/plantAnalysisRoutes');

const app = express();

// Validate environment on startup
EnvironmentValidator.validateAll();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

// Security middleware
app.use(helmet());
app.use(cors({
  // origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  origin: "*",
  credentials: true
}));

// Rate limiting (increased for AI features)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for AI requests
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// Body parsing middleware (already set to 10mb for image uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enhanced Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Connected',
      services: {
        ai: 'ready',
        plantnet: process.env.PLANTNET_API_KEY ? 'configured' : 'not configured',
        huggingface: process.env.HUGGINGFACE_TOKEN ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Disconnected'
    });
  }
});

// Existing API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/conversations', messageRoutes);
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));

// NEW AI API routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/plant-analysis', plantAnalysisRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

let server;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ force: false });
    console.log('Database models synchronized.');

    server = app.listen(PORT, () => {
      console.log(`🚀 WeeFarm Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌱 AI Services: ${process.env.PLANTNET_API_KEY ? '✅' : '❌'} PlantNet | ${process.env.HUGGINGFACE_TOKEN ? '✅' : '❌'} HuggingFace`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/api/analytics/dashboard`);
      console.log(`🤖 Chatbot: http://localhost:${PORT}/api/chatbot/chat`);
      console.log(`📸 Plant Analysis: http://localhost:${PORT}/api/plant-analysis/analyze`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      sequelize.close().then(() => {
        console.log('Database connection closed.');
        process.exit(0);
      });
    });
  }
};

startServer();

module.exports = app;