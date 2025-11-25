# Developer Upgrade Guide

## For Team Members: How to Update Your Local Environment

This guide will help you upgrade your local development environment to work with the new schema validation system and foreign key relationships.

## Prerequisites

- MySQL database running
- Node.js and npm installed
- Access to the war-server project

## Step-by-Step Instructions

### Step 1: Backup Your Database (IMPORTANT!)

Before making any changes, backup your database:

```bash
# Mac/Linux
mysqldump -u root -p war_room_db > ~/backup_$(date +%Y%m%d).sql

# Windows
mysqldump -u root -p war_room_db > backup_%date:~-4%%date:~-10,2%%date:~-7,2%.sql
```

### Step 2: Pull Latest Code

```bash
cd /path/to/war_room-project
git pull origin api
```

### Step 3: Install Dependencies (if any new)

```bash
cd war-server
npm install
```

### Step 4: Understand What Changed

The main changes are:
- ✅ All models now have automatic schema validation
- ⚠️ **Lesson.playlist_id changed from VARCHAR to INT (Foreign Key)**
- ✅ New BaseModel class provides auto-migration
- ✅ Foreign keys enforce data integrity

### Step 5: Choose Your Migration Path

You have two options depending on your data situation:

#### Option A: Fresh Start (No Important Data)

If you don't have important data or can re-seed:

```bash
# Drop and recreate the database
mysql -u root -p -e "DROP DATABASE IF EXISTS war_room_db; CREATE DATABASE war_room_db;"

# Start server (creates tables automatically with new schema)
npm start

# Seed with fresh data (Ctrl+C the server first)
npm run seed
```

#### Option B: Migrate Existing Data (Has Important Data)

If you have data you want to keep:

```bash
# Run the migration script
npm run migrate:playlist
```

**What the migration does**:
1. Checks if migration is needed
2. Maps existing VARCHAR playlist_id to INT foreign keys
3. Updates the table structure
4. Preserves all your data

**Watch the output carefully**. If you see warnings like:
```
⚠ Warning: Playlist 'PLY123' not found for lesson ID 5
```

This means you have lessons referencing playlists that don't exist. You need to:
1. Create the missing playlist in lesson_playlists, OR
2. Delete the orphaned lesson

Then run the migration again.

### Step 6: Verify Migration

Test that everything works:

```bash
npm run test:schema
```

You should see output like:
```
✓ Table 'lesson_playlists' validation completed successfully
✓ Table 'lessons' validation completed successfully
✓ Found X lesson(s) with playlist details
```

### Step 7: Start the Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

Watch the console output. You should see:
```
✓ Table 'lessons' is ready
✓ Table 'lessons' schema is up to date
```

### Step 8: Test Your Application

1. **Test Lesson Creation**: Try creating a new lesson
2. **Test Playlist Queries**: Fetch lessons by playlist
3. **Test Foreign Key**: Try to create a lesson with an invalid playlist_id (should fail)
4. **Test Cascade Delete**: Delete a playlist and verify its lessons are also deleted

## Common Issues and Solutions

### Issue 1: "Cannot add foreign key constraint"

**Error**: `ER_NO_REFERENCED_ROW_2` or `ER_FK_CANNOT_ADD_CHILD`

**Cause**: Lessons reference playlists that don't exist

**Solution**:
```bash
# Find orphaned lessons
mysql -u root -p war_room_db -e "
  SELECT l.id, l.title, l.playlist_id 
  FROM lessons l 
  LEFT JOIN lesson_playlists p ON l.playlist_id = p.playlist_id 
  WHERE p.id IS NULL;
"

# Option 1: Create missing playlists
# Option 2: Delete orphaned lessons
# Then re-run migration
npm run migrate:playlist
```

### Issue 2: Migration Script Fails Midway

**Solution**:
1. Restore from backup
2. Fix the issue identified in error message
3. Run migration again

```bash
mysql -u root -p war_room_db < ~/backup_YYYYMMDD.sql
# Fix the issue
npm run migrate:playlist
```

### Issue 3: Server Won't Start After Update

**Check**:
1. Are all dependencies installed? `npm install`
2. Is database running? `mysql -u root -p`
3. Is .env file configured correctly?
4. Check console output for specific errors

