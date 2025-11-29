const CharityItem = require('../models/CharityItem');
const Charity = require('../models/Charity');

// Get all items for a charity
exports.getCharityItems = async (req, res) => {
  try {
    const charityId = req.params.charityId;
    const { status = '' } = req.query;

    // Verify charity exists
    const charity = await Charity.findById(charityId);
    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    // Build filters
    let filters = { charity_id: charityId, isActive: true };
    if (status) {
      filters.status = status;
    }

    const items = await CharityItem.findAll(filters);

    res.json({
      items,
      total: items.length
    });
  } catch (error) {
    console.error('Get charity items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all items (admin view - across all charities)
exports.getAllItems = async (req, res) => {
  try {
    const { charity_id = '', status = '' } = req.query;

    let filters = { isActive: true };
    if (charity_id) {
      filters.charity_id = charity_id;
    }
    if (status) {
      filters.status = status;
    }

    const items = await CharityItem.findAll(filters);

    res.json({
      items,
      total: items.length
    });
  } catch (error) {
    console.error('Get all items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await CharityItem.findById(req.params.id);

    if (!item || !item.isActive) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create item (Admin only)
exports.createItem = async (req, res) => {
  try {
    const charityId = req.params.charityId;
    const itemData = req.body;

    // Verify charity exists
    const charity = await Charity.findById(charityId);
    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    // Validate required fields
    if (!itemData.name) {
      return res.status(400).json({ message: 'name is required' });
    }
    if (itemData.needed_quantity === undefined || itemData.needed_quantity === null) {
      return res.status(400).json({ message: 'needed_quantity is required' });
    }

    const item = await CharityItem.create({
      ...itemData,
      charity_id: charityId
    });

    res.status(201).json({
      message: 'Charity item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update item (Admin only)
exports.updateItem = async (req, res) => {
  try {
    const item = await CharityItem.update(req.params.id, req.body);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      message: 'Charity item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update item quantity (Admin only)
exports.updateItemQuantity = async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ message: 'amount is required' });
    }

    const item = await CharityItem.updateQuantity(req.params.id, parseInt(amount));

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      message: 'Charity item quantity updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item quantity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete item (Admin only)
exports.deleteItem = async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const item = await CharityItem.update(req.params.id, { isActive: false });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Charity item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
