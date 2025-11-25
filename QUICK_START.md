# War Room Project - Quick Start Guide

Get the War Room project up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (need v16+)
node --version

# Check npm
npm --version

# Check MongoDB (need v4.4+)
mongod --version

# Start MongoDB if not running
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Windows:
net start MongoDB
```

## Setup Instructions

### 1. Backend Setup (2 minutes)

```bash
# Navigate to backend folder
cd war-server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env (use nano, vim, or your editor)
nano .env
```

**Update these values in .env:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/warroom
JWT_SECRET=change_this_to_a_random_secure_string
NODE_ENV=development
```

**Start the backend:**
```bash
npm run dev
```

✅ Backend running at: http://localhost:5000

Test it:
```bash
curl http://localhost:5000/api/health
```

You should see: `{"status":"ok","message":"War Room Server is running"}`

### 2. Frontend Setup (2 minutes)

**Open a NEW terminal window:**

```bash
# Navigate to frontend folder
cd war-front

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env
nano .env
```

**Update these values in .env:**
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_MAPTILER_API_KEY=kbhBumUPT9d635Evqvfh
```

**Start the frontend:**
```bash
npm start
```

✅ Frontend running at: http://localhost:3000

Your browser should automatically open!

### 3. Create First User (1 minute)

**Option A: Using curl**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@warroom.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Option B: Using the UI**
1. Go to http://localhost:3000/signup
2. Fill in the form
3. Click Register

**To make user an admin, update MongoDB directly:**
```bash
mongosh warroom
db.users.updateOne({email: "admin@warroom.com"}, {$set: {role: "admin"}})
```

## Testing the Setup

### Test Backend API

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Copy the token from the response
TOKEN="paste_token_here"

# Test protected route
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/me
```

### Test Frontend

1. **Home Page**: http://localhost:3000
2. **Sign Up**: http://localhost:3000/signup
3. **Sign In**: http://localhost:3000/signin
4. **Analytics** (after login): http://localhost:3000/analytics

## Common Issues & Solutions

### Issue: MongoDB connection error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
```bash
# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
net start MongoDB                     # Windows

# Check if running
mongosh
```

### Issue: Port already in use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows (then kill the PID)

# Or change port in war-server/.env
PORT=5001
```

### Issue: React app won't start

**Error**: `Cannot find module 'react-scripts'`

**Solution**:
```bash
cd war-front
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: API calls failing (CORS)

**Error**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution**: Already handled in backend! Make sure:
1. Backend is running
2. Frontend `.env` has correct API URL
3. Restart both servers

## Project Structure Overview

```
war_room-project/
├── war-front/          ← React frontend (port 3000)
│   ├── src/
│   │   ├── api/       ← API calls
│   │   ├── components/ ← React components
│   │   ├── pages/     ← Page components
│   │   └── styles/    ← SCSS files
│   └── package.json
│
├── war-server/        ← Node.js backend (port 5000)
│   ├── src/
│   │   ├── controllers/ ← Business logic
│   │   ├── models/     ← Database models
│   │   ├── routes/     ← API routes
│   │   └── server.js   ← Entry point
│   └── package.json
│
└── war-client/        ← Old Next.js app (reference only)
```

## Development Workflow

### Starting Development

```bash
# Terminal 1: Backend
cd war-server && npm run dev

# Terminal 2: Frontend  
cd war-front && npm start
```

### Making Changes

**Frontend changes**: Auto-reload (React Fast Refresh)
**Backend changes**: Auto-reload (nodemon)

### Adding New Components

Use the established pattern:

```
war-front/src/components/MyComponent/
├── MyComponent.jsx           # Presentation
├── MyComponent.module.scss   # Styles
├── useMyComponent.js         # State hook
└── MyComponentHandler.js     # Logic
```

## Next Steps

1. ✅ **Backend running**
2. ✅ **Frontend running**  
3. ✅ **Can create users**
4. ✅ **Can login**
5. ✅ **Can access analytics map**

Now you can:
- Explore the analytics map at `/analytics`
- Build out other pages (charities, lessons, etc.)
- Add more features following the existing patterns
- Read the full documentation in README files

## Useful Commands

```bash
# Backend
npm run dev         # Start with auto-reload
npm start          # Start production mode
npm run seed       # Seed database (when available)

# Frontend
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests

# MongoDB
mongosh warroom                    # Open MongoDB shell
db.users.find().pretty()          # View users
db.charities.find().pretty()      # View charities
```

## Getting Help

1. Check `README.md` in war-front or war-server
2. Review `MIGRATION_SUMMARY.md` for architecture details
3. Look at existing components for patterns
4. Check browser console for frontend errors
5. Check terminal for backend errors

## Production Deployment

When ready to deploy:

1. **Frontend**: `npm run build` → Deploy `build/` folder
2. **Backend**: Use PM2 or similar process manager
3. **Database**: Use MongoDB Atlas or hosted solution
4. **Environment**: Update all URLs to production values

---

**Happy Coding! 🚀**

If you encounter issues, check the detailed README files in each folder.
