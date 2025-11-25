const express = require('express');
const router = express.Router();
const warroomController = require('../controllers/warroomController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/', warroomController.getWarroomEntries);
router.get('/:id', warroomController.getWarroomById);

// Admin routes
router.post('/', auth, adminAuth, warroomController.createWarroomEntry);
router.put('/:id', auth, adminAuth, warroomController.updateWarroomEntry);
router.delete('/:id', auth, adminAuth, warroomController.deleteWarroomEntry);

module.exports = router;
