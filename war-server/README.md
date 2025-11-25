# War Room Project - Node.js Backend

Express-based backend server for the War Room Community Analytics Platform.

## Features

- Express.js REST API
- MySQL database with connection pooling
- JWT authentication
- Role-based access control (Admin/Member)
- MVC architecture (Model-Route-Controller)
- BCrypt password hashing
- CORS enabled
- **Automatic schema validation and migration**
- **Foreign key relationships with cascade operations**
- **BaseModel class for consistent data handling**

## Project Structure

```
war-server/
├── src/
│   ├── config/              # Configuration files
│   │   └── database.js      # MongoDB connection
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── charityController.js
│   │   ├── lessonController.js
│   │   ├── warroomController.js
│   │   ├── userController.js
│   │   └── analyticsController.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js         # Authentication & authorization
│   ├── models/             # Mongoose models
│   │   ├── User.js
│   │   ├── Charity.js
│   │   ├── Lesson.js
│   │   └── Warroom.js
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── charityRoutes.js
│   │   ├── lessonRoutes.js
│   │   ├── warroomRoutes.js
│   │   ├── userRoutes.js
│   │   └── analyticsRoutes.js
│   ├── scripts/            # Utility scripts
│   │   └── seedDatabase.js
│   └── server.js           # Application entry point
├── public/                 # Static files (tiles, data)
├── .env.example
├── .gitignore
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. Navigate to the war-server directory:
```bash
cd war-server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=war_room_db
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=development
```

### Database Setup

1. Create the database:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS war_room_db;"
```

2. Start the server (tables will be created automatically):
```bash
npm start
```

3. (Optional) Seed the database with sample data:
```bash
npm run seed
```

### Schema Validation and Migration

**New Feature**: Automatic schema validation runs on server startup!

The server will:
- ✅ Create tables if they don't exist
- ✅ Validate table schemas match model definitions
- ✅ Automatically update schemas when changes are detected
- ✅ Add new columns, indexes, and foreign keys as needed

See `MODEL_SCHEMA_VALIDATION.md` for detailed documentation.

**For existing databases with old schema**:
```bash
# Run one-time migration for Lesson playlist foreign key
npm run migrate:playlist

# Test all schemas
npm run test:schema
```

### Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/me` | Get current user | Yes |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/check` | Check admin status | Yes | Yes |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/` | Get all users | Yes | Yes |
| GET | `/:id` | Get user by ID | Yes | Yes |
| PUT | `/:id` | Update user | Yes | Yes |
| DELETE | `/:id` | Delete user | Yes | Yes |

### Charity Routes (`/api/charities`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/` | Get all charities | Yes | No |
| GET | `/:id` | Get charity by ID | Yes | No |
| POST | `/` | Create charity | Yes | Yes |
| PUT | `/:id` | Update charity | Yes | Yes |
| DELETE | `/:id` | Delete charity | Yes | Yes |

### Lesson Routes (`/api/lessons`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/` | Get all lessons | Yes | No |
| GET | `/:id` | Get lesson by ID | Yes | No |
| POST | `/` | Create lesson | Yes | Yes |
| PUT | `/:id` | Update lesson | Yes | Yes |
| DELETE | `/:id` | Delete lesson | Yes | Yes |

### War Room Routes (`/api/warroom`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/` | Get all entries | Yes | No |
| GET | `/:id` | Get entry by ID | Yes | No |
| POST | `/` | Create entry | Yes | Yes |
| PUT | `/:id` | Update entry | Yes | Yes |
| DELETE | `/:id` | Delete entry | Yes | Yes |

### Analytics Routes (`/api/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/tiles/*` | Serve map tiles | Yes |

## Authentication

### JWT Token

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Registration Example

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "60d5ec49f1b2c8b5f8c8e8a1",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "member",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Database Models

All models extend from `BaseModel` which provides automatic schema validation and migration.

### User Model
- id (INT, Primary Key)
- username (VARCHAR, unique)
- email (VARCHAR, unique)
- password (VARCHAR, hashed)
- role (ENUM: 'admin' | 'member')
- firstName (VARCHAR)
- lastName (VARCHAR)
- avatar (VARCHAR, optional)
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)

### Charity Model
- id (INT, Primary Key)
- title (VARCHAR)
- description (TEXT)
- expected_fund (DECIMAL)
- current_fund (DECIMAL)
- img (VARCHAR)
- status (ENUM: 'active' | 'completed' | 'paused')
- isActive (BOOLEAN)
- startDate, endDate (TIMESTAMP)
- createdAt, updatedAt (TIMESTAMP)

### CharitySlide Model
- id (INT, Primary Key)
- charity_id (INT, Foreign Key → charities.id)
- img (VARCHAR)
- description (TEXT)
- display_order (INT)
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)

### LessonPlaylist Model
- id (INT, Primary Key)
- playlist_id (VARCHAR, unique)
- title (VARCHAR)
- description (TEXT)
- thumbnail (VARCHAR)
- authors (JSON)
- size (VARCHAR)
- display_order (INT)
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)

### Lesson Model ⚠️ **Updated with Foreign Key**
- id (INT, Primary Key)
- img (VARCHAR)
- title (VARCHAR)
- description (TEXT)
- videoLink (VARCHAR)
- authors (JSON)
- size (VARCHAR)
- **playlist_id (INT, Foreign Key → lesson_playlists.id)** ⚠️ Changed from VARCHAR
- recommend (BOOLEAN)
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)

**Important**: When creating lessons, use the numeric `id` from `lesson_playlists`, not the string `playlist_id`.

### Warroom Model
- id (INT, Primary Key)
- title (VARCHAR)
- description (TEXT)
- date (TIMESTAMP)
- location (VARCHAR)
- img (VARCHAR, optional)
- videoLink (VARCHAR, optional)
- status (INT: 0=upcoming, 1=live, 2=archived, 3=podcast)
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security

- Passwords are hashed using BCrypt (10 rounds)
- JWT tokens expire after 7 days
- CORS enabled for frontend communication
- Role-based access control for admin endpoints
- Input validation on all endpoints

## Development

### Running with Nodemon

```bash
npm run dev
```

Nodemon will automatically restart the server when files change.

### Database Seeding

```bash
npm run seed
```

This will populate the database with sample data for development.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/warroom |
| JWT_SECRET | Secret key for JWT | (required) |
| NODE_ENV | Environment mode | development |

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB with authentication
4. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name war-server
pm2 save
pm2 startup
```

## License

Proprietary - War Room Project
