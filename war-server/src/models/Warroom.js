const { getPool } = require('../config/database');
const BaseModel = require('./BaseModel');

class Warroom extends BaseModel {
  static tableName = 'warrooms';

  /**
   * Define the schema for warrooms table
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
          name: 'date',
          type: 'TIMESTAMP',
          nullable: false
        },
        {
          name: 'location',
          type: 'VARCHAR(500)',
          nullable: false
        },
        {
          name: 'img',
          type: 'VARCHAR(1000)',
          nullable: true
        },
        {
          name: 'videoLink',
          type: 'VARCHAR(1000)',
          nullable: true
        },
        {
          name: 'status',
          type: 'INT',
          nullable: false,
          default: 0,
          extra: "COMMENT '0=upcoming, 1=live, 2=archived, 3=podcast'"
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
          name: 'idx_status',
          columns: ['status'],
          type: 'INDEX'
        },
        {
          name: 'idx_date',
          columns: ['date'],
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
   * Ensure the warrooms table exists
   */
  static async ensureTable() {
    const pool = getPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        location VARCHAR(500) NOT NULL,
        img VARCHAR(1000),
        videoLink VARCHAR(1000),
        status INT DEFAULT 0 COMMENT '0=upcoming, 1=live, 2=archived, 3=podcast',
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_date (date),
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
   * Find warroom by ID
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
   * Create a new warroom
   */
  static async create(warroomData) {
    const pool = getPool();
    const {
      title,
      description = '',
      date,
      location,
      img = null,
      videoLink = null,
      status = 0
    } = warroomData;
    
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} 
       (title, description, date, location, img, videoLink, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, date, location, img, videoLink, status]
    );
    
    return await this.findById(result.insertId);
  }

  /**
   * Update warroom
   */
  static async update(id, warroomData) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    Object.keys(warroomData).forEach(key => {
      if (warroomData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(warroomData[key]);
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
   * Delete warroom
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
   * Find all warrooms
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const conditions = [];
    const values = [];
    
    if (filters.status !== undefined) {
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
    
    query += ' ORDER BY date DESC';
    
    const [rows] = await pool.query(query, values);
    return rows;
  }

  /**
   * Find upcoming warrooms
   */
  static async findUpcoming() {
    return await this.findAll({ status: 0, isActive: true });
  }

  /**
   * Find live warrooms
   */
  static async findLive() {
    return await this.findAll({ status: 1, isActive: true });
  }

  /**
   * Find archived warrooms
   */
  static async findArchived() {
    return await this.findAll({ status: 2, isActive: true });
  }

  /**
   * Find podcasts
   */
  static async findPodcasts() {
    return await this.findAll({ status: 3, isActive: true });
  }
}

module.exports = Warroom;
