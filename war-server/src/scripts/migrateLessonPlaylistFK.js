const { getPool } = require('../config/database');

/**
 * Migration script to convert lesson playlist_id from VARCHAR to INT foreign key
 * This should be run once to migrate existing data
 */
async function migrateLessonPlaylistFK() {
  const pool = getPool();
  
  try {
    console.log('Starting migration: Converting lesson playlist_id to foreign key...\n');

    // Step 1: Check if lessons table has VARCHAR playlist_id
    console.log('Step 1: Checking current schema...');
    const [columns] = await pool.query(
      `SELECT COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'lessons' 
       AND COLUMN_NAME = 'playlist_id'`
    );

    if (columns.length === 0) {
      console.log('  ✓ lessons table not found or playlist_id column does not exist');
      return;
    }

    const currentType = columns[0].COLUMN_TYPE;
    console.log(`  Current playlist_id type: ${currentType}`);

    if (currentType.toLowerCase().includes('int')) {
      console.log('  ✓ playlist_id is already an INT, checking foreign key...');
      
      // Check if foreign key exists
      const [fks] = await pool.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'lessons' 
         AND COLUMN_NAME = 'playlist_id' 
         AND REFERENCED_TABLE_NAME IS NOT NULL`
      );

      if (fks.length > 0) {
        console.log('  ✓ Foreign key already exists, migration not needed\n');
        return;
      }
    }

    // Step 2: Create temporary column for mapping
    console.log('\nStep 2: Creating temporary mapping column...');
    try {
      await pool.query('ALTER TABLE lessons ADD COLUMN temp_playlist_fk INT NULL');
      console.log('  ✓ Temporary column created');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('  ✓ Temporary column already exists');
      } else {
        throw error;
      }
    }

    // Step 3: Map old playlist_id strings to new integer IDs
    console.log('\nStep 3: Mapping playlist IDs...');
    const [lessons] = await pool.query('SELECT id, playlist_id FROM lessons WHERE temp_playlist_fk IS NULL');
    
    if (lessons.length === 0) {
      console.log('  ✓ No lessons to migrate');
    } else {
      let mappedCount = 0;
      let notFoundCount = 0;

      for (const lesson of lessons) {
        // Find the playlist by its string playlist_id
        const [playlists] = await pool.query(
          'SELECT id FROM lesson_playlists WHERE playlist_id = ?',
          [lesson.playlist_id]
        );

        if (playlists.length > 0) {
          await pool.query(
            'UPDATE lessons SET temp_playlist_fk = ? WHERE id = ?',
            [playlists[0].id, lesson.id]
          );
          mappedCount++;
        } else {
          console.log(`  ⚠ Warning: Playlist '${lesson.playlist_id}' not found for lesson ID ${lesson.id}`);
          notFoundCount++;
        }
      }

      console.log(`  ✓ Mapped ${mappedCount} lessons`);
      if (notFoundCount > 0) {
        console.log(`  ⚠ ${notFoundCount} lessons could not be mapped (playlist not found)`);
      }
    }

    // Step 4: Check if all lessons have been mapped
    const [unmappedCount] = await pool.query(
      'SELECT COUNT(*) as count FROM lessons WHERE temp_playlist_fk IS NULL'
    );

    if (unmappedCount[0].count > 0) {
      console.log(`\n⚠ Warning: ${unmappedCount[0].count} lessons still unmapped.`);
      console.log('  Please ensure all playlists exist before continuing.');
      console.log('  You can manually update these or delete them:');
      
      const [unmapped] = await pool.query(
        'SELECT id, title, playlist_id FROM lessons WHERE temp_playlist_fk IS NULL LIMIT 10'
      );
      unmapped.forEach(lesson => {
        console.log(`    - Lesson ID ${lesson.id}: "${lesson.title}" (playlist: ${lesson.playlist_id})`);
      });
      
      return;
    }

    // Step 5: Drop old foreign key if exists
    console.log('\nStep 4: Removing old foreign key constraints...');
    try {
      const [oldFKs] = await pool.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'lessons' 
         AND COLUMN_NAME = 'playlist_id' 
         AND REFERENCED_TABLE_NAME IS NOT NULL`
      );

      for (const fk of oldFKs) {
        await pool.query(`ALTER TABLE lessons DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        console.log(`  ✓ Dropped foreign key: ${fk.CONSTRAINT_NAME}`);
      }
    } catch (error) {
      console.log('  ✓ No foreign keys to remove');
    }

    // Step 6: Rename old column and use temp column
    console.log('\nStep 5: Swapping columns...');
    await pool.query('ALTER TABLE lessons CHANGE playlist_id old_playlist_id VARCHAR(100)');
    await pool.query('ALTER TABLE lessons CHANGE temp_playlist_fk playlist_id INT NOT NULL');
    console.log('  ✓ Columns swapped');

    // Step 7: Add foreign key constraint
    console.log('\nStep 6: Adding foreign key constraint...');
    try {
      await pool.query(`
        ALTER TABLE lessons 
        ADD CONSTRAINT fk_lesson_playlist 
        FOREIGN KEY (playlist_id) 
        REFERENCES lesson_playlists(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
      `);
      console.log('  ✓ Foreign key constraint added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEY' || error.code === 'ER_FK_DUP_NAME') {
        console.log('  ✓ Foreign key constraint already exists');
      } else {
        throw error;
      }
    }

    // Step 8: Drop old column
    console.log('\nStep 7: Cleaning up...');
    try {
      await pool.query('ALTER TABLE lessons DROP COLUMN old_playlist_id');
      console.log('  ✓ Old playlist_id column removed');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ✓ Old column already removed');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease fix the error and run the migration again.\n');
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const { initializeDatabase } = require('../config/database');
  
  initializeDatabase()
    .then(() => migrateLessonPlaylistFK())
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateLessonPlaylistFK };
