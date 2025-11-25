const { getPool } = require('../config/database');
const BaseModel = require('./BaseModel');

class CharitySlide extends BaseModel {
  static tableName = 'charity_slides';

  /**
   * Define the schema for charity_slides table
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
          name: 'charity_id',
          type: 'INT',
          nullable: false
        },
        {
          name: 'img',
          type: 'VARCHAR(1000)',
          nullable: false
        },
        {
          name: 'description',
          type: 'TEXT',
          nullable: true
        },
        {
          name: 'display_order',
          type: 'INT',
          nullable: false,
          default: 0
        },
        {
          name: 'isActive',
          type: 'BOOLEAN',
          nullable: false,
          default: true
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
          name: 'idx_charity_id',
          columns: ['charity_id'],
          type: 'INDEX'
        },
        {
          name: 'idx_display_order',
          columns: ['display_order'],
          type: 'INDEX'
        },
        {
          name: 'fk_charity_slide_charity',
          columns: ['charity_id'],
          type: 'FOREIGN KEY',
          references: {
            table: 'charities',
            column: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      ]
    };
  }

  /**
   * Ensure the charity_slides table exists
   */
  static async ensureTable() {
    const pool = getPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        charity_id INT NOT NULL,
        img VARCHAR(1000) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_charity_id (charity_id),
        INDEX idx_display_order (display_order),
        CONSTRAINT fk_charity_slide_charity FOREIGN KEY (charity_id) 
          REFERENCES charities(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
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
   * Find slide by ID
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
   * Create a new charity slide
   */
  static async create(slideData) {
    const pool = getPool();
    const {
      charity_id,
      img,
      description = '',
      display_order = 0
    } = slideData;
    
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} 
       (charity_id, img, description, display_order) 
       VALUES (?, ?, ?, ?)`,
      [charity_id, img, description, display_order]
    );
    
    return await this.findById(result.insertId);
  }

  /**
   * Update slide
   */
  static async update(id, slideData) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    Object.keys(slideData).forEach(key => {
      if (slideData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(slideData[key]);
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
   * Delete slide
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
   * Find all slides for a charity
   */
  static async findByCharityId(charityId) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE charity_id = ? AND isActive = true ORDER BY display_order ASC`,
      [charityId]
    );
    return rows;
  }

  /**
   * Find all slides
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const conditions = [];
    const values = [];
    
    if (filters.charity_id) {
      conditions.push('charity_id = ?');
      values.push(filters.charity_id);
    }
    
    if (filters.isActive !== undefined) {
      conditions.push('isActive = ?');
      values.push(filters.isActive);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY charity_id ASC, display_order ASC';
    
    const [rows] = await pool.query(query, values);
    return rows;
  }
}

module.exports = CharitySlide;
