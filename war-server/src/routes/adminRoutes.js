const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');

// Admin check route
router.get('/check', auth, adminAuth, adminController.checkAdmin);

module.exports = router;
