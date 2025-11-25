const Lesson = require('../models/Lesson');

// Get all lessons
exports.getLessons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', playlist_id = '', recommend } = req.query;

    // Build filters for MySQL
    let filters = { isActive: true };

    if (playlist_id) {
      filters.playlist_id = playlist_id;
    }

    if (recommend !== undefined && recommend !== '') {
      filters.recommend = recommend === 'true';
    }

    // Get all lessons with filters
    let lessons = await Lesson.findAll(filters);

    // Apply search filter in JavaScript
    if (search) {
      const searchLower = search.toLowerCase();
      lessons = lessons.filter(lesson => 
        (lesson.title && lesson.title.toLowerCase().includes(searchLower)) ||
        (lesson.description && lesson.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort by createdAt descending
    lessons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = lessons.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLessons = lessons.slice(skip, skip + parseInt(limit));

    res.json({
      lessons: paginatedLessons,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        totalLessons: total,
      }
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get lesson by ID
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson || !lesson.isActive) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({ lesson });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create lesson (Admin only)
exports.createLesson = async (req, res) => {
  try {
    const lessonData = req.body;

    // Validate required fields
    const requiredFields = ['img', 'title', 'videoLink', 'authors', 'size', 'playlist_id'];
    for (const field of requiredFields) {
      if (!lessonData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // MySQL auto-increments ID
    const lesson = await Lesson.create(lessonData);

    res.status(201).json({
      message: 'Lesson created successfully',
      lesson
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update lesson (Admin only)
exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.update(req.params.id, req.body);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({
      message: 'Lesson updated successfully',
      lesson
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete lesson (Admin only)
exports.deleteLesson = async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const lesson = await Lesson.update(req.params.id, { isActive: false });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Serve lesson thumbnail by lesson ID
exports.getLessonThumbnail = async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const lessonId = req.params.id;
    
    if (!lessonId) {
      return res.status(400).json({ message: 'Lesson ID is required' });
    }

    // Construct the path to the thumbnail folder
    const thumbnailDir = path.join(__dirname, '../../public/lessons/thumbnails', lessonId);
    
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
      return res.status(404).json({ message: 'No thumbnail found for this lesson' });
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
    console.error('Get lesson thumbnail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Serve author avatar by author ID
exports.getAuthorAvatar = async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const authorId = req.params.authorId;
    
    if (!authorId) {
      return res.status(400).json({ message: 'Author ID is required' });
    }

    // Construct the path to the author avatar folder
    const avatarDir = path.join(__dirname, '../../public/lessons/authors', authorId);
    
    // Check if directory exists
    if (!fs.existsSync(avatarDir)) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    // Read directory to find image files
    const files = fs.readdirSync(avatarDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    // Look for avatar.png first (default), then any image file
    let imageFile = files.find(file => file === 'avatar.png');
    if (!imageFile) {
      imageFile = files.find(file => 
        imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
      );
    }

    if (!imageFile) {
      return res.status(404).json({ message: 'No avatar found for this author' });
    }

    const imagePath = path.join(avatarDir, imageFile);

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
    console.error('Get author avatar error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
