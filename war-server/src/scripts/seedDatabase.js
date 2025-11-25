#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script clones data from the war-client public folder and bulk inserts it into MySQL database.
 * 
 * IMPORTANT: Field name mapping differences:
 * - JSON 'img' -> MySQL 'img' (same)
 * - JSON uses nested objects/arrays, MySQL uses JSON columns for complex data
 * - Warroom JSON 'tag' field is NOT in MySQL schema (ignored)
 * - Lesson JSON 'size' object -> MySQL 'size' (stored as JSON string or simple value)
 * 
 * Usage: node src/scripts/seedDatabase.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, getPool } = require('../config/database');

// Import models
const Charity = require('../models/Charity');
const CharitySlide = require('../models/CharitySlide');
const Lesson = require('../models/Lesson');
const LessonPlaylist = require('../models/LessonPlaylist');
const Warroom = require('../models/Warroom');

// Path to public data folder (relative to war-server)
const PUBLIC_DATA_PATH = path.join(__dirname, '../../../war-client/public');

/**
 * Color codes for console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Load JSON file
 */
function loadJSON(filePath) {
  try {
    const fullPath = path.join(PUBLIC_DATA_PATH, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`${colors.yellow}⚠ File not found: ${filePath}${colors.reset}`);
      return null;
    }
    const data = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`${colors.red}✗ Error loading ${filePath}: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Clear all data from database
 */
async function clearDatabase() {
  const pool = getPool();
  console.log(`\n${colors.yellow}🗑️  Clearing existing data...${colors.reset}`);
  
  try {
    // Disable foreign key checks temporarily
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Truncate all tables
    await pool.query('TRUNCATE TABLE charity_slides');
    await pool.query('TRUNCATE TABLE charities');
    await pool.query('TRUNCATE TABLE lessons');
    await pool.query('TRUNCATE TABLE lesson_playlists');
    await pool.query('TRUNCATE TABLE warrooms');
    
    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log(`${colors.green}✓ Database cleared${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Error clearing database: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Seed Charities
 */
async function seedCharities() {
  console.log(`\n${colors.cyan}📊 Seeding Charities...${colors.reset}`);
  
  const charitiesData = loadJSON('charities/charitiesData.json');
  if (!charitiesData || !Array.isArray(charitiesData)) {
    console.log(`${colors.yellow}⚠ No charities data found${colors.reset}`);
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const charity of charitiesData) {
    try {
      // Field mapping: JSON -> MySQL
      const charityRecord = {
        title: charity.title,
        description: charity.description || '',
        expected_fund: charity.expected_fund || 0,
        current_fund: charity.current_fund || 0,
        img: charity.img,
        status: charity.status || 'active',
        startDate: charity.startDate ? new Date(charity.startDate) : new Date(),
        endDate: charity.endDate ? new Date(charity.endDate) : null
      };
      
      // Use raw SQL to preserve original IDs
      const pool = getPool();
      const [result] = await pool.query(
        `INSERT INTO charities 
         (id, title, description, expected_fund, current_fund, img, status, startDate, endDate) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          charity.id,
          charityRecord.title,
          charityRecord.description,
          charityRecord.expected_fund,
          charityRecord.current_fund,
          charityRecord.img,
          charityRecord.status,
          charityRecord.startDate,
          charityRecord.endDate
        ]
      );
      
      successCount++;
      console.log(`  ${colors.green}✓${colors.reset} Charity ${charity.id}: ${charity.title}`);
    } catch (error) {
      errorCount++;
      console.error(`  ${colors.red}✗${colors.reset} Failed to insert charity ${charity.id}: ${error.message}`);
    }
  }
  
  console.log(`${colors.bright}${colors.green}✓ Charities: ${successCount} inserted, ${errorCount} failed${colors.reset}`);
}

/**
 * Seed Charity Slides
 */
async function seedCharitySlides() {
  console.log(`\n${colors.cyan}🖼️  Seeding Charity Slides...${colors.reset}`);
  
  const slidesData = loadJSON('charities/charitySlideData.json');
  if (!slidesData || !Array.isArray(slidesData)) {
    console.log(`${colors.yellow}⚠ No charity slides data found${colors.reset}`);
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const slide of slidesData) {
    try {
      // Field mapping: JSON -> MySQL
      const slideRecord = {
        charity_id: slide.charity_id,
        img: slide.img,
        description: slide.description || '',
        display_order: slide.id || 0 // Use original id as display_order
      };
      
      // Use raw SQL to preserve original IDs
      const pool = getPool();
      await pool.query(
        `INSERT INTO charity_slides 
         (id, charity_id, img, description, display_order) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          slide.id,
          slideRecord.charity_id,
          slideRecord.img,
          slideRecord.description,
          slideRecord.display_order
        ]
      );
      
      successCount++;
      console.log(`  ${colors.green}✓${colors.reset} Slide ${slide.id} for charity ${slide.charity_id}`);
    } catch (error) {
      errorCount++;
      console.error(`  ${colors.red}✗${colors.reset} Failed to insert slide ${slide.id}: ${error.message}`);
    }
  }
  
  console.log(`${colors.bright}${colors.green}✓ Charity Slides: ${successCount} inserted, ${errorCount} failed${colors.reset}`);
}

/**
 * Seed Lesson Playlists
 */
async function seedLessonPlaylists() {
  console.log(`\n${colors.cyan}📚 Seeding Lesson Playlists...${colors.reset}`);
  
  const playlistsData = loadJSON('lesson/lessonPlaylistData.json');
  if (!playlistsData || !Array.isArray(playlistsData)) {
    console.log(`${colors.yellow}⚠ No lesson playlists data found${colors.reset}`);
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const playlist of playlistsData) {
    try {
      // Field mapping: JSON -> MySQL
      const playlistRecord = {
        playlist_id: playlist.id,
        title: playlist.title,
        description: playlist.description || '',
        thumbnail: playlist.img || null,
        authors: playlist.authors || null,
        size: playlist.size || null,
        display_order: parseInt(playlist.id) || 0
      };
      
      const pool = getPool();
      await pool.query(
        `INSERT INTO lesson_playlists 
         (playlist_id, title, description, thumbnail, authors, size, display_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          playlistRecord.playlist_id,
          playlistRecord.title,
          playlistRecord.description,
          playlistRecord.thumbnail,
          playlistRecord.authors ? JSON.stringify(playlistRecord.authors) : null,
          playlistRecord.size ? JSON.stringify(playlistRecord.size) : null,
          playlistRecord.display_order
        ]
      );
      
      successCount++;
      console.log(`  ${colors.green}✓${colors.reset} Playlist ${playlist.id}: ${playlist.title}`);
    } catch (error) {
      errorCount++;
      console.error(`  ${colors.red}✗${colors.reset} Failed to insert playlist ${playlist.id}: ${error.message}`);
    }
  }
  
  console.log(`${colors.bright}${colors.green}✓ Lesson Playlists: ${successCount} inserted, ${errorCount} failed${colors.reset}`);
}

/**
 * Seed Lessons
 */
async function seedLessons() {
  console.log(`\n${colors.cyan}🎓 Seeding Lessons...${colors.reset}`);
  
  const lessonsData = loadJSON('lesson/lessonData.json');
  if (!lessonsData || !Array.isArray(lessonsData)) {
    console.log(`${colors.yellow}⚠ No lessons data found${colors.reset}`);
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const lesson of lessonsData) {
    try {
      // Field mapping: JSON -> MySQL
      // NOTE: 'size' in JSON is an object like {xs: 12, md: 3}
      // MySQL stores it as VARCHAR, so we convert to JSON string
      const lessonRecord = {
        img: lesson.img,
        title: lesson.title,
        description: lesson.description || '',
        videoLink: lesson.videoLink,
        authors: lesson.authors || [],
        size: lesson.size ? JSON.stringify(lesson.size) : JSON.stringify({ xs: 12, md: 6 }),
        playlist_id: lesson.playlist_id || '2',
        recommend: lesson.recommend || false
      };
      
      const pool = getPool();
      await pool.query(
        `INSERT INTO lessons 
         (img, title, description, videoLink, authors, size, playlist_id, recommend) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lessonRecord.img,
          lessonRecord.title,
          lessonRecord.description,
          lessonRecord.videoLink,
          JSON.stringify(lessonRecord.authors),
          lessonRecord.size,
          lessonRecord.playlist_id,
          lessonRecord.recommend
        ]
      );
      
      successCount++;
      console.log(`  ${colors.green}✓${colors.reset} Lesson: ${lesson.title.substring(0, 50)}...`);
    } catch (error) {
      errorCount++;
      console.error(`  ${colors.red}✗${colors.reset} Failed to insert lesson "${lesson.title}": ${error.message}`);
    }
  }
  
  console.log(`${colors.bright}${colors.green}✓ Lessons: ${successCount} inserted, ${errorCount} failed${colors.reset}`);
}

