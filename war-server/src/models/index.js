/**
 * Initialize Database Tables
 * This script ensures all database tables exist before the server starts
 */

const User = require('./User');
const Charity = require('./Charity');
const CharitySlide = require('./CharitySlide');
const CharityItem = require('./CharityItem');
const Lesson = require('./Lesson');
const LessonPlaylist = require('./LessonPlaylist');
const Warroom = require('./Warroom');

/**
 * Initialize all database tables
 */
async function initializeTables() {
  console.log('\n🔧 Initializing database tables...\n');
  
  try {
    // Create all tables in order (respecting foreign key dependencies)
    await User.ensureTable();
    await Charity.ensureTable();
    await CharitySlide.ensureTable();
    await CharityItem.ensureTable();
    await LessonPlaylist.ensureTable();
    await Lesson.ensureTable();
    await Warroom.ensureTable();
    
    console.log('\n✅ All database tables initialized successfully!\n');
  } catch (error) {
    console.error('\n❌ Error initializing database tables:', error.message);
    throw error;
  }
}

module.exports = { 
  initializeTables,
  User,
  Charity,
  CharitySlide,
  CharityItem,
  Lesson,
  LessonPlaylist,
  Warroom
};
