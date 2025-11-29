/**
 * Migration Script: Convert Charity and CharitySlide IDs from INT to VARCHAR(8)
 * 
 * This script:
 * 1. Generates random unique 8-character IDs for all charities and slides
 * 2. Assigns random display orders to slides within each charity
 * 3. Updates the database schema and data
 * 4. Renames folders in public/charities to match new IDs
 * 
 * IMPORTANT: Run this script BEFORE deploying the updated model code.
 * 
 * Usage:
 *   node scripts/migrateCharityIds.js
 * 
 * For production server, copy the generated SQL commands and run them manually.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Database configuration - read from environment
// When running locally (not in Docker), use localhost instead of host.docker.internal
const dbHost = process.env.DEV_DB_HOST || 'localhost';
const DB_CONFIG = {
  host: dbHost === 'host.docker.internal' ? 'localhost' : dbHost,
  port: parseInt(process.env.DEV_DB_PORT) || 3306,
  user: process.env.DEV_DB_USER || 'root',
  password: process.env.DEV_DB_PASSWORD || '',
  database: process.env.DEV_DB_NAME || 'warroom_db'
};

// Path to public/charities folder
const CHARITIES_PUBLIC_PATH = path.join(__dirname, '../public/charities');

/**
 * Generate a random 8-character alphanumeric ID
 */
const generateRandomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    id += chars[randomBytes[i] % chars.length];
  }
  return id;
};

/**
 * Generate multiple unique IDs
 */
