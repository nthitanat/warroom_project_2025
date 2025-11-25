# Model Schema Validation and Auto-Migration

This document explains the new BaseModel class and schema validation system that has been implemented across all models.

## Overview

All models now extend from `BaseModel` which provides:

1. **Schema Definition**: Each model defines its expected database schema
2. **Auto-Validation**: Automatically checks if database matches the model schema
3. **Auto-Migration**: Generates and executes ALTER TABLE statements to sync the database with the model
4. **Foreign Key Support**: Proper foreign key relationships with CASCADE options

## Key Features

### 1. Schema Definition

Each model now implements a `getSchema()` method that returns the expected schema:

```javascript
static getSchema() {
  return {
    columns: [
      {
        name: 'id',
        type: 'INT AUTO_INCREMENT PRIMARY KEY',
        nullable: false
      },
      {
        name: 'title',
        type: 'VARCHAR(500)',
        nullable: false
      },
      // ... more columns
    ],
    indexes: [
      {
        name: 'idx_title',
        columns: ['title'],
        type: 'INDEX'
      },
      {
        name: 'fk_relation',
        columns: ['foreign_id'],
        type: 'FOREIGN KEY',
        references: {
          table: 'other_table',
          column: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    ]
  };
}
```

### 2. Automatic Schema Validation

When `validateAndUpdateSchema()` is called, the system:

1. Fetches the current table structure from the database
2. Compares it with the expected schema from `getSchema()`
3. Identifies differences:
   - Columns to add
   - Columns to modify
   - Indexes to add
   - Foreign keys to add/update
4. Generates appropriate ALTER TABLE statements
5. Executes them to bring the database in sync

### 3. Changes to Lesson Model

The Lesson model has been updated with significant changes:

#### Old Structure
- `playlist_id` was `VARCHAR(100)` with no foreign key constraint
- String-based playlist identification

#### New Structure
- `playlist_id` is now `INT` with a proper foreign key constraint
- References `lesson_playlists(id)`
- Cascade delete and update rules
- Better data integrity

### 4. Migration Script

A migration script has been created to help transition existing data:

**Location**: `/war-server/src/scripts/migrateLessonPlaylistFK.js`

**What it does**:
1. Checks current schema
2. Creates temporary mapping column
3. Maps old VARCHAR playlist_id values to new INT foreign keys
4. Swaps columns
5. Adds foreign key constraint
6. Cleans up old column

**How to run**:
```bash
cd war-server
node src/scripts/migrateLessonPlaylistFK.js
```

## Updated Models

All models have been updated to extend BaseModel:

1. **Lesson** - Now uses INT foreign key for playlist_id
2. **LessonPlaylist** - Proper schema definition
3. **User** - Schema validation support
4. **Charity** - Schema validation support
5. **CharitySlide** - Foreign key to charities table
6. **Warroom** - Schema validation support

## Usage

### For Existing Tables

When you start the server, each model will automatically:
1. Check if the table exists
2. If not, create it
3. If yes, validate the schema
4. Apply any necessary updates

### Adding New Columns

To add a new column to a model:

1. Update the `getSchema()` method in the model:
```javascript
{
  name: 'new_column',
  type: 'VARCHAR(255)',
  nullable: true,
  default: null
}
```

2. Restart the server - the column will be added automatically

### Adding Foreign Keys

To add a foreign key:

1. Add the column definition:
```javascript
{
  name: 'related_id',
  type: 'INT',
  nullable: false
}
```

2. Add the foreign key index:
```javascript
{
  name: 'fk_model_related',
  columns: ['related_id'],
  type: 'FOREIGN KEY',
  references: {
    table: 'related_table',
    column: 'id'
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
}
```

3. Restart the server

## New Methods Available

### Lesson Model

#### `findAllWithPlaylist(filters)`
Returns lessons with joined playlist information:
```javascript
const lessons = await Lesson.findAllWithPlaylist({
  isActive: true,
  recommend: true
});
// Returns lessons with playlist_title, playlist_description, etc.
```

#### `findByPlaylist(playlistId)`
Now accepts both INT (new foreign key) and VARCHAR (legacy string ID):
```javascript
// Using new INT foreign key
const lessons = await Lesson.findByPlaylist(1);

// Using legacy string playlist_id (will be converted)
const lessons = await Lesson.findByPlaylist('PLY123');
```

## Safety Features

1. **No Automatic Column Deletion**: The system does not automatically drop columns to prevent data loss
2. **Error Handling**: All migration errors are caught and logged
3. **Validation Before Foreign Keys**: Ensures referenced tables exist before adding foreign keys
4. **Rollback Capability**: Failed migrations don't corrupt the database

## Console Output

When tables are validated, you'll see output like:

```
✓ Table 'lesson_playlists' schema is up to date
⚠ Table 'lessons' schema needs updates:
  - Modifying 1 column(s): playlist_id
  - Adding 1 index(es): fk_lesson_playlist
  Executing: ALTER TABLE lessons MODIFY COLUMN playlist_id INT NOT NULL
  Executing: ALTER TABLE lessons ADD CONSTRAINT fk_lesson_playlist...
✓ Table 'lessons' schema updated successfully
```

## Best Practices

1. **Always backup your database** before running migrations
2. **Test in development** before applying to production
3. **Review the console output** to understand what changes are being made
4. **Run migration script** when changing from VARCHAR to INT foreign keys
5. **Keep schema definitions** in sync with your CREATE TABLE statements

## Troubleshooting

### Foreign Key Errors

If you see foreign key constraint errors:
1. Ensure the referenced table exists
2. Ensure the referenced column exists
3. Check that data types match exactly
4. Verify no orphaned records exist

### Column Type Mismatches

If a column isn't being recognized as matching:
1. Check the `normalizeColumnType()` method in BaseModel
2. Ensure type definitions match MySQL's format exactly
3. Look at console output to see what's being compared

### Migration Script Issues

If the migration script fails:
1. Check the error message carefully
2. Ensure all playlists exist in lesson_playlists table
3. Manually handle any unmapped lessons
4. Re-run the script after fixing issues

## Future Enhancements

Potential improvements to consider:
- Migration version tracking
- Rollback functionality
- Automatic backups before migrations
- Migration dry-run mode
- Schema export/import tools
