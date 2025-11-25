# 📊 Database Seeding - Quick Reference

Clone data from `war-client/public` folder and bulk insert into MySQL database.

## 🚀 Quick Start

### macOS/Linux
```bash
cd war-server
./seed.sh
```

### Windows
```cmd
cd war-server
seed.bat
```

### Using npm directly
```bash
cd war-server
npm run seed
```

## 📁 What Gets Seeded

| Data Source | Target Table | Count |
|------------|--------------|-------|
| `charities/charitiesData.json` | `charities` | 3 records |
| `charities/charitySlideData.json` | `charity_slides` | 32 records |
| `lesson/lessonPlaylistData.json` | `lesson_playlists` | 2 records |
| `lesson/lessonData.json` | `lessons` | 15 records |
| `warroom/warroomData.json` | `warrooms` | 7 records |

## ⚠️ Important Field Differences

### Lesson Size Field
- **JSON**: `{xs: 12, md: 3}` (object)
- **MySQL**: `'{"xs":12,"md":3}'` (JSON string)

### Playlist ID vs Thumbnail
- **JSON**: `id`, `img` fields
- **MySQL**: `playlist_id`, `thumbnail` fields

### Warroom Status
- `0` = Upcoming
- `1` = Live
- `2` = Archived
- `3` = Podcast

### Fields NOT Stored
- Warroom `tag` field → **ignored**
- Warroom `authors` field → **ignored**

## 📋 Prerequisites

1. **MySQL Running**
   ```bash
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

2. **Environment Variables** (`.env` file)
   ```env
   DB_HOST_DEV=localhost
   DB_PORT_DEV=3306
   DB_USER_DEV=your_username
   DB_PASSWORD_DEV=your_password
   DB_NAME=war_room_db
   ```

3. **Dependencies Installed**
   ```bash
   npm install
   ```

## 🔧 Manual Seeding Steps

```bash
# 1. Navigate to war-server
cd war-server

# 2. Ensure dependencies are installed
npm install

# 3. Check your .env file
cat .env

# 4. Run the seed script
npm run seed
```

## 📊 Insertion Order

The script inserts data in this order to respect foreign key constraints:

1. **Charities** ← Parent table
2. **Charity Slides** ← References charities
3. **Lesson Playlists** ← Parent table
4. **Lessons** ← References playlists
5. **Warrooms** ← Independent table

## ✅ Success Indicators

You should see:
```
✓ Charities: 3 inserted, 0 failed
✓ Charity Slides: 32 inserted, 0 failed
✓ Lesson Playlists: 2 inserted, 0 failed
✓ Lessons: 15 inserted, 0 failed
✓ Warrooms: 7 inserted, 0 failed
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "File not found" | Run from `war-server` directory |
| "Can't connect to MySQL" | Check if MySQL is running |
| "Access denied" | Verify `.env` credentials |
| "Foreign key constraint fails" | Script handles this automatically |
| "Unknown column" | Field name mismatch - see SEEDING_GUIDE.md |

## 📚 Documentation

- **Detailed Guide**: See [SEEDING_GUIDE.md](./SEEDING_GUIDE.md)
- **MySQL Setup**: See [MYSQL_SETUP.md](./MYSQL_SETUP.md)
- **API Documentation**: See [README.md](./README.md)

## 🔒 Safety Features

- ⏱️ **3-second countdown** before deleting data
- 🔄 **Foreign key handling** with automatic disable/enable
- 📝 **Detailed logging** of all operations
- ❌ **Ctrl+C cancellation** support

## 💡 Pro Tips

1. **Backup before seeding** in production
2. **Test in development** first
3. **Review JSON files** for data accuracy
4. **Check console output** for any failures
5. **Verify data** after seeding

## 🔗 Related Commands

```bash
# Start the server
npm start

# Development mode with auto-reload
npm run dev

# Seed the database
npm run seed

# Check MySQL connection
mysql -u your_username -p war_room_db
```

## 📞 Support

If issues persist:
1. Check console error messages
2. Review [SEEDING_GUIDE.md](./SEEDING_GUIDE.md)
3. Verify JSON file formats
4. Check database permissions
5. Ensure foreign keys are enabled

---

**Last Updated**: 2025-11-01  
**Version**: 1.0.0