const generateUniqueIds = (count, existingIds = new Set()) => {
  const ids = [];
  while (ids.length < count) {
    const id = generateRandomId();
    if (!existingIds.has(id) && !ids.includes(id)) {
      ids.push(id);
      existingIds.add(id);
    }
  }
  return ids;
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Main migration function
 */
async function migrateCharityIds() {
  let pool;
  
  try {
    console.log('🔄 Starting Charity ID Migration...\n');
    console.log('Database Config:', {
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      database: DB_CONFIG.database,
      user: DB_CONFIG.user
    });
    
    // Connect to database
    pool = mysql.createPool(DB_CONFIG);
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Connected to database\n');
    
    // Get current data
    const [charities] = await pool.query('SELECT * FROM charities ORDER BY id');
    const [slides] = await pool.query('SELECT * FROM charity_slides ORDER BY charity_id, id');
    
    console.log(`Found ${charities.length} charities and ${slides.length} slides\n`);
    
    if (charities.length === 0) {
      console.log('No charities found. Nothing to migrate.');
      return;
    }
    
    // Generate unique IDs for charities
    const existingIds = new Set();
    const charityIds = generateUniqueIds(charities.length, existingIds);
    const slideIds = generateUniqueIds(slides.length, existingIds);
    
    // Create mapping from old ID to new ID
    const charityIdMap = {};
    charities.forEach((charity, index) => {
      charityIdMap[charity.id] = charityIds[index];
    });
    
    const slideIdMap = {};
    slides.forEach((slide, index) => {
      slideIdMap[slide.id] = slideIds[index];
    });
    
    // Group slides by charity and assign random display orders
    const slidesByCharity = {};
    slides.forEach(slide => {
      if (!slidesByCharity[slide.charity_id]) {
        slidesByCharity[slide.charity_id] = [];
      }
      slidesByCharity[slide.charity_id].push(slide);
    });
    
    // Shuffle slides within each charity and assign display_order
    const slideDisplayOrders = {};
    Object.keys(slidesByCharity).forEach(charityId => {
      const charitySlides = slidesByCharity[charityId];
      const shuffledSlides = shuffleArray(charitySlides);
      shuffledSlides.forEach((slide, index) => {
        slideDisplayOrders[slide.id] = index + 1;
      });
    });
    
    // Generate SQL commands
    console.log('=' .repeat(80));
    console.log('SQL COMMANDS FOR MIGRATION');
    console.log('=' .repeat(80));
    console.log('\n-- Run these commands on the database:\n');
    
    // Step 1: Disable foreign key checks
    console.log('-- Step 1: Disable foreign key checks');
    console.log('SET FOREIGN_KEY_CHECKS = 0;\n');
    
    // Step 2: Add new_id columns
    console.log('-- Step 2: Add temporary new_id columns');
    console.log('ALTER TABLE charities ADD COLUMN new_id VARCHAR(8);');
    console.log('ALTER TABLE charities ADD COLUMN display_order INT DEFAULT 0;');
    console.log('ALTER TABLE charity_slides ADD COLUMN new_id VARCHAR(8);');
    console.log('ALTER TABLE charity_slides ADD COLUMN new_charity_id VARCHAR(8);\n');
    
    // Step 3: Update with new IDs
    console.log('-- Step 3: Update charities with new unique IDs');
    charities.forEach((charity, index) => {
      const newId = charityIdMap[charity.id];
      console.log(`UPDATE charities SET new_id = '${newId}', display_order = ${index + 1}, img = '${newId}' WHERE id = ${charity.id};`);
    });
    
    console.log('\n-- Step 4: Update charity_slides with new unique IDs');
    slides.forEach(slide => {
      const newId = slideIdMap[slide.id];
      const newCharityId = charityIdMap[slide.charity_id];
      const displayOrder = slideDisplayOrders[slide.id];
      console.log(`UPDATE charity_slides SET new_id = '${newId}', new_charity_id = '${newCharityId}', display_order = ${displayOrder}, img = '${newId}' WHERE id = ${slide.id};`);
    });
    
    // Step 5: Drop old constraints and columns
    console.log('\n-- Step 5: Drop foreign key constraint');
    console.log('ALTER TABLE charity_slides DROP FOREIGN KEY fk_charity_slide_charity;');
    
    console.log('\n-- Step 6: Drop old primary keys and modify columns');
    console.log('-- First remove AUTO_INCREMENT before dropping primary key');
    console.log('ALTER TABLE charities MODIFY COLUMN id INT NOT NULL;');
    console.log('ALTER TABLE charities DROP PRIMARY KEY;');
    console.log('ALTER TABLE charities DROP COLUMN id;');
    console.log('ALTER TABLE charities CHANGE new_id id VARCHAR(8) NOT NULL;');
    console.log('ALTER TABLE charities ADD PRIMARY KEY (id);');
    
    console.log('\nALTER TABLE charity_slides MODIFY COLUMN id INT NOT NULL;');
    console.log('ALTER TABLE charity_slides DROP PRIMARY KEY;');
    console.log('ALTER TABLE charity_slides DROP COLUMN id;');
    console.log('ALTER TABLE charity_slides DROP COLUMN charity_id;');
    console.log('ALTER TABLE charity_slides CHANGE new_id id VARCHAR(8) NOT NULL;');
    console.log('ALTER TABLE charity_slides CHANGE new_charity_id charity_id VARCHAR(8) NOT NULL;');
    console.log('ALTER TABLE charity_slides ADD PRIMARY KEY (id);');
    
    // Step 7: Re-add foreign key
    console.log('\n-- Step 7: Re-add foreign key constraint');
    console.log('ALTER TABLE charity_slides ADD CONSTRAINT fk_charity_slide_charity FOREIGN KEY (charity_id) REFERENCES charities(id) ON DELETE CASCADE ON UPDATE CASCADE;');
    
    // Step 8: Re-enable foreign key checks
    console.log('\n-- Step 8: Re-enable foreign key checks');
    console.log('SET FOREIGN_KEY_CHECKS = 1;\n');
    
    console.log('=' .repeat(80));
    console.log('FOLDER RENAME COMMANDS');
    console.log('=' .repeat(80));
    console.log('\n-- Run these shell commands to rename folders:\n');
    
    // Generate folder rename commands for thumbnails
    console.log('# Rename charity thumbnail folders');
    charities.forEach(charity => {
      const oldId = charity.id;
      const newId = charityIdMap[oldId];
      console.log(`mv public/charities/thumbnails/${oldId} public/charities/thumbnails/${newId}`);
    });
    
    console.log('\n# Rename slide folders');
    slides.forEach(slide => {
      const oldId = slide.id;
      const newId = slideIdMap[oldId];
      console.log(`mv public/charities/slides/${oldId} public/charities/slides/${newId}`);
    });
    
    // Print mapping table for reference
    console.log('\n' + '=' .repeat(80));
    console.log('ID MAPPING REFERENCE');
    console.log('=' .repeat(80));
    
    console.log('\n-- Charity ID Mapping:');
    console.log('-- Old ID -> New ID');
    charities.forEach(charity => {
      console.log(`-- ${charity.id} -> ${charityIdMap[charity.id]} (${charity.title})`);
    });
    
    console.log('\n-- Slide ID Mapping:');
    console.log('-- Old ID -> New ID (charity_id: old -> new, display_order)');
    slides.forEach(slide => {
      console.log(`-- ${slide.id} -> ${slideIdMap[slide.id]} (charity: ${slide.charity_id} -> ${charityIdMap[slide.charity_id]}, order: ${slideDisplayOrders[slide.id]})`);
    });
    
    // Ask for confirmation to apply changes locally
    console.log('\n' + '=' .repeat(80));
    console.log('LOCAL MIGRATION');
    console.log('=' .repeat(80));
    
    // Apply changes locally
    console.log('\n🔄 Applying changes to local database...\n');
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Disable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Add temporary columns
      try {
        await connection.query('ALTER TABLE charities ADD COLUMN new_id VARCHAR(8)');
      } catch (e) {
        // Column may already exist
      }
      try {
        await connection.query('ALTER TABLE charities ADD COLUMN display_order INT DEFAULT 0');
      } catch (e) {
        // Column may already exist
      }
      try {
        await connection.query('ALTER TABLE charity_slides ADD COLUMN new_id VARCHAR(8)');
      } catch (e) {}
      try {
        await connection.query('ALTER TABLE charity_slides ADD COLUMN new_charity_id VARCHAR(8)');
      } catch (e) {}
      
      // Update charities with new IDs
      for (let i = 0; i < charities.length; i++) {
        const charity = charities[i];
        const newId = charityIdMap[charity.id];
        await connection.query(
          'UPDATE charities SET new_id = ?, display_order = ?, img = ? WHERE id = ?',
          [newId, i + 1, newId, charity.id]
        );
      }
      console.log('✓ Updated charities with new IDs');
      
      // Update slides with new IDs
      for (const slide of slides) {
        const newId = slideIdMap[slide.id];
        const newCharityId = charityIdMap[slide.charity_id];
        const displayOrder = slideDisplayOrders[slide.id];
        await connection.query(
          'UPDATE charity_slides SET new_id = ?, new_charity_id = ?, display_order = ?, img = ? WHERE id = ?',
          [newId, newCharityId, displayOrder, newId, slide.id]
        );
      }
      console.log('✓ Updated slides with new IDs');
      
      // Drop foreign key - try multiple possible constraint names
      const fkNames = ['fk_charity_slide_charity', 'charity_slides_ibfk_1'];
      for (const fkName of fkNames) {
        try {
          await connection.query(`ALTER TABLE charity_slides DROP FOREIGN KEY ${fkName}`);
          console.log(`✓ Dropped foreign key: ${fkName}`);
        } catch (e) {
          // Constraint may not exist with this name
        }
      }
      
      // Also try to find and drop any remaining foreign keys
      try {
        const [fks] = await connection.query(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.TABLE_CONSTRAINTS 
          WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'charity_slides' 
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        `, [DB_CONFIG.database]);
        
        for (const fk of fks) {
          try {
            await connection.query(`ALTER TABLE charity_slides DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
            console.log(`✓ Dropped foreign key: ${fk.CONSTRAINT_NAME}`);
          } catch (e) {}
        }
      } catch (e) {}
      
      // Modify charities table - first remove AUTO_INCREMENT
      await connection.query('ALTER TABLE charities MODIFY COLUMN id INT NOT NULL');
      await connection.query('ALTER TABLE charities DROP PRIMARY KEY');
      await connection.query('ALTER TABLE charities DROP COLUMN id');
      await connection.query('ALTER TABLE charities CHANGE new_id id VARCHAR(8) NOT NULL');
      await connection.query('ALTER TABLE charities ADD PRIMARY KEY (id)');
      console.log('✓ Modified charities table schema');
      
      // Modify charity_slides table - first remove AUTO_INCREMENT
      await connection.query('ALTER TABLE charity_slides MODIFY COLUMN id INT NOT NULL');
      await connection.query('ALTER TABLE charity_slides DROP PRIMARY KEY');
      await connection.query('ALTER TABLE charity_slides DROP COLUMN id');
      await connection.query('ALTER TABLE charity_slides DROP COLUMN charity_id');
      await connection.query('ALTER TABLE charity_slides CHANGE new_id id VARCHAR(8) NOT NULL');
      await connection.query('ALTER TABLE charity_slides CHANGE new_charity_id charity_id VARCHAR(8) NOT NULL');
      await connection.query('ALTER TABLE charity_slides ADD PRIMARY KEY (id)');
      console.log('✓ Modified charity_slides table schema');
      
      // Re-add foreign key
      await connection.query(
        'ALTER TABLE charity_slides ADD CONSTRAINT fk_charity_slide_charity FOREIGN KEY (charity_id) REFERENCES charities(id) ON DELETE CASCADE ON UPDATE CASCADE'
      );
      console.log('✓ Re-added foreign key constraint');
      
      // Re-enable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      
      // Commit transaction
      await connection.commit();
      console.log('\n✓ Database migration completed successfully!');
      
      // Rename folders
      console.log('\n🔄 Renaming folders...\n');
      
      // Rename thumbnail folders
      const thumbnailsPath = path.join(CHARITIES_PUBLIC_PATH, 'thumbnails');
      if (fs.existsSync(thumbnailsPath)) {
        for (const charity of charities) {
          const oldPath = path.join(thumbnailsPath, String(charity.id));
          const newPath = path.join(thumbnailsPath, charityIdMap[charity.id]);
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`✓ Renamed thumbnails/${charity.id} -> thumbnails/${charityIdMap[charity.id]}`);
          }
        }
      }
      
      // Rename slide folders
      const slidesPath = path.join(CHARITIES_PUBLIC_PATH, 'slides');
      if (fs.existsSync(slidesPath)) {
        for (const slide of slides) {
          const oldPath = path.join(slidesPath, String(slide.id));
          const newPath = path.join(slidesPath, slideIdMap[slide.id]);
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`✓ Renamed slides/${slide.id} -> slides/${slideIdMap[slide.id]}`);
          }
        }
      }
      
      console.log('\n✅ Migration completed successfully!');
      
      // Output the mapping as JSON for server migration
      const mappingData = {
        charityIdMap,
        slideIdMap,
        slideDisplayOrders,
        timestamp: new Date().toISOString()
      };
      
      const mappingPath = path.join(__dirname, 'charityIdMapping.json');
      fs.writeFileSync(mappingPath, JSON.stringify(mappingData, null, 2));
      console.log(`\n📄 ID mapping saved to: ${mappingPath}`);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run migration
migrateCharityIds();