**Common fixes**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check database connection
mysql -u root -p -e "SHOW DATABASES;"
```

### Issue 4: "getSchema is not defined" Error

**Cause**: Model is trying to validate schema but hasn't been updated

**Solution**: Make sure you pulled all changes and all models extend BaseModel

```bash
git status  # Check if all files are updated
git pull origin api  # Pull again if needed
```

## Code Changes You Need to Make

### If You Create Lessons in Your Code

**Old Way** (won't work anymore):
```javascript
await Lesson.create({
  title: 'My Lesson',
  playlist_id: 'PLY123',  // ❌ VARCHAR string
  // ...
});
```

**New Way**:
```javascript
// Find the playlist first
const playlist = await LessonPlaylist.findByPlaylistId('PLY123');

// Use its numeric ID
await Lesson.create({
  title: 'My Lesson',
  playlist_id: playlist.id,  // ✅ INT foreign key
  // ...
});
```

### If You Query Lessons by Playlist

**Good News**: The `findByPlaylist()` method still works with both formats!

```javascript
// Both of these work:
await Lesson.findByPlaylist(1);         // INT format
await Lesson.findByPlaylist('PLY123');  // String format (converted)
```

### New Feature: Get Lessons with Playlist Details

```javascript
// New method - gets lessons with playlist info in one query
const lessons = await Lesson.findAllWithPlaylist({ 
  isActive: true 
});

lessons.forEach(lesson => {
  console.log(lesson.title);              // Lesson title
  console.log(lesson.playlist_title);     // Playlist title (joined)
  console.log(lesson.playlist_description); // Playlist description
});
```

## NPM Scripts Reference

```bash
# Development
npm run dev              # Start with auto-reload
npm start                # Start production server

# Database
npm run seed             # Seed database with sample data
npm run migrate:playlist # Migrate playlist foreign key (one-time)
npm run test:schema      # Validate all schemas

# Testing
npm test                 # Run tests (if available)
```

## Verification Checklist

After upgrading, verify:

- [ ] Server starts without errors
- [ ] Can view existing lessons
- [ ] Can create new lesson (with numeric playlist_id)
- [ ] Can query lessons by playlist
- [ ] Foreign key constraint works (try invalid playlist_id)
- [ ] Schema validation logs appear on startup
- [ ] All models show "schema is up to date"

## Getting Help

If you encounter issues:

1. **Check the documentation**:
   - `MODEL_SCHEMA_VALIDATION.md` - Comprehensive guide
   - `QUICK_REFERENCE_SCHEMA.md` - Quick reference
   - `MODEL_UPDATES_SUMMARY.md` - Summary of changes

2. **Run diagnostic tools**:
   ```bash
   npm run test:schema  # Validate schemas
   ```

3. **Check your database**:
   ```bash
   mysql -u root -p war_room_db -e "DESCRIBE lessons;"
   mysql -u root -p war_room_db -e "SHOW CREATE TABLE lessons\G"
   ```

4. **Review server logs**: Look for error messages on startup

5. **Ask for help**: Share the error message and steps you've taken

## Rollback Instructions

If something goes wrong and you need to rollback:

```bash
# 1. Stop the server (Ctrl+C)

# 2. Restore database backup
mysql -u root -p war_room_db < ~/backup_YYYYMMDD.sql

# 3. Checkout previous code version
git log --oneline  # Find the commit before the update
git checkout <previous-commit-hash>

# 4. Reinstall dependencies
npm install

# 5. Start server
npm start
```

## Next Steps

After successful upgrade:

1. Update any custom code that creates/updates lessons
2. Test all lesson-related features thoroughly
3. Update any documentation you maintain
4. Inform team members of the changes

## Benefits You'll Notice

✅ **Data Integrity**: Can't create lessons with invalid playlists
✅ **Automatic Cleanup**: Deleting a playlist removes its lessons
✅ **Better Performance**: Foreign key indexes speed up queries
✅ **Easier Maintenance**: Schema auto-updates on model changes
✅ **Type Safety**: Proper data types prevent bugs

## Questions?

- Review the documentation files in the war-server directory
- Check the console output carefully
- Don't hesitate to ask for help!

---

**Remember**: Always backup before making database changes! 🔒
