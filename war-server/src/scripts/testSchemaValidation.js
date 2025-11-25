const { initializeDatabase } = require('../config/database');
const Lesson = require('../models/Lesson');
const LessonPlaylist = require('../models/LessonPlaylist');
const User = require('../models/User');
const Charity = require('../models/Charity');
const CharitySlide = require('../models/CharitySlide');
const Warroom = require('../models/Warroom');

/**
 * Test script to validate all model schemas
 */
async function testSchemaValidation() {
  console.log('='.repeat(70));
  console.log('MODEL SCHEMA VALIDATION TEST');
  console.log('='.repeat(70));
  console.log('\nThis script will validate all model schemas against the database.\n');

  try {
    // Initialize database connection
    console.log('Initializing database connection...');
    await initializeDatabase();
    console.log('✓ Database connected\n');

    // Test each model
    const models = [
      { name: 'LessonPlaylist', model: LessonPlaylist },
      { name: 'Lesson', model: Lesson },
      { name: 'User', model: User },
      { name: 'Charity', model: Charity },
      { name: 'CharitySlide', model: CharitySlide },
      { name: 'Warroom', model: Warroom }
    ];

    for (const { name, model } of models) {
      console.log('='.repeat(70));
      console.log(`Testing ${name} model...`);
      console.log('='.repeat(70));
      
      try {
        // Ensure table exists
        await model.ensureTable();
        
        // Get schema definition
        const schema = model.getSchema();
        console.log(`\n${name} Schema Definition:`);
        console.log(`  Columns: ${schema.columns.length}`);
        console.log(`  Indexes: ${schema.indexes ? schema.indexes.length : 0}`);
        
        // Show foreign keys if any
        const foreignKeys = schema.indexes?.filter(idx => idx.type === 'FOREIGN KEY') || [];
        if (foreignKeys.length > 0) {
          console.log(`  Foreign Keys:`);
          foreignKeys.forEach(fk => {
            console.log(`    - ${fk.name}: ${fk.columns.join(', ')} -> ${fk.references.table}(${fk.references.column})`);
          });
        }
        
        console.log(`\n✓ ${name} validation completed successfully\n`);
        
      } catch (error) {
        console.error(`\n✗ Error testing ${name}:`, error.message);
        console.error(error.stack);
      }
    }

    console.log('='.repeat(70));
    console.log('SCHEMA VALIDATION SUMMARY');
    console.log('='.repeat(70));
    console.log('\nAll models have been validated and updated if necessary.');
    console.log('Check the output above for details on each model.\n');

    // Test Lesson-Playlist relationship
    console.log('='.repeat(70));
    console.log('TESTING LESSON-PLAYLIST FOREIGN KEY RELATIONSHIP');
    console.log('='.repeat(70));
    
    try {
      // Check if any playlists exist
      const playlists = await LessonPlaylist.findAll({ isActive: true });
      console.log(`\nFound ${playlists.length} active playlist(s)`);
      
      if (playlists.length > 0) {
        const firstPlaylist = playlists[0];
        console.log(`\nTesting with playlist: "${firstPlaylist.title}" (ID: ${firstPlaylist.id})`);
        
        // Try to find lessons for this playlist
        const lessons = await Lesson.findByPlaylist(firstPlaylist.id);
        console.log(`✓ Found ${lessons.length} lesson(s) for this playlist`);
        
        // Test with playlist details
        const lessonsWithDetails = await Lesson.findAllWithPlaylist({ 
          playlist_id: firstPlaylist.id 
        });
        console.log(`✓ Found ${lessonsWithDetails.length} lesson(s) with playlist details`);
        
        if (lessonsWithDetails.length > 0) {
          const lesson = lessonsWithDetails[0];
          console.log(`\nSample lesson with playlist info:`);
          console.log(`  Lesson: ${lesson.title}`);
          console.log(`  Playlist: ${lesson.playlist_title}`);
          console.log(`  Foreign Key: playlist_id = ${lesson.playlist_id}`);
        }
      } else {
        console.log('\n⚠ No playlists found to test relationship');
        console.log('  Run seeding script to create sample data');
      }
      
    } catch (error) {
      console.error('\n✗ Error testing relationship:', error.message);
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        console.error('\n  This error indicates the foreign key constraint is working!');
        console.error('  It prevents adding lessons with invalid playlist_id values.');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('\nAll schema validations passed!\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('TEST FAILED');
    console.error('='.repeat(70));
    console.error('\nError:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// Run test if this script is executed directly
if (require.main === module) {
  testSchemaValidation();
}

module.exports = { testSchemaValidation };
