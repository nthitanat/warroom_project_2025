const path = require('path');
const fs = require('fs');

// Serve analytics data JSON
exports.getData = async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../files/analytics/analytics.json');
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ message: 'Analytics data not found' });
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Get analytics data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Serve village info JSON
exports.getVillageInfo = async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../files/analytics/village-info.json');
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ message: 'Village info not found' });
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Get village info error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Serve analytics tiles
exports.getTiles = async (req, res) => {
  try {
    const tilePath = req.params[0]; // Gets everything after /tiles/
    const tilesPath = path.join(__dirname, '../../files/analytics/tiles', tilePath);

    // Check if file exists
    if (!fs.existsSync(tilesPath)) {
      return res.status(404).json({ message: 'Tile not found' });
    }

    // Set appropriate content type for PBF files
    res.setHeader('Content-Type', 'application/x-protobuf');
    res.setHeader('Content-Encoding', 'gzip');
    res.sendFile(tilesPath);
  } catch (error) {
    console.error('Get tiles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
