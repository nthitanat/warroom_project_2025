/**
 * Unique ID Generator Utility
 * Generates unique random IDs for charities and charity slides
 */

const crypto = require('crypto');

/**
 * Generate a random unique ID
 * Format: 8 alphanumeric characters (lowercase letters and numbers)
 * @returns {string} Random unique ID
 */
const generateRandomId = () => {
  // Generate 8 random alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    id += chars[randomBytes[i] % chars.length];
  }
  return id;
};

/**
 * Generate a unique ID that doesn't exist in the database
 * @param {object} pool - MySQL pool connection
 * @param {string} tableName - Table name to check against
 * @param {string} columnName - Column name to check (default: 'id')
 * @param {number} maxAttempts - Maximum attempts to generate unique ID (default: 10)
 * @returns {Promise<string>} Unique ID
 */
const generateUniqueId = async (pool, tableName, columnName = 'id', maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const id = generateRandomId();
    
    // Check if ID already exists in the database
    const [rows] = await pool.query(
      `SELECT ${columnName} FROM ${tableName} WHERE ${columnName} = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return id; // ID is unique
    }
    
    console.log(`ID ${id} already exists in ${tableName}, regenerating... (attempt ${attempt + 1})`);
  }
  
  throw new Error(`Failed to generate unique ID after ${maxAttempts} attempts`);
};

/**
 * Generate multiple unique IDs at once
 * @param {object} pool - MySQL pool connection
 * @param {string} tableName - Table name to check against
 * @param {number} count - Number of unique IDs to generate
 * @param {string} columnName - Column name to check (default: 'id')
 * @returns {Promise<string[]>} Array of unique IDs
 */
const generateMultipleUniqueIds = async (pool, tableName, count, columnName = 'id') => {
  const ids = new Set();
  
  // First, get all existing IDs from the table
  const [existingRows] = await pool.query(
    `SELECT ${columnName} FROM ${tableName}`
  );
  const existingIds = new Set(existingRows.map(row => row[columnName]));
  
  while (ids.size < count) {
    const id = generateRandomId();
    
    // Check if ID is unique (not in existing IDs and not already generated)
    if (!existingIds.has(id) && !ids.has(id)) {
      ids.add(id);
    }
  }
  
  return Array.from(ids);
};

module.exports = {
  generateRandomId,
  generateUniqueId,
  generateMultipleUniqueIds,
};
