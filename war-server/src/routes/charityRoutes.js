const express = require('express');
const router = express.Router();
const charityController = require('../controllers/charityController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/', charityController.getCharities);
router.get('/:id', charityController.getCharityById);

// Get slides for a specific charity (public)
router.get('/:id/slides', charityController.getCharitySlides);

// Get charity slide image by slide ID (public)
router.get('/slides/:slideId/image', charityController.getCharitySlideImage);

// Get charity thumbnail by charity ID (public)
router.get('/:id/thumbnail', charityController.getCharityThumbnail);

// Admin routes
router.post('/', auth, adminAuth, charityController.createCharity);
router.put('/:id', auth, adminAuth, charityController.updateCharity);
router.delete('/:id', auth, adminAuth, charityController.deleteCharity);

module.exports = router;
