const mysql = require('mysql2/promise');

// Create connection pool
let pool = null;

// Determine if we're in production or development mode
const isProduction = process.env.DEPLOYMENT_MODE === 'production' || process.env.NODE_ENV === 'production';

// Get the appropriate environment variables based on deployment mode
const getConfig = () => {
  if (isProduction) {
    return {
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT || 3306,
      user: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      database: process.env.PROD_DB_NAME || 'war_room_db'
    };
  } else {
    return {
      host: process.env.DEV_DB_HOST,
      port: process.env.DEV_DB_PORT || 3306,
      user: process.env.DEV_DB_USER,
      password: process.env.DEV_DB_PASSWORD,
      database: process.env.DEV_DB_NAME || 'war_room_db'
    };
  }
};

const createPool = () => {
  if (!pool) {
    const config = getConfig();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool;
};

const connectDB = async () => {
  try {
    const config = getConfig();
    const mode = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
    
    console.log(`🔧 Connecting to database in ${mode} mode...`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    
    // First, connect without database to create it if needed
    const tempConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });

    const dbName = config.database;
    
    // Create database if it doesn't exist
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✓ Database '${dbName}' is ready`);
    await tempConnection.end();

    // Now create the pool with the database
    createPool();
    
    // Test the connection
    const connection = await pool.getConnection();
    console.log(`✓ MySQL Connected (${mode}): ${config.host}:${config.port}`);
    connection.release();
  } catch (error) {
    console.error(`✗ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    createPool();
  }
  return pool;
};

module.exports = { connectDB, getPool };
