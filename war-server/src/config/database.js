const mysql = require('mysql2/promise');

// Create connection pool
let pool = null;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST_DEV,
      port: process.env.DB_PORT_DEV || 3306,
      user: process.env.DB_USER_DEV,
      password: process.env.DB_PASSWORD_DEV,
      database: process.env.DB_NAME || 'war_room_db',
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
    // First, connect without database to create it if needed
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST_DEV,
      port: process.env.DB_PORT_DEV || 3306,
      user: process.env.DB_USER_DEV,
      password: process.env.DB_PASSWORD_DEV
    });

    const dbName = process.env.DB_NAME || 'war_room_db';
    
    // Create database if it doesn't exist
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✓ Database '${dbName}' is ready`);
    await tempConnection.end();

    // Now create the pool with the database
    createPool();
    
    // Test the connection
    const connection = await pool.getConnection();
    console.log(`✓ MySQL Connected: ${process.env.DB_HOST_DEV}:${process.env.DB_PORT_DEV}`);
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
