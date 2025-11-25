const Warroom = require('../models/Warroom');

// Get all warroom entries
exports.getWarroomEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    // Build filters for MySQL
    let filters = { isActive: true };

    if (status !== undefined && status !== '') {
      filters.status = parseInt(status);
    }

    // Get all entries with filters
    let entries = await Warroom.findAll(filters);

    // Apply search filter in JavaScript (since MySQL model doesn't have regex)
    if (search) {
      const searchLower = search.toLowerCase();
      entries = entries.filter(entry => 
        (entry.title && entry.title.toLowerCase().includes(searchLower)) ||
        (entry.description && entry.description.toLowerCase().includes(searchLower)) ||
        (entry.location && entry.location.toLowerCase().includes(searchLower))
      );
    }

    // Sort by date descending
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Apply pagination
    const total = entries.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedEntries = entries.slice(skip, skip + parseInt(limit));

    res.json({
      entries: paginatedEntries,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        totalEntries: total,
      }
    });
  } catch (error) {
    console.error('Get warroom entries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get warroom entry by ID
exports.getWarroomById = async (req, res) => {
  try {
    const entry = await Warroom.findById(req.params.id);

    if (!entry || !entry.isActive) {
      return res.status(404).json({ message: 'Warroom entry not found' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Get warroom entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create warroom entry (Admin only)
exports.createWarroomEntry = async (req, res) => {
  try {
    const entryData = req.body;

    // Validate required fields
    const requiredFields = ['title', 'date', 'location'];
    for (const field of requiredFields) {
      if (!entryData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // MySQL auto-increments ID, no need to generate it
    const entry = await Warroom.create(entryData);

    res.status(201).json({
      message: 'Warroom entry created successfully',
      entry
    });
  } catch (error) {
    console.error('Create warroom entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update warroom entry (Admin only)
exports.updateWarroomEntry = async (req, res) => {
  try {
    const entry = await Warroom.update(req.params.id, req.body);

    if (!entry) {
      return res.status(404).json({ message: 'Warroom entry not found' });
    }

    res.json({
      message: 'Warroom entry updated successfully',
      entry
    });
  } catch (error) {
    console.error('Update warroom entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete warroom entry (Admin only)
exports.deleteWarroomEntry = async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const entry = await Warroom.update(req.params.id, { isActive: false });

    if (!entry) {
      return res.status(404).json({ message: 'Warroom entry not found' });
    }

    res.json({ message: 'Warroom entry deleted successfully' });
  } catch (error) {
    console.error('Delete warroom entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