/**
 * Seed Warrooms
 */
async function seedWarrooms() {
  console.log(`\n${colors.cyan}🏛️  Seeding Warrooms...${colors.reset}`);
  
  const warroomsData = loadJSON('warroom/warroomData.json');
  if (!warroomsData || !Array.isArray(warroomsData)) {
    console.log(`${colors.yellow}⚠ No warrooms data found${colors.reset}`);
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const warroom of warroomsData) {
    try {
      // Field mapping: JSON -> MySQL
      // NOTE: JSON has 'tag' field but MySQL schema doesn't include it (ignored)
      // NOTE: JSON 'description' might contain date info, we parse it
      
      // Parse date from description or use current date
      let warroomDate = new Date();
      if (warroom.description) {
        // Try to extract date from Thai description
        const dateMatch = warroom.description.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
        if (dateMatch) {
          // This is a simple parser, might need more robust handling
          warroomDate = new Date(); // Keep current for now
        }
      }
      
      const warroomRecord = {
        title: warroom.title,
        description: warroom.description || '',
        date: warroomDate,
        location: 'TBD', // Default location as JSON doesn't have this field
        img: warroom.img || null,
        videoLink: warroom.videoLink || null,
        status: warroom.status !== undefined ? warroom.status : 0
      };
      
      const pool = getPool();
      await pool.query(
        `INSERT INTO warrooms 
         (title, description, date, location, img, videoLink, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          warroomRecord.title,
          warroomRecord.description,
          warroomRecord.date,
          warroomRecord.location,
          warroomRecord.img,
          warroomRecord.videoLink,
          warroomRecord.status
        ]
      );
      
      successCount++;
      console.log(`  ${colors.green}✓${colors.reset} Warroom: ${warroom.title.substring(0, 50)}...`);
    } catch (error) {
      errorCount++;
      console.error(`  ${colors.red}✗${colors.reset} Failed to insert warroom "${warroom.title}": ${error.message}`);
    }
  }
  
  console.log(`${colors.bright}${colors.green}✓ Warrooms: ${successCount} inserted, ${errorCount} failed${colors.reset}`);
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║      WAR ROOM DATABASE SEEDING SCRIPT                  ║');
  console.log('║      Cloning data from public folder to MySQL          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    // Connect to database
    console.log(`${colors.cyan}🔌 Connecting to database...${colors.reset}`);
    await connectDB();
    
    // Ensure tables exist
    console.log(`${colors.cyan}🔧 Ensuring tables exist...${colors.reset}`);
    await Charity.ensureTable();
    await CharitySlide.ensureTable();
    await LessonPlaylist.ensureTable();
    await Lesson.ensureTable();
    await Warroom.ensureTable();
    
    // Ask for confirmation to clear database
    console.log(`\n${colors.yellow}⚠️  WARNING: This will DELETE all existing data!${colors.reset}`);
    console.log(`${colors.yellow}Press Ctrl+C to cancel, or wait 3 seconds to continue...${colors.reset}`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data in order (respecting foreign key constraints)
    await seedCharities();
    await seedCharitySlides();
    await seedLessonPlaylists();
    await seedLessons();
    await seedWarrooms();
    
    // Summary
    console.log(`\n${colors.bright}${colors.green}`);
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║      ✅ DATABASE SEEDING COMPLETED SUCCESSFULLY        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    
    console.log(`\n${colors.cyan}📊 Summary:${colors.reset}`);
    console.log(`  • Charities and their slides seeded`);
    console.log(`  • Lesson playlists and lessons seeded`);
    console.log(`  • Warrooms seeded`);
    console.log(`\n${colors.yellow}Note: Field name differences were handled:${colors.reset}`);
    console.log(`  • Lesson 'size' object → JSON string in MySQL`);
    console.log(`  • Warroom 'tag' field ignored (not in MySQL schema)`);
    console.log(`  • Authors array → JSON string in MySQL`);
    
    process.exit(0);
  } catch (error) {
    console.error(`\n${colors.red}╔════════════════════════════════════════════════════════╗${colors.reset}`);
    console.error(`${colors.red}║      ❌ DATABASE SEEDING FAILED                        ║${colors.reset}`);
    console.error(`${colors.red}╚════════════════════════════════════════════════════════╝${colors.reset}`);
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
