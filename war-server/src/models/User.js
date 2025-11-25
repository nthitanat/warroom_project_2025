const { getPool } = require('../config/database');
const BaseModel = require('./BaseModel');

class User extends BaseModel {
  static tableName = 'users';

  /**
   * Define the schema for users table
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
          name: 'username',
          type: 'VARCHAR(255)',
          nullable: false
        },
        {
          name: 'email',
          type: 'VARCHAR(255)',
          nullable: false
        },
        {
          name: 'password',
          type: 'VARCHAR(255)',
          nullable: false
        },
        {
          name: 'role',
          type: "ENUM('admin', 'member')",
          nullable: false,
          default: 'member'
        },
        {
          name: 'firstName',
          type: 'VARCHAR(255)',
          nullable: false
        },
        {
          name: 'lastName',
          type: 'VARCHAR(255)',
          nullable: false
        },
        {
          name: 'avatar',
          type: 'VARCHAR(500)',
          nullable: true,
          default: null
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
          name: 'username',
          columns: ['username'],
          type: 'UNIQUE'
        },
        {
          name: 'email',
          columns: ['email'],
          type: 'UNIQUE'
        },
        {
          name: 'idx_role',
          columns: ['role'],
          type: 'INDEX'
        }
      ]
    };
  }

  /**
   * Ensure the users table exists
   */
  static async ensureTable() {
    const pool = getPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'member') DEFAULT 'member',
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        avatar VARCHAR(500) DEFAULT NULL,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role)
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
   * Find user by email
   */
  static async findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE username = ?`,
      [username]
    );
    return rows[0] || null;
  }

  /**
   * Find user by ID
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
   * Create a new user
   */
  static async create(userData) {
    const pool = getPool();
    const { username, email, password, role = 'member', firstName, lastName, avatar = null } = userData;
    
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} (username, email, password, role, firstName, lastName, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, password, role, firstName, lastName, avatar]
    );
    
    return await this.findById(result.insertId);
  }

  /**
   * Update user
   */
  static async update(id, userData) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
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
   * Delete user
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
   * Find all users
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const conditions = [];
    const values = [];
    
    if (filters.role) {
      conditions.push('role = ?');
      values.push(filters.role);
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
}

module.exports = User;
