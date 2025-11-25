# 🧪 Database Seeding - Testing Guide

Quick testing guide to verify the seeding script works correctly.

## Pre-Test Checklist

- [ ] MySQL server is running
- [ ] `.env` file is configured
- [ ] `war-client/public` folder exists with JSON files
- [ ] Node.js dependencies installed (`npm install`)

## Test Scenarios

### Test 1: Fresh Database Seeding

**Objective**: Verify seeding works on a clean database

```bash
cd war-server

# Drop database if exists (CAUTION!)
mysql -u your_username -p -e "DROP DATABASE IF EXISTS war_room_db;"

# Run seeding
npm run seed
```

**Expected Results**:
```
✓ Database 'war_room_db' is ready
✓ Table 'charities' is ready
✓ Table 'charity_slides' is ready
✓ Table 'lesson_playlists' is ready
✓ Table 'lessons' is ready
✓ Table 'warrooms' is ready

✓ Charities: 3 inserted, 0 failed
✓ Charity Slides: 32 inserted, 0 failed
✓ Lesson Playlists: 2 inserted, 0 failed
✓ Lessons: 15 inserted, 0 failed
✓ Warrooms: 7 inserted, 0 failed
```

### Test 2: Re-seeding (Overwrite Data)

**Objective**: Verify the script can clear and re-seed

```bash
# Run seed twice
npm run seed
npm run seed
```

**Expected**: Both runs should succeed with same counts

### Test 3: Data Verification

**Objective**: Verify data was inserted correctly

```bash
# Connect to MySQL
mysql -u your_username -p war_room_db
```

```sql
-- Check charities
SELECT id, title, expected_fund FROM charities;
-- Expected: 3 rows

-- Check charity slides
SELECT charity_id, COUNT(*) as slide_count 
FROM charity_slides 
GROUP BY charity_id;
-- Expected: charity_id 1 (2 slides), 2 (20 slides), 3 (10 slides)

-- Check lesson playlists
SELECT playlist_id, title FROM lesson_playlists;
-- Expected: 2 rows (playlist_id: '1', '2')

-- Check lessons
SELECT COUNT(*) as total_lessons FROM lessons;
-- Expected: 15 rows

-- Verify JSON fields are properly stored
SELECT id, title, authors, size FROM lessons LIMIT 1;
-- Expected: authors and size should be valid JSON strings

-- Check warrooms
SELECT COUNT(*) as total_warrooms, status, COUNT(*) 
FROM warrooms 
GROUP BY status;
-- Expected: Multiple rows showing different statuses

-- Verify foreign keys work
SELECT c.title, COUNT(cs.id) as slide_count
FROM charities c
LEFT JOIN charity_slides cs ON c.id = cs.charity_id
GROUP BY c.id;
-- Expected: All charities with their slide counts
```

### Test 4: Field Mapping Verification

**Objective**: Verify field mappings are correct

```sql
-- Check lesson size field (should be JSON string)
SELECT title, size FROM lessons WHERE id = 1;
-- Expected: size = '{"xs":12,"md":3}' (JSON string)

-- Check authors field (should be JSON array)
SELECT title, authors FROM lessons WHERE id = 1;
-- Expected: authors = '[{"name":"ChulaDSN","avatar":"..."}]'

-- Check playlist thumbnail mapping
SELECT playlist_id, thumbnail FROM lesson_playlists;
-- Expected: thumbnail field should have image paths

-- Verify warroom doesn't have 'tag' or 'authors' fields
DESCRIBE warrooms;
-- Expected: No 'tag' or 'authors' columns
```

### Test 5: Foreign Key Integrity

**Objective**: Verify foreign key constraints work

```sql
-- Try to delete a charity with slides (should cascade)
DELETE FROM charities WHERE id = 1;
SELECT COUNT(*) FROM charity_slides WHERE charity_id = 1;
-- Expected: 0 slides (cascade delete worked)

-- Re-seed to restore
-- Exit MySQL and run: npm run seed
```

### Test 6: API Integration Test

**Objective**: Verify API can read seeded data

```bash
# Start the server
npm start
```

