# MySQL Database Migration Guide

## Overview
The War Room Server has been migrated from MongoDB to MySQL for better relational data management and compatibility with existing infrastructure.

## Database Configuration

### Environment Variables
Update your `.env` file with MySQL credentials:

```env
# MySQL Database Configuration
DB_HOST_DEV=localhost
DB_PORT_DEV=3306
DB_USER_DEV=your_mysql_username
DB_PASSWORD_DEV=your_mysql_password
DB_NAME=war_room_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Installation

### 1. Install Dependencies
```bash
cd war-server
npm install
```

The package now uses `mysql2` instead of `mongoose`.

### 2. Ensure MySQL is Running
Make sure MySQL server is running on your system:

```bash
# macOS (if using Homebrew)
brew services start mysql

# Linux
sudo systemctl start mysql

# Check status
mysql -u root -p
```

### 3. Database Auto-Creation
The application will automatically:
- ✅ Create the database if it doesn't exist
- ✅ Create all required tables
- ✅ Set up proper indexes and foreign keys

No manual SQL scripts needed!

## Database Schema

### Tables Created Automatically

#### 1. `users`
- User authentication and profile data
- Fields: id, username, email, password, role, firstName, lastName, avatar, isActive
- Indexes: email, username, role

#### 2. `charities`
- Charity campaigns and fundraising
- Fields: id, title, description, expected_fund, current_fund, img, status, startDate, endDate
- Indexes: status, isActive

#### 3. `lessons`
- Educational content and videos
- Fields: id, img, title, description, videoLink, authors (JSON), size, playlist_id, recommend
- Indexes: playlist_id, recommend, isActive

#### 4. `warrooms`
- War room sessions and events
- Fields: id, title, description, date, location, img, videoLink, status
- Indexes: status, date, isActive

#### 5. `charity_slides`
- Image carousel for charity campaigns
- Fields: id, charity_id, img, description, display_order
- Foreign Key: charity_id → charities(id)

#### 6. `lesson_playlists`
- Lesson playlist categories
- Fields: id, playlist_id, title, description, thumbnail, display_order
- Index: playlist_id (unique)

## Model API Usage

### User Model
```javascript
const User = require('./models/User');

// Find by email
const user = await User.findByEmail('user@example.com');

// Find by username
const user = await User.findByUsername('johndoe');

// Create user
const newUser = await User.create({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'hashedPassword',
  firstName: 'John',
  lastName: 'Doe'
});

// Update user
const updated = await User.update(userId, { firstName: 'Jane' });

// Find all users
const users = await User.findAll({ role: 'admin' });

// Delete user
await User.delete(userId);
```

### Charity Model
```javascript
const Charity = require('./models/Charity');

// Find by ID
const charity = await Charity.findById(charityId);

// Create charity
const newCharity = await Charity.create({
  title: 'Help Flood Victims',
  description: 'Emergency relief fund',
  expected_fund: 100000,
  current_fund: 0,
  img: '/path/to/image.jpg'
});

// Update fund
await Charity.updateFund(charityId, 1000); // Add 1000 to current_fund

// Find all active charities
const charities = await Charity.findAll({ status: 'active' });
```

### Lesson Model
```javascript
const Lesson = require('./models/Lesson');

// Create lesson
const lesson = await Lesson.create({
  img: '/path/to/thumbnail.jpg',
  title: 'Disaster Management 101',
  description: 'Learn the basics',
  videoLink: 'https://youtube.com/watch?v=...',
  authors: ['Dr. Smith', 'Prof. Johnson'],
  size: 'large',
  playlist_id: 'disaster-basics',
  recommend: true
});

// Find recommended lessons
const recommended = await Lesson.findRecommended();

// Find by playlist
const playlistLessons = await Lesson.findByPlaylist('disaster-basics');
```

### Warroom Model
```javascript
const Warroom = require('./models/Warroom');

// Create warroom
const warroom = await Warroom.create({
  title: 'Emergency Response Meeting',
  description: 'Discuss flood response',
  date: new Date(),
  location: 'Bangkok',
  img: '/path/to/image.jpg',
  videoLink: 'https://...',
  status: 1 // 0=upcoming, 1=live, 2=archived, 3=podcast
});

// Find by status
const upcoming = await Warroom.findUpcoming(); // status = 0
const live = await Warroom.findLive(); // status = 1
const archived = await Warroom.findArchived(); // status = 2
const podcasts = await Warroom.findPodcasts(); // status = 3
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Expected Output
```
🔧 Initializing database tables...

✓ Database 'war_room_db' is ready
✓ MySQL Connected: localhost:3306
✓ Table 'users' is ready
✓ Table 'charities' is ready
✓ Table 'lessons' is ready
✓ Table 'warrooms' is ready
✓ Table 'charity_slides' is ready
✓ Table 'lesson_playlists' is ready

✅ All database tables initialized successfully!

✅ Server initialization complete

🚀 War Room Server is running!
📍 Port: 5000
🌍 Environment: development
💾 Database: war_room_db

✨ Ready to accept requests
```

## Database Migrations

### Manual Table Creation (if needed)
If automatic table creation fails, you can manually create tables:

```sql
-- Connect to MySQL
mysql -u your_username -p

-- Create database
CREATE DATABASE IF NOT EXISTS war_room_db;
USE war_room_db;

-- Then restart the server to auto-create tables
```

### Reset Database
To reset all data (⚠️ **WARNING: This deletes all data**):

```sql
DROP DATABASE war_room_db;
-- Restart server to recreate
```

## Connection Pooling

The application uses MySQL connection pooling for better performance:
- **Pool Size**: 10 connections
- **Auto-reconnect**: Enabled
- **Keep-alive**: Enabled

## Common Issues

### Issue: "Access denied for user"
**Solution**: Check MySQL credentials in `.env` file

### Issue: "Can't connect to MySQL server"
**Solution**: Ensure MySQL is running: `brew services start mysql`

### Issue: "Table doesn't exist"
**Solution**: Restart server to trigger auto-creation

### Issue: "Unknown database 'war_room_db'"
**Solution**: Server will auto-create it on startup

## Migration from MongoDB

If migrating existing data from MongoDB:

1. Export MongoDB data to JSON
2. Transform JSON format to match MySQL schema
3. Import using provided seed script (create one if needed)
4. Verify data integrity

## Performance Tips

1. **Indexes**: All foreign keys and frequently queried fields are indexed
2. **Connection Pooling**: Reuses connections efficiently
3. **JSON Fields**: Authors field uses MySQL JSON type for better performance
4. **Timestamps**: Automatic created_at and updated_at tracking

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days (configurable)
- SQL injection protection via parameterized queries
- Role-based access control (admin/member)

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify MySQL server is running
3. Confirm environment variables are set correctly
4. Check file permissions on `.env` file
