// Check if user is admin
exports.checkAdmin = async (req, res) => {
  try {
    res.json({ 
      isAdmin: req.user.role === 'admin',
      message: 'Admin check successful'
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
