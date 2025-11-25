# Model Updates Summary

## Overview
This update implements a comprehensive schema validation and auto-migration system for all database models, with a specific focus on converting the Lesson model's `playlist_id` from a string reference to a proper foreign key relationship.

## Key Changes

### 1. BaseModel Class (NEW)
**File**: `src/models/BaseModel.js`

A new base class that all models extend from, providing:

- **Schema Definition**: Structured way to define expected database schema
- **Schema Validation**: Compares model schema with actual database structure
- **Auto-Migration**: Generates and executes ALTER TABLE statements
- **Foreign Key Support**: Proper foreign key relationships with CASCADE rules
- **Column Management**: Adds, modifies columns as needed
- **Index Management**: Creates and updates indexes automatically

**Key Methods**:
- `getSchema()` - Returns expected schema (must be implemented by child classes)
- `validateAndUpdateSchema()` - Validates and updates table schema
- `getTableStructure()` - Fetches current database structure
- `compareSchemas()` - Identifies differences between expected and actual
- `generateAlterStatements()` - Creates SQL ALTER statements

### 2. Lesson Model Updates
**File**: `src/models/Lesson.js`

**Breaking Change**: `playlist_id` changed from `VARCHAR(100)` to `INT` with foreign key

**Before**:
```sql
playlist_id VARCHAR(100) NOT NULL
INDEX idx_playlist (playlist_id)
```

**After**:
```sql
playlist_id INT NOT NULL
INDEX idx_playlist (playlist_id)
CONSTRAINT fk_lesson_playlist 
  FOREIGN KEY (playlist_id) 
  REFERENCES lesson_playlists(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE
```

**New Methods**:
- `findAllWithPlaylist(filters)` - Joins lessons with playlist details
- Enhanced `findByPlaylist(playlistId)` - Handles both INT and VARCHAR (for backward compatibility)

**Changes**:
- Now extends `BaseModel`
- Implements `getSchema()` method
- Calls `validateAndUpdateSchema()` after table creation
- Foreign key ensures data integrity

### 3. LessonPlaylist Model Updates
**File**: `src/models/LessonPlaylist.js`

**Changes**:
- Now extends `BaseModel`
- Implements `getSchema()` method
- Calls `validateAndUpdateSchema()` after table creation
- Schema includes proper UNIQUE constraint on `playlist_id`

### 4. User Model Updates
**File**: `src/models/User.js`

**Changes**:
- Now extends `BaseModel`
- Implements `getSchema()` method
- Calls `validateAndUpdateSchema()` after table creation
- Schema includes UNIQUE constraints on `username` and `email`

### 5. Charity Model Updates
**File**: `src/models/Charity.js`

**Changes**:
- Now extends `BaseModel`
- Implements `getSchema()` method
- Calls `validateAndUpdateSchema()` after table creation
- Proper ENUM and DECIMAL type definitions

### 6. CharitySlide Model Updates
**File**: `src/models/CharitySlide.js`

**Changes**:
- Now extends `BaseModel`
- Implements `getSchema()` method
- Calls `validateAndUpdateSchema()` after table creation
- Foreign key to `charities(id)` with CASCADE

### 7. Warroom Model Updates
**File**: `src/models/Warroom.js`

**Changes**:
- Now extends `BaseModel`
- Implements `getSchema()` method
- Calls `validateAndUpdateSchema()` after table creation
- Proper status field definition

### 8. Migration Script (NEW)
**File**: `src/scripts/migrateLessonPlaylistFK.js`

**Purpose**: One-time migration to convert existing lesson data from VARCHAR to INT foreign key

**What It Does**:
1. Checks current schema structure
2. Creates temporary mapping column
3. Maps VARCHAR playlist_id to INT lesson_playlists.id
4. Swaps old and new columns
5. Adds foreign key constraint
6. Cleans up temporary columns
7. Provides detailed logging and error handling

**Usage**: `npm run migrate:playlist`

### 9. Testing Script (NEW)
**File**: `src/scripts/testSchemaValidation.js`

**Purpose**: Validates all model schemas and tests foreign key relationships

**What It Does**:
1. Validates each model's schema
2. Shows column and index counts
3. Lists foreign key relationships
4. Tests Lesson-Playlist relationship
5. Provides detailed output

**Usage**: `npm run test:schema`

### 10. Documentation (NEW)

**Files Created**:
- `MODEL_SCHEMA_VALIDATION.md` - Comprehensive documentation
- `QUICK_REFERENCE_SCHEMA.md` - Quick reference guide
- `MODEL_UPDATES_SUMMARY.md` - This file

### 11. Package.json Updates
**File**: `package.json`

**New Scripts**:
```json
{
  "migrate:playlist": "node src/scripts/migrateLessonPlaylistFK.js",
  "test:schema": "node src/scripts/testSchemaValidation.js"
}
```

## Benefits

### 1. Data Integrity
- Foreign keys enforce referential integrity
- Cascade delete prevents orphaned records
- Type safety with proper data types

