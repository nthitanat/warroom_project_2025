const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const { initializeTables } = require('./models');

// Load environment variables
dotenv.config();

// Determine if we're in production or development mode
const isProduction = process.env.DEPLOYMENT_MODE === 'production' || process.env.NODE_ENV === 'production';

// Get environment-specific configuration
const getEnvConfig = () => {
  if (isProduction) {
    return {
      jwtSecret: process.env.PROD_JWT_SECRET,
      jwtExpiresIn: process.env.PROD_JWT_EXPIRES_IN,
      corsOrigin: process.env.PROD_CORS_ORIGIN,
      dbName: process.env.PROD_DB_NAME
    };
  } else {
    return {
      jwtSecret: process.env.DEV_JWT_SECRET,
      jwtExpiresIn: process.env.DEV_JWT_EXPIRES_IN,
      corsOrigin: process.env.DEV_CORS_ORIGIN,
      dbName: process.env.DEV_DB_NAME
    };
  }
};

const envConfig = getEnvConfig();

const app = express();

// Initialize database and tables
const initializeServer = async () => {
  try {
    // Connect to MySQL database
    await connectDB();
    
    // Initialize all tables
    await initializeTables();
    
    console.log('✅ Server initialization complete\n');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
};

// Call initialization
initializeServer();

// Middleware
const corsOptions = {
  origin: envConfig.corsOrigin ? envConfig.corsOrigin.split(',') : '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/charities', require('./routes/charityRoutes'));
app.use('/api/charity-items', require('./routes/charityItemRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/warroom', require('./routes/warroomRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'War Room Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  const mode = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`\n🚀 War Room Server is running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${mode}`);
  console.log(`💾 Database: ${envConfig.dbName || 'war_room_db'}`);
  console.log(`🔒 CORS: ${envConfig.corsOrigin || '*'}`);
  console.log(`\n✨ Ready to accept requests\n`);
});
