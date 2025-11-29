const { getPool } = require('../config/database');
const BaseModel = require('./BaseModel');
const { generateUniqueId } = require('../utils/uniqueId');

class CharityItem extends BaseModel {
  static tableName = 'charity_items';

  /**
   * Define the schema for charity_items table
   */
  static getSchema() {
    return {
      columns: [
        {
          name: 'id',
          type: 'VARCHAR(8) PRIMARY KEY',
          nullable: false
        },
        {
          name: 'charity_id',
          type: 'VARCHAR(8)',
          nullable: false
        },
        {
          name: 'name',
          type: 'VARCHAR(500)',
          nullable: false
        },
        {
          name: 'needed_quantity',
          type: 'INT',
          nullable: false,
          default: 0
        },
        {
          name: 'current_quantity',
          type: 'INT',
          nullable: false,
          default: 0
        },
        {
          name: 'status',
          type: "ENUM('pending', 'in_progress', 'completed')",
          nullable: false,
          default: 'pending'
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
          name: 'idx_status',
          columns: ['status'],
          type: 'INDEX'
        },
        {
          name: 'fk_charity_item_charity',
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
   * Ensure the charity_items table exists
   */
  static async ensureTable() {
    const pool = getPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id VARCHAR(8) PRIMARY KEY,
        charity_id VARCHAR(8) NOT NULL,
        name VARCHAR(500) NOT NULL,
        needed_quantity INT NOT NULL DEFAULT 0,
        current_quantity INT NOT NULL DEFAULT 0,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_charity_id (charity_id),
        INDEX idx_status (status),
        CONSTRAINT fk_charity_item_charity FOREIGN KEY (charity_id) 
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
   * Find item by ID
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
   * Check if an ID exists in the database
   */
  static async idExists(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return rows.length > 0;
  }

  /**
   * Create a new charity item with unique random ID
   */
  static async create(itemData) {
    const pool = getPool();
    
    // Generate unique ID
    const id = await generateUniqueId(pool, this.tableName);
    
    const {
      charity_id,
      name,
      needed_quantity = 0,
      current_quantity = 0,
      status = 'pending'
    } = itemData;
    
    await pool.query(
      `INSERT INTO ${this.tableName} 
       (id, charity_id, name, needed_quantity, current_quantity, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, charity_id, name, needed_quantity, current_quantity, status]
    );
    
    return await this.findById(id);
  }

  /**
   * Update item
   */
  static async update(id, itemData) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    Object.keys(itemData).forEach(key => {
      if (itemData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(itemData[key]);
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
   * Delete item
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
   * Find all items for a charity
   */
  static async findByCharityId(charityId) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE charity_id = ? AND isActive = true ORDER BY createdAt DESC`,
      [charityId]
    );
    return rows;
  }

  /**
   * Find all items
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
   * Update item quantity
   */
  static async updateQuantity(id, amount) {
    const pool = getPool();
    
    // First get the item to check needed_quantity
    const item = await this.findById(id);
    if (!item) return null;
    
    const newQuantity = item.current_quantity + amount;
    
    // Determine new status based on quantity
    let newStatus = item.status;
    if (newQuantity >= item.needed_quantity) {
      newStatus = 'completed';
    } else if (newQuantity > 0) {
      newStatus = 'in_progress';
    } else {
      newStatus = 'pending';
    }
    
    await pool.query(
      `UPDATE ${this.tableName} SET current_quantity = ?, status = ? WHERE id = ?`,
      [newQuantity, newStatus, id]
    );
    
    return await this.findById(id);
  }
}

module.exports = CharityItem;
