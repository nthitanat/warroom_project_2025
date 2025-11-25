# Database Seeding Script

This script clones data from the `war-client/public` folder and bulk inserts it into the MySQL database in `war-server`.

## Features

✅ **Automatic Data Cloning**: Reads JSON files from public folder  
✅ **Bulk Insert**: Efficiently inserts all data at once  
✅ **Field Name Mapping**: Handles differences between JSON and MySQL schemas  
✅ **Foreign Key Support**: Respects table relationships  
✅ **ID Preservation**: Maintains original IDs from JSON files  
✅ **Error Handling**: Detailed logging of success/failures  

## Data Sources

The script reads from these JSON files in `war-client/public`:

```
war-client/public/
  ├── charities/
  │   ├── charitiesData.json         → charities table
  │   └── charitySlideData.json      → charity_slides table
  ├── lesson/
  │   ├── lessonData.json            → lessons table
  │   └── lessonPlaylistData.json    → lesson_playlists table
  └── warroom/
      └── warroomData.json           → warrooms table
```

## Important Field Mappings

### Charities
| JSON Field | MySQL Field | Notes |
|------------|-------------|-------|
| `id` | `id` | Preserved |
| `title` | `title` | ✓ |
| `description` | `description` | ✓ |
| `expected_fund` | `expected_fund` | ✓ |
| `current_fund` | `current_fund` | Default: 0 |
| `img` | `img` | ✓ |
| - | `status` | Default: 'active' |
| - | `startDate` | Default: NOW() |
| - | `endDate` | Default: NULL |

### Charity Slides
| JSON Field | MySQL Field | Notes |
|------------|-------------|-------|
| `id` | `id` | Preserved |
| `charity_id` | `charity_id` | Foreign key |
| `img` | `img` | ✓ |
| `description` | `description` | ✓ |
| `id` | `display_order` | Uses id as order |

### Lessons
| JSON Field | MySQL Field | Notes |
|------------|-------------|-------|
| `img` | `img` | ✓ |
| `title` | `title` | ✓ |
| `description` | `description` | ✓ |
| `videoLink` | `videoLink` | ✓ |
| `authors` (array) | `authors` | Stored as JSON |
| `size` (object) | `size` | **Converted to JSON string** |
| `playlist_id` | `playlist_id` | ✓ |
| `recommend` | `recommend` | Boolean |

**⚠️ IMPORTANT**: The `size` field in JSON is an object like `{xs: 12, md: 3}`. In MySQL, it's stored as a JSON string.

### Lesson Playlists
| JSON Field | MySQL Field | Notes |
|------------|-------------|-------|
| `id` | `playlist_id` | **Field name differs** |
| `title` | `title` | ✓ |
| `description` | `description` | ✓ |
| `img` | `thumbnail` | **Field name differs** |
| `authors` | `authors` | Stored as JSON |
| `size` | `size` | Stored as JSON |

### Warrooms
| JSON Field | MySQL Field | Notes |
|------------|-------------|-------|
| `title` | `title` | ✓ |
| `description` | `description` | ✓ |
| - | `date` | Default: NOW() |
| - | `location` | Default: 'TBD' |
| `img` | `img` | ✓ |
| `videoLink` | `videoLink` | ✓ |
| `status` | `status` | 0=upcoming, 1=live, 2=archived, 3=podcast |
| `tag` | - | **⚠️ NOT STORED (ignored)** |
| `authors` | - | **⚠️ NOT STORED (ignored)** |

**⚠️ IMPORTANT**: The `tag` and `authors` fields from JSON are NOT in the MySQL schema and will be ignored.

## Prerequisites

1. **MySQL Running**: Ensure MySQL server is running
2. **Environment Variables**: Set up your `.env` file:
   ```env
   DB_HOST_DEV=localhost
   DB_PORT_DEV=3306
   DB_USER_DEV=your_username
   DB_PASSWORD_DEV=your_password
   DB_NAME=war_room_db
   ```
3. **Dependencies Installed**: Run `npm install` in war-server

## Usage

### Option 1: Using npm script (Recommended)
```bash
cd war-server
npm run seed
```

### Option 2: Direct execution
```bash
cd war-server
node src/scripts/seedDatabase.js
```

### Option 3: Using module
```javascript
const { seedDatabase } = require('./src/scripts/seedDatabase');
await seedDatabase();
```

## What Happens During Seeding

1. **Connection**: Connects to MySQL database
2. **Table Creation**: Ensures all tables exist
3. **Warning**: 3-second countdown before clearing data
4. **Clear Data**: Truncates all tables (with foreign key checks disabled)
5. **Insert Order** (respects foreign keys):
   - Charities
   - Charity Slides (depends on charities)
   - Lesson Playlists
   - Lessons (depends on playlists)
   - Warrooms
