const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Determine if we're in production or development mode
const isProduction = process.env.DEPLOYMENT_MODE === 'production' || process.env.NODE_ENV === 'production';

// Get JWT configuration based on environment
const getJWTConfig = () => {
  if (isProduction) {
    return {
      secret: process.env.PROD_JWT_SECRET,
      expiresIn: process.env.PROD_JWT_EXPIRES_IN || '24h'
    };
  } else {
    return {
      secret: process.env.DEV_JWT_SECRET,
      expiresIn: process.env.DEV_JWT_EXPIRES_IN || '24h'
    };
  }
};

// Generate JWT Token
const generateToken = (userId) => {
  const config = getJWTConfig();
  return jwt.sign({ id: userId }, config.secret, {
    expiresIn: config.expiresIn,
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    const config = getJWTConfig();
    return jwt.verify(token, config.secret);
  } catch (error) {
    return null;
  }
};

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'User account is inactive' });
    }
    
    // Remove password from user object
    delete user.password;
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Admin Middleware
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(403).json({ message: 'Admin authorization failed' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  auth,
  adminAuth,
};
