const Charity = require('../models/Charity');
const CharitySlide = require('../models/CharitySlide');

// Get all charities
exports.getCharities = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    // Build filters for MySQL
    let filters = { isActive: true };

    if (status) {
      filters.status = status;
    }

    // Get all charities with filters
    let charities = await Charity.findAll(filters);

    // Apply search filter in JavaScript
    if (search) {
      const searchLower = search.toLowerCase();
      charities = charities.filter(charity => 
        (charity.title && charity.title.toLowerCase().includes(searchLower)) ||
        (charity.description && charity.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort by createdAt descending
    charities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = charities.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedCharities = charities.slice(skip, skip + parseInt(limit));

    res.json({
      charities: paginatedCharities,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        totalCharities: total,
      }
    });
  } catch (error) {
    console.error('Get charities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get charity by ID
exports.getCharityById = async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);

    if (!charity || !charity.isActive) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    res.json({ charity });
  } catch (error) {
    console.error('Get charity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get slides for a specific charity
exports.getCharitySlides = async (req, res) => {
  try {
    const charityId = req.params.id;
    
    if (!charityId) {
      return res.status(400).json({ message: 'Charity ID is required' });
    }

    // Fetch slides from database
    const slides = await CharitySlide.findByCharityId(charityId);

    res.json({ slides });
  } catch (error) {
    console.error('Get charity slides error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create charity (Admin only)
exports.createCharity = async (req, res) => {
  try {
    const charityData = req.body;

    // Validate required fields
    const requiredFields = ['title', 'expected_fund', 'img'];
    for (const field of requiredFields) {
      if (!charityData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // MySQL auto-increments ID
    const charity = await Charity.create(charityData);

    res.status(201).json({
      message: 'Charity created successfully',
      charity
    });
  } catch (error) {
    console.error('Create charity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update charity (Admin only)
exports.updateCharity = async (req, res) => {
  try {
    const charity = await Charity.update(req.params.id, req.body);

    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    res.json({
      message: 'Charity updated successfully',
      charity
    });
  } catch (error) {
    console.error('Update charity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete charity (Admin only)
exports.deleteCharity = async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const charity = await Charity.update(req.params.id, { isActive: false });

    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    res.json({ message: 'Charity deleted successfully' });
  } catch (error) {
    console.error('Delete charity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Serve charity slide images by slide ID
exports.getCharitySlideImage = async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const slideId = req.params.slideId;
    
    if (!slideId) {
      return res.status(400).json({ message: 'Slide ID is required' });
    }

    // Construct the path to the slide folder
    const slideDir = path.join(__dirname, '../../public/charities/slides', slideId);
    
    // Check if directory exists
    if (!fs.existsSync(slideDir)) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Read directory to find image files
    const files = fs.readdirSync(slideDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    // Look for image.png first (default), then any image file
    let imageFile = files.find(file => file === 'image.png');
    if (!imageFile) {
      imageFile = files.find(file => 
        imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
      );
    }

    if (!imageFile) {
      return res.status(404).json({ message: 'No image found for this slide' });
    }

    const imagePath = path.join(slideDir, imageFile);

    // Set appropriate content type based on file extension
    const ext = path.extname(imageFile).toLowerCase();
    const contentTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'image/png');
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Get charity slide image error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Serve charity thumbnail by charity ID
exports.getCharityThumbnail = async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const charityId = req.params.id;
    
    if (!charityId) {
      return res.status(400).json({ message: 'Charity ID is required' });
    }

    // Construct the path to the thumbnail folder
    const thumbnailDir = path.join(__dirname, '../../public/charities/thumbnails', charityId);
    
    // Check if directory exists
    if (!fs.existsSync(thumbnailDir)) {
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    // Read directory to find image files
    const files = fs.readdirSync(thumbnailDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    // Look for thumbnail.png first (default), then any image file
    let imageFile = files.find(file => file === 'thumbnail.png');
    if (!imageFile) {
      imageFile = files.find(file => 
        imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
      );
    }

    if (!imageFile) {
      return res.status(404).json({ message: 'No thumbnail found for this charity' });
    }

    const imagePath = path.join(thumbnailDir, imageFile);

    // Set appropriate content type based on file extension
    const ext = path.extname(imageFile).toLowerCase();
    const contentTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'image/png');
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Get charity thumbnail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