### 2. Maintainability
- Schema definitions in code (single source of truth)
- Automatic migrations reduce manual SQL work
- Consistent model structure across codebase

### 3. Development Experience
- Auto-sync database with model changes
- Clear console output showing changes
- Easy to add new fields or constraints

### 4. Production Safety
- No automatic column deletion
- Detailed error logging
- Migration scripts can be reviewed before running

## Migration Path

### For Existing Databases:

1. **Backup your database**
   ```bash
   mysqldump -u user -p war_room_db > backup.sql
   ```

2. **Update code**
   ```bash
   git pull  # or copy new files
   ```

3. **Run migration script**
   ```bash
   cd war-server
   npm run migrate:playlist
   ```

4. **Test schema validation**
   ```bash
   npm run test:schema
   ```

5. **Start server**
   ```bash
   npm start
   ```

### For New Installations:

1. **Install dependencies**
   ```bash
   cd war-server
   npm install
   ```

2. **Configure database** (`.env` file)

3. **Start server** (tables created automatically)
   ```bash
   npm start
   ```

4. **Seed data** (optional)
   ```bash
   npm run seed
   ```

## Breaking Changes

### Lesson Model

**API Changes**:
- When creating lessons, `playlist_id` must now be an INTEGER (the ID from lesson_playlists table)
- Old string-based playlist_id values will not work directly

**Before**:
```javascript
await Lesson.create({
  // ...
  playlist_id: 'PLY123'  // VARCHAR string
});
```

**After**:
```javascript
// First get the playlist
const playlist = await LessonPlaylist.findByPlaylistId('PLY123');

// Then use its ID
await Lesson.create({
  // ...
  playlist_id: playlist.id  // INT foreign key
});
```

**Backward Compatibility**:
The `findByPlaylist()` method still accepts both formats:
```javascript
// Works with new INT format
await Lesson.findByPlaylist(1);

// Still works with old VARCHAR format (converted internally)
await Lesson.findByPlaylist('PLY123');
```

## Rollback Plan

If you need to rollback:

1. **Restore database backup**
   ```bash
   mysql -u user -p war_room_db < backup.sql
   ```

2. **Checkout previous code version**
   ```bash
   git checkout <previous-commit>
   ```

3. **Restart server**

## Testing

### Manual Testing Checklist

- [ ] Server starts without errors
- [ ] All tables are created/updated
- [ ] Foreign key relationships work
- [ ] Can create lesson with playlist_id
- [ ] Cannot create lesson with invalid playlist_id
- [ ] Deleting playlist cascades to lessons
- [ ] Schema validation logs show correct changes
- [ ] Migration script completes successfully (if needed)

### Automated Testing

```bash
# Run schema validation test
npm run test:schema

# Check for any console errors
npm start
```

## Performance Impact

- **Positive**: Foreign key indexes improve JOIN performance
- **Positive**: Proper data types reduce storage size
- **Neutral**: Schema validation only runs on startup
- **Minimal**: ALTER TABLE statements only run when schema changes

## Security Considerations

- Foreign keys prevent data inconsistency
- Schema validation prevents unauthorized schema changes
- No SQL injection vectors introduced
- Migration scripts should be reviewed before running in production

## Future Enhancements

Potential improvements:
- [ ] Migration version tracking system
- [ ] Automatic rollback on migration failure
- [ ] Schema export/import tools
- [ ] Dry-run mode for migrations
- [ ] Integration tests for all models
- [ ] Performance benchmarking

## Support

For issues or questions:
1. Check console output for detailed error messages
2. Review `MODEL_SCHEMA_VALIDATION.md` for comprehensive guide
3. Run `npm run test:schema` to diagnose issues
4. Check database logs for constraint violations

## Files Modified

### Core Changes
- `src/models/BaseModel.js` ⭐ NEW
- `src/models/Lesson.js` ✏️ MAJOR UPDATE
- `src/models/LessonPlaylist.js` ✏️ UPDATED
- `src/models/User.js` ✏️ UPDATED
- `src/models/Charity.js` ✏️ UPDATED
- `src/models/CharitySlide.js` ✏️ UPDATED
- `src/models/Warroom.js` ✏️ UPDATED

### Scripts
- `src/scripts/migrateLessonPlaylistFK.js` ⭐ NEW
- `src/scripts/testSchemaValidation.js` ⭐ NEW

### Documentation
- `MODEL_SCHEMA_VALIDATION.md` ⭐ NEW
- `QUICK_REFERENCE_SCHEMA.md` ⭐ NEW
- `MODEL_UPDATES_SUMMARY.md` ⭐ NEW (this file)

### Configuration
- `package.json` ✏️ UPDATED (new scripts)

## Conclusion

This update provides a robust foundation for database schema management with automatic validation and migration capabilities. The conversion of the Lesson model to use proper foreign keys significantly improves data integrity and query performance.

All models now follow a consistent pattern with clear schema definitions, making future updates easier and safer.
