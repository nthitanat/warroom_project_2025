const express = require('express');
const router = express.Router();
const charityItemController = require('../controllers/charityItemController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes
// Get all items (admin view - can filter by charity_id)
router.get('/', charityItemController.getAllItems);

// Get item by ID
router.get('/:id', charityItemController.getItemById);

// Get items for a specific charity
router.get('/charity/:charityId', charityItemController.getCharityItems);

// Admin routes
// Create item for a charity
router.post('/charity/:charityId', auth, adminAuth, charityItemController.createItem);

// Update item
router.put('/:id', auth, adminAuth, charityItemController.updateItem);

// Update item quantity (add/subtract)
router.patch('/:id/quantity', auth, adminAuth, charityItemController.updateItemQuantity);

// Delete item
router.delete('/:id', auth, adminAuth, charityItemController.deleteItem);

module.exports = router;
