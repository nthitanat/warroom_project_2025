const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

// Serve analytics data (public)
router.get('/data', analyticsController.getData);
router.get('/village-info', analyticsController.getVillageInfo);

// Serve analytics tiles (public)
router.get('/tiles/*', analyticsController.getTiles);

module.exports = router;
