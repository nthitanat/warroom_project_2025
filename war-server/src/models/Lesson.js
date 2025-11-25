const { getPool } = require('../config/database');
const BaseModel = require('./BaseModel');

class Lesson extends BaseModel {
  static tableName = 'lessons';

  /**
   * Define the schema for lessons table
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
          name: 'img',
          type: 'VARCHAR(1000)',
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
          name: 'videoLink',
          type: 'VARCHAR(1000)',
          nullable: false
        },
        {
          name: 'authors',
          type: 'JSON',
          nullable: false
        },
        {
          name: 'size',
          type: 'VARCHAR(50)',
          nullable: false
        },
        {
          name: 'playlist_id',
          type: 'INT',
          nullable: false
        },
        {
          name: 'recommend',
          type: 'BOOLEAN',
          nullable: false,
          default: false
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
          name: 'idx_playlist',
          columns: ['playlist_id'],
          type: 'INDEX'
        },
        {
          name: 'idx_recommend',
          columns: ['recommend'],
          type: 'INDEX'
        },
        {
          name: 'idx_isActive',
          columns: ['isActive'],
          type: 'INDEX'
        },
        {
          name: 'fk_lesson_playlist',
          columns: ['playlist_id'],
          type: 'FOREIGN KEY',
          references: {
            table: 'lesson_playlists',
            column: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      ]
    };
  }

  /**
   * Ensure the lessons table exists
   */
  static async ensureTable() {
    const pool = getPool();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        img VARCHAR(1000) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        videoLink VARCHAR(1000) NOT NULL,
        authors JSON NOT NULL,
        size VARCHAR(50) NOT NULL,
        playlist_id INT NOT NULL,
        recommend BOOLEAN DEFAULT false,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_playlist (playlist_id),
        INDEX idx_recommend (recommend),
        INDEX idx_isActive (isActive),
        CONSTRAINT fk_lesson_playlist FOREIGN KEY (playlist_id) 
          REFERENCES lesson_playlists(id) 
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
   * Find lesson by ID
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
    
    return rows[0] || null;
  }

  /**
   * Create a new lesson
   */
  static async create(lessonData) {
    const pool = getPool();
    const {
      img,
      title,
      description = '',
      videoLink,
      authors,
      size,
      playlist_id,
      recommend = false
    } = lessonData;
    
    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} 
       (img, title, description, videoLink, authors, size, playlist_id, recommend) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [img, title, description, videoLink, JSON.stringify(authors), size, playlist_id, recommend]
    );
    
    return await this.findById(result.insertId);
  }

  /**
   * Update lesson
   */
  static async update(id, lessonData) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    Object.keys(lessonData).forEach(key => {
      if (lessonData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(key === 'authors' ? JSON.stringify(lessonData[key]) : lessonData[key]);
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
   * Delete lesson
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
   * Find all lessons
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `SELECT * FROM ${this.tableName}`;
    const conditions = [];
    const values = [];
    
    if (filters.playlist_id) {
      conditions.push('playlist_id = ?');
      values.push(filters.playlist_id);
    }
    
    if (filters.recommend !== undefined) {
      conditions.push('recommend = ?');
      values.push(filters.recommend);
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
    
    // Parse JSON authors field for each row
    rows.forEach(row => {
      if (row.authors && typeof row.authors === 'string') {
        row.authors = JSON.parse(row.authors);
      }
    });
    
    return rows;
  }

  /**
   * Find recommended lessons
   */
  static async findRecommended() {
    return await this.findAll({ recommend: true, isActive: true });
  }

  /**
   * Find lessons by playlist (accepts both ID and playlist_id string)
   */
  static async findByPlaylist(playlistId) {
    const pool = getPool();
    
    // Try to find by numeric ID first (foreign key)
    if (!isNaN(playlistId)) {
      return await this.findAll({ playlist_id: playlistId, isActive: true });
    }
    
    // If it's a string, find the playlist first and then get its ID
    const [playlists] = await pool.query(
      `SELECT id FROM lesson_playlists WHERE playlist_id = ?`,
      [playlistId]
    );
    
    if (playlists.length > 0) {
      return await this.findAll({ playlist_id: playlists[0].id, isActive: true });
    }
    
    return [];
  }

  /**
   * Find lessons with playlist details
   */
  static async findAllWithPlaylist(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        l.*,
        p.playlist_id as playlist_external_id,
        p.title as playlist_title,
        p.description as playlist_description
      FROM ${this.tableName} l
      LEFT JOIN lesson_playlists p ON l.playlist_id = p.id
    `;
    
    const conditions = [];
    const values = [];
    
    if (filters.playlist_id) {
      conditions.push('l.playlist_id = ?');
      values.push(filters.playlist_id);
    }
    
    if (filters.recommend !== undefined) {
      conditions.push('l.recommend = ?');
      values.push(filters.recommend);
    }
    
    if (filters.isActive !== undefined) {
      conditions.push('l.isActive = ?');
      values.push(filters.isActive);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.createdAt DESC';
    
    const [rows] = await pool.query(query, values);
    
    // Parse JSON authors field for each row
    rows.forEach(row => {
      if (row.authors && typeof row.authors === 'string') {
        row.authors = JSON.parse(row.authors);
      }
    });
    
    return rows;
  }
}

module.exports = Lesson;
