const { getPool } = require('../config/database');
const BaseModel = require('./BaseModel');

class Charity extends BaseModel {
  static tableName = 'charities';

  /**
   * Define the schema for charities table
   */
  static getSchema() {
    return {
      columns: [
        {
          name: 'id',
          type: 'INT AUTO_INCREMENT PRIMARY KEY',
          nullable: false
        },
        {
          name: 'title',
          type: 'VARCHAR(500)',
          nullable: false
        },
        {
          name: 'description',
          type: 'TEXT',
          nullable: true
        },
        {
          name: 'expected_fund',
          type: 'DECIMAL(15, 2)',
          nullable: false,
          default: 0
        },
        {
          name: 'current_fund',
          type: 'DECIMAL(15, 2)',
          nullable: false,
          default: 0
        },
        {
          name: 'img',
          type: 'VARCHAR(1000)',
          nullable: false
        },
        {
          name: 'isActive',
          type: 'BOOLEAN',
          nullable: false,
          default: true
        },
        {
          name: 'status',
          type: "ENUM('active', 'completed', 'paused')",
          nullable: false,
          default: 'active'
        },
        {
          name: 'startDate',
          type: 'TIMESTAMP',
          nullable: false,
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'endDate',
          type: 'TIMESTAMP',
          nullable: true,
          default: null
        },
        {
          name: 'createdAt',
          type: 'TIMESTAMP',
          nullable: false,
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updatedAt',
          type: 'TIMESTAMP',
          nullable: false,
          default: 'CURRENT_TIMESTAMP',
          extra: 'ON UPDATE CURRENT_TIMESTAMP'
        }
      ],
      indexes: [
        {
          name: 'idx_status',
          columns: ['status'],
          type: 'INDEX'
        },
        {
          name: 'idx_isActive',
          columns: ['isActive'],
          type: 'INDEX'
        }
      ]
    };
  }

  /**
   * Ensure the charities table exists
   */
  static async ensureTable() {
    const pool = getPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        expected_fund DECIMAL(15, 2) NOT NULL DEFAULT 0,
        current_fund DECIMAL(15, 2) NOT NULL DEFAULT 0,
        img VARCHAR(1000) NOT NULL,
        isActive BOOLEAN DEFAULT true,
        status ENUM('active', 'completed', 'paused') DEFAULT 'active',
        startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        endDate TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_isActive (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.query(createTableQuery);
      console.log(`✓ Table '${this.tableName}' is ready`);
      // After creating table, validate schema
      await this.validateAndUpdateSchema();
    } catch (error) {
      console.error(`✗ Error creating table '${this.tableName}':`, error.message);
      throw error;
    }
  }

  /**
   * Find charity by ID
   */
  static async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create a new charity
   */
  static async create(charityData) {
    const pool = getPool();
    const {
      title,
      description = '',
      expected_fund,
      current_fund = 0,
      img,
      status = 'active',
      startDate = new Date(),
      endDate = null
    } = charityData;
    
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} 
       (title, description, expected_fund, current_fund, img, status, startDate, endDate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, expected_fund, current_fund, img, status, startDate, endDate]
    );
    
    return await this.findById(result.insertId);
  }

  /**
   * Update charity
   */
  static async update(id, charityData) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    Object.keys(charityData).forEach(key => {
      if (charityData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(charityData[key]);
      }
    });
    
    if (fields.length === 0) return await this.findById(id);
    
    values.push(id);
    await pool.query(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return await this.findById(id);
  }

  /**
   * Delete charity
   */
  static async delete(id) {
    const pool = getPool();
    const [result] = await pool.query(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Find all charities
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const conditions = [];
    const values = [];
    
    if (filters.status) {
      conditions.push('status = ?');
      values.push(filters.status);
    }
    
    if (filters.isActive !== undefined) {
      conditions.push('isActive = ?');
      values.push(filters.isActive);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const [rows] = await pool.query(query, values);
    return rows;
  }

  /**
   * Update fund progress
   */
  static async updateFund(id, amount) {
    const pool = getPool();
    await pool.query(
      `UPDATE ${this.tableName} SET current_fund = current_fund + ? WHERE id = ?`,
      [amount, id]
    );
    return await this.findById(id);
  }
}

module.exports = Charity;
