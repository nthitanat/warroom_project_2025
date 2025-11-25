const { getPool } = require('../config/database');
const BaseModel = require('./BaseModel');

class LessonPlaylist extends BaseModel {
  static tableName = 'lesson_playlists';

  /**
   * Define the schema for lesson_playlists table
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
          name: 'playlist_id',
          type: 'VARCHAR(100)',
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
          name: 'thumbnail',
          type: 'VARCHAR(1000)',
          nullable: true
        },
        {
          name: 'authors',
          type: 'JSON',
          nullable: true
        },
        {
          name: 'size',
          type: 'VARCHAR(50)',
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
          name: 'playlist_id',
          columns: ['playlist_id'],
          type: 'UNIQUE'
        },
        {
          name: 'idx_display_order',
          columns: ['display_order'],
          type: 'INDEX'
        }
      ]
    };
  }

  /**
   * Ensure the lesson_playlists table exists
   */
  static async ensureTable() {
    const pool = getPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        thumbnail VARCHAR(1000),
        authors JSON,
        size VARCHAR(50),
        display_order INT DEFAULT 0,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_display_order (display_order)
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
   * Find playlist by ID
   */
  static async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    
    if (rows[0] && rows[0].authors && typeof rows[0].authors === 'string') {
      rows[0].authors = JSON.parse(rows[0].authors);
    }
    
    if (rows[0] && rows[0].size && typeof rows[0].size === 'string') {
      try {
        rows[0].size = JSON.parse(rows[0].size);
      } catch (e) {
        // If size is not JSON, keep as string
      }
    }
    
    return rows[0] || null;
  }

  /**
   * Find playlist by playlist_id
   */
  static async findByPlaylistId(playlistId) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE playlist_id = ?`,
      [playlistId]
    );
    
    if (rows[0] && rows[0].authors && typeof rows[0].authors === 'string') {
      rows[0].authors = JSON.parse(rows[0].authors);
    }
    
    if (rows[0] && rows[0].size && typeof rows[0].size === 'string') {
      try {
        rows[0].size = JSON.parse(rows[0].size);
      } catch (e) {
        // If size is not JSON, keep as string
      }
    }
    
    return rows[0] || null;
  }

  /**
   * Create a new playlist
   */
  static async create(playlistData) {
    const pool = getPool();
    const {
      playlist_id,
      title,
      description = '',
      thumbnail = null,
      authors = null,
      size = null,
      display_order = 0
    } = playlistData;
    
    const authorsJson = authors ? JSON.stringify(authors) : null;
    const sizeValue = size ? (typeof size === 'object' ? JSON.stringify(size) : size) : null;
    
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} 
       (playlist_id, title, description, thumbnail, authors, size, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [playlist_id, title, description, thumbnail, authorsJson, sizeValue, display_order]
    );
    
    return await this.findById(result.insertId);
  }

  /**
   * Update playlist
   */
  static async update(id, playlistData) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    Object.keys(playlistData).forEach(key => {
      if (playlistData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        let value = playlistData[key];
        
        if (key === 'authors' && value) {
          value = JSON.stringify(value);
        }
        
        if (key === 'size' && value && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        values.push(value);
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
   * Delete playlist
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
   * Find all playlists
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const conditions = [];
    const values = [];
    
    if (filters.isActive !== undefined) {
      conditions.push('isActive = ?');
      values.push(filters.isActive);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY display_order ASC';
    
    const [rows] = await pool.query(query, values);
    
    // Parse JSON fields for each row
    rows.forEach(row => {
      if (row.authors && typeof row.authors === 'string') {
        row.authors = JSON.parse(row.authors);
      }
      if (row.size && typeof row.size === 'string') {
        try {
          row.size = JSON.parse(row.size);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });
    
    return rows;
  }
}

module.exports = LessonPlaylist;