6. **Summary**: Shows success/failure counts

## Example Output

```
╔════════════════════════════════════════════════════════╗
║      WAR ROOM DATABASE SEEDING SCRIPT                  ║
║      Cloning data from public folder to MySQL          ║
╚════════════════════════════════════════════════════════╝

🔌 Connecting to database...
✓ Database 'war_room_db' is ready
✓ MySQL Connected: localhost:3306

🔧 Ensuring tables exist...
✓ Table 'charities' is ready
✓ Table 'charity_slides' is ready
✓ Table 'lesson_playlists' is ready
✓ Table 'lessons' is ready
✓ Table 'warrooms' is ready

⚠️  WARNING: This will DELETE all existing data!
Press Ctrl+C to cancel, or wait 3 seconds to continue...

🗑️  Clearing existing data...
✓ Database cleared

📊 Seeding Charities...
  ✓ Charity 1: จุฬา ร่วมฝ่าภัยพิบัติไปด้วยกัน
  ✓ Charity 2: จุฬา ร่วมฝ่าภัยพิบัติน่าน
  ✓ Charity 3: เครือข่ายจุฬาฝ่าพิบัติ ร่วมกับโครงการฟื้นป่าน่าน
✓ Charities: 3 inserted, 0 failed

🖼️  Seeding Charity Slides...
  ✓ Slide 1 for charity 1
  ✓ Slide 2 for charity 1
  ... (32 slides total)
✓ Charity Slides: 32 inserted, 0 failed

📚 Seeding Lesson Playlists...
  ✓ Playlist 1: ความร่วมมือเครื่อข่าย DSN
  ✓ Playlist 2: DSN ถอดบทเรียน
✓ Lesson Playlists: 2 inserted, 0 failed

🎓 Seeding Lessons...
  ✓ Lesson: คู่มือ Digital WarRoom
  ✓ Lesson: Warroom - Roblox Family Co-Creation
  ... (15 lessons total)
✓ Lessons: 15 inserted, 0 failed

🏛️  Seeding Warrooms...
  ✓ Warroom: ห้วยหินลาดใน 7 นาที
  ✓ Warroom: จุดเกิดเหตุที่แม่สาย
  ... (7 warrooms total)
✓ Warrooms: 7 inserted, 0 failed

╔════════════════════════════════════════════════════════╗
║      ✅ DATABASE SEEDING COMPLETED SUCCESSFULLY        ║
╚════════════════════════════════════════════════════════╝

📊 Summary:
  • Charities and their slides seeded
  • Lesson playlists and lessons seeded
  • Warrooms seeded

Note: Field name differences were handled:
  • Lesson 'size' object → JSON string in MySQL
  • Warroom 'tag' field ignored (not in MySQL schema)
  • Authors array → JSON string in MySQL
```

## Safety Features

⚠️ **3-Second Warning**: The script gives you 3 seconds to cancel (Ctrl+C) before deleting data

🔒 **Transaction Safety**: Uses proper foreign key handling

📝 **Detailed Logging**: Shows exactly what succeeded and what failed

## Troubleshooting

### Issue: "File not found"
**Solution**: Make sure you're running from `war-server` directory and `war-client/public` folder exists

### Issue: "Foreign key constraint fails"
**Solution**: The script handles this automatically by inserting in correct order

### Issue: "Duplicate entry"
**Solution**: The script clears all data first. If still occurs, check for unique constraints

### Issue: "Unknown column"
**Solution**: Field name mismatch. Check the field mapping tables above

### Issue: JSON parse error
**Solution**: Verify JSON files are valid. Use a JSON validator

## Customization

### Skip Clearing Data
Comment out the `await clearDatabase();` line if you want to append data instead of replacing

### Preserve Certain Data
Modify the `clearDatabase()` function to skip certain tables

### Add New Data Sources
1. Add a new `seed[DataType]()` function
2. Call it in the `seedDatabase()` main function
3. Handle field mappings appropriately

## Best Practices

1. **Backup First**: Always backup your database before seeding
2. **Test Environment**: Test in development before production
3. **Verify Data**: Check the JSON files are up-to-date
4. **Review Output**: Check the console for any failed insertions
5. **Foreign Keys**: Respect the insertion order (parent before child)

## Related Files

- `src/models/Charity.js` - Charity model
- `src/models/CharitySlide.js` - Charity slide model
- `src/models/Lesson.js` - Lesson model
- `src/models/LessonPlaylist.js` - Lesson playlist model
- `src/models/Warroom.js` - Warroom model
- `src/config/database.js` - Database connection
- `MYSQL_SETUP.md` - MySQL setup guide

## Support

For issues or questions:
1. Check console output for detailed error messages
2. Verify JSON file paths and formats
3. Check database connection settings
4. Review field mapping tables above
