# Quick Reference: Model Updates and Schema Validation

## What Changed?

### 1. New BaseModel Class
All models now extend from `BaseModel` which provides:
- Automatic schema validation
- Auto-migration capabilities
- Foreign key management

### 2. Lesson Model Updates
**Major Change**: `playlist_id` is now a proper foreign key

**Before:**
```javascript
playlist_id VARCHAR(100) NOT NULL
```

**After:**
```javascript
playlist_id INT NOT NULL
FOREIGN KEY (playlist_id) REFERENCES lesson_playlists(id) ON DELETE CASCADE
```

**Benefits:**
- Data integrity enforced at database level
- Automatic cascade delete (deleting playlist removes its lessons)
- Better query performance with proper indexing
- Prevents orphaned lessons

### 3. New Model Methods

#### Lesson.findAllWithPlaylist(filters)
Get lessons with playlist information in a single query:
```javascript
const lessons = await Lesson.findAllWithPlaylist({ isActive: true });
// Each lesson includes: playlist_title, playlist_description, playlist_external_id
```

#### Lesson.findByPlaylist(playlistId)
Now handles both formats:
```javascript
// New format (INT foreign key)
await Lesson.findByPlaylist(1);

// Legacy format (string playlist_id)
await Lesson.findByPlaylist('PLY123');
```

## How to Use

### Running Migration (One-Time Only)

If you have existing data with VARCHAR playlist_id values:

```bash
cd war-server
npm run migrate:playlist
```

This will:
1. Map existing string playlist_ids to integer foreign keys
2. Create proper foreign key constraints
3. Clean up old columns

### Testing Schema Validation

To verify all models are properly configured:

```bash
npm run test:schema
```

This will:
1. Validate all model schemas
2. Show any needed updates
3. Test foreign key relationships

### Starting the Server

Normal server startup now includes automatic schema validation:

```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will:
1. Check each table's schema
2. Apply any needed updates automatically
3. Log all changes to console

## NPM Scripts Reference

```bash
# Start server (production)
npm start

# Start server with auto-reload (development)
npm run dev

# Seed database with sample data
npm run seed

# Migrate lesson playlist_id to foreign key
npm run migrate:playlist

# Test schema validation
npm run test:schema
```

## Schema Validation on Startup

When you start the server, you'll see output like:

```
✓ Table 'lesson_playlists' is ready
✓ Table 'lesson_playlists' schema is up to date
✓ Table 'lessons' is ready
⚠ Table 'lessons' schema needs updates:
  - Modifying 1 column(s): playlist_id
  - Adding 1 index(es): fk_lesson_playlist
  Executing: ALTER TABLE lessons MODIFY COLUMN playlist_id INT NOT NULL
  Executing: ALTER TABLE lessons ADD CONSTRAINT fk_lesson_playlist...
✓ Table 'lessons' schema updated successfully
```

## Adding New Fields

To add a new field to any model:

1. **Update the getSchema() method:**
```javascript
static getSchema() {
  return {
    columns: [
      // ... existing columns
      {
        name: 'new_field',
        type: 'VARCHAR(255)',
        nullable: true,
        default: null
      }
    ],
    // ... indexes
  };
}
```

2. **Update the CREATE TABLE in ensureTable():**
```javascript
CREATE TABLE IF NOT EXISTS ${this.tableName} (
  -- ... existing fields
  new_field VARCHAR(255) DEFAULT NULL,
  -- ...
)
```

3. **Restart server** - the new field will be added automatically!

## Common Issues

### Issue: "Cannot add foreign key constraint"
**Cause**: Referenced table doesn't exist or column type mismatch

**Solution**:
1. Ensure lesson_playlists table exists
2. Ensure lesson_playlists.id is INT
3. Run tables in correct order (playlists before lessons)

### Issue: "Unmapped lessons" during migration
**Cause**: Lessons reference playlists that don't exist

**Solution**:
1. Create missing playlists in lesson_playlists table
2. Or delete orphaned lessons
3. Re-run migration

### Issue: Schema not updating automatically
**Cause**: Syntax error in schema definition

**Solution**:
1. Check console output for errors
2. Verify schema definition format
3. Check MODEL_SCHEMA_VALIDATION.md for examples

## Best Practices

1. ✅ **Always backup** before running migrations
2. ✅ **Test in development** before production
3. ✅ **Review console logs** during startup
4. ✅ **Keep schema definitions** up to date
5. ✅ **Use npm scripts** for consistency

## Need Help?

- See `MODEL_SCHEMA_VALIDATION.md` for detailed documentation
- Check `src/models/BaseModel.js` for implementation details
- Review `src/scripts/migrateLessonPlaylistFK.js` for migration logic
- Run `npm run test:schema` to validate setup

## Files Modified

- `src/models/BaseModel.js` - NEW: Base class for all models
- `src/models/Lesson.js` - Updated with FK and schema validation
- `src/models/LessonPlaylist.js` - Updated with schema validation
- `src/models/User.js` - Updated with schema validation
- `src/models/Charity.js` - Updated with schema validation
- `src/models/CharitySlide.js` - Updated with FK and schema validation
- `src/models/Warroom.js` - Updated with schema validation
- `src/scripts/migrateLessonPlaylistFK.js` - NEW: Migration script
- `src/scripts/testSchemaValidation.js` - NEW: Testing script
- `package.json` - Added new npm scripts

## Example Usage

```javascript
// Create a playlist first
const playlist = await LessonPlaylist.create({
  playlist_id: 'PLY123',
  title: 'My Playlist',
  description: 'A sample playlist'
});

// Create a lesson with foreign key reference
const lesson = await Lesson.create({
  title: 'My Lesson',
  img: 'lesson.jpg',
  videoLink: 'https://...',
  authors: ['Author 1'],
  size: 'medium',
  playlist_id: playlist.id,  // Use the INTEGER ID, not string!
  recommend: true
});

// Query lessons with playlist info
const lessonsWithPlaylist = await Lesson.findAllWithPlaylist({
  recommend: true
});

console.log(lessonsWithPlaylist[0].playlist_title); // 'My Playlist'
```