In another terminal or browser:
```bash
# Test charity endpoints
curl http://localhost:5000/api/charities

# Test charity slides
curl http://localhost:5000/api/charities/1/slides

# Test lessons
curl http://localhost:5000/api/lessons

# Test lesson playlists
curl http://localhost:5000/api/lessons/playlists

# Test warrooms
curl http://localhost:5000/api/warrooms
```

**Expected**: All endpoints return proper JSON data

### Test 7: Error Handling

**Objective**: Verify script handles errors gracefully

```bash
# Test with wrong database credentials
# Edit .env to use wrong password
npm run seed
# Expected: Clear error message about connection failure

# Test with missing JSON files
mv ../war-client/public/charities/charitiesData.json ../war-client/public/charities/charitiesData.json.bak
npm run seed
# Expected: Warning about missing file, continues with other files
mv ../war-client/public/charities/charitiesData.json.bak ../war-client/public/charities/charitiesData.json
```

### Test 8: Shell Script Testing

**Objective**: Verify shell scripts work

```bash
# macOS/Linux
./seed.sh
# Expected: Pre-flight checks, then seeding

# Windows (if on Windows)
seed.bat
# Expected: Same behavior as Unix script
```

## Validation Checklist

After running all tests, verify:

- [ ] All 5 tables created successfully
- [ ] Correct number of records in each table
- [ ] JSON fields are properly stored as strings
- [ ] Foreign key relationships work (cascade delete)
- [ ] No orphaned records
- [ ] Original IDs preserved from JSON
- [ ] API endpoints return correct data
- [ ] Error messages are clear and helpful
- [ ] Shell scripts work on target platforms

## Performance Benchmarks

Record these times for reference:

| Operation | Expected Time |
|-----------|--------------|
| Database connection | < 1 second |
| Table creation | < 5 seconds |
| Data seeding (59 records) | < 3 seconds |
| Total execution time | < 15 seconds |

## Common Test Failures

### Issue: "File not found"
**Diagnosis**: Wrong working directory or missing public folder
**Fix**: Run from war-server, verify war-client/public exists

### Issue: "Foreign key constraint fails"
**Diagnosis**: Insertion order problem
**Fix**: Check seedDatabase.js insertion order (should be parent → child)

### Issue: "Unknown column 'tag'"
**Diagnosis**: Trying to insert field that doesn't exist in MySQL
**Fix**: Verify field mappings in seedDatabase.js

### Issue: JSON parse error in MySQL
**Diagnosis**: Invalid JSON string stored
**Fix**: Check JSON.stringify() calls in seed script

### Issue: Zero records inserted
**Diagnosis**: JSON files not found or empty
**Fix**: Verify JSON file paths and contents

## Manual Verification Queries

```sql
-- Complete data summary
SELECT 
  'charities' as table_name, COUNT(*) as count FROM charities
UNION ALL
SELECT 
  'charity_slides', COUNT(*) FROM charity_slides
UNION ALL
SELECT 
  'lesson_playlists', COUNT(*) FROM lesson_playlists
UNION ALL
SELECT 
  'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 
  'warrooms', COUNT(*) FROM warrooms;

-- Expected output:
-- charities: 3
-- charity_slides: 32
-- lesson_playlists: 2
-- lessons: 15
-- warrooms: 7
```

## Clean Up After Testing

```bash
# Drop test database
mysql -u your_username -p -e "DROP DATABASE IF EXISTS war_room_db;"

# Or keep and use for development
# Database is ready to use!
```

## Success Criteria

✅ All tests pass without errors  
✅ Data counts match expected values  
✅ Foreign keys work correctly  
✅ JSON fields are properly formatted  
✅ API can retrieve all seeded data  
✅ Shell scripts execute successfully  
✅ Error handling works as expected  

## Next Steps After Successful Testing

1. ✅ Update main README with seeding instructions
2. ✅ Document any field mapping changes
3. ✅ Set up CI/CD seeding step (optional)
4. ✅ Create backup/restore scripts (optional)
5. ✅ Add data validation rules (optional)

---

**Last Updated**: 2025-11-01  
**Version**: 1.0.0
