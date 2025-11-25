# Frontend Environment Variables - How It Works

## Overview

The war-front React application uses environment variables from the **centralized `.env` file** at the project root. These variables are injected during the Docker build process.

## How Environment Variables Are Injected

### 1. Centralized .env File
Located at: `warroom_project_2025/.env`

Contains:
```bash
# Development
DEV_REACT_APP_API_BASE_URL=http://localhost:4000/api
DEV_REACT_APP_ENABLE_API_LOGGING=true

# Production
PROD_REACT_APP_API_BASE_URL=https://engagement.chula.ac.th/war-room-api
PROD_REACT_APP_ENABLE_API_LOGGING=false
```

### 2. Docker Compose Configuration
`docker-compose.yml` passes build arguments:
```yaml
war-front:
  build:
    args:
      REACT_APP_API_BASE_URL: ${DEV_REACT_APP_API_BASE_URL}
      REACT_APP_ENABLE_API_LOGGING: ${DEV_REACT_APP_ENABLE_API_LOGGING}
```

`docker-compose.prod.yml` overrides for production:
```yaml
war-front:
  build:
    args:
      REACT_APP_API_BASE_URL: ${PROD_REACT_APP_API_BASE_URL}
      REACT_APP_ENABLE_API_LOGGING: ${PROD_REACT_APP_ENABLE_API_LOGGING}
```

### 3. Dockerfile Build Process
`war-front/Dockerfile`:
```dockerfile
# Build arguments
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_ENABLE_API_LOGGING

# Set as environment variables for build
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV REACT_APP_ENABLE_API_LOGGING=${REACT_APP_ENABLE_API_LOGGING}

# Build with these variables embedded
RUN npm run build
```

### 4. React Application Usage
`war-front/src/api/axiosInstance.js`:
```javascript
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api',
  // ...
});
```

## Build Flow

### Development Build
```bash
docker-compose up -d --build
```
1. Reads `.env` from project root
2. Uses `DEV_REACT_APP_*` variables
3. Passes to Dockerfile as build args
4. React build embeds these values
5. Static files served with development API URL

### Production Build
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
1. Reads `.env` from project root
2. Uses `PROD_REACT_APP_*` variables (via override)
3. Passes to Dockerfile as build args
4. React build embeds these values
5. Static files served with production API URL

### Remote Deployment
The `remote-deploy.sh` script:
1. Uploads `.env` to remote server
2. Automatically uses production override
3. Builds with production variables
4. Deploys to `/www/wwwroot/engagement.chula.ac.th/war-room`

## Important Notes

### ✅ What Works
- **Single source of truth**: One `.env` file at project root
- **Build-time injection**: Variables embedded during Docker build
- **Environment separation**: DEV_ and PROD_ prefixes
- **No runtime switching**: Built files are static (security benefit)

### ❌ What Doesn't Work
- **Runtime environment variables**: Can't change API URL after build
- **Browser environment variables**: Only REACT_APP_* prefix works
- **Subdirectory .env files**: Not used, not needed

### 🔒 Security
- Environment variables are **embedded at build time**
- Values are visible in the browser (use for URLs, not secrets)
- Never put sensitive tokens/keys in REACT_APP_* variables

## Fallback Values

If environment variables are not set, axiosInstance uses:
```javascript
baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api'
```

This ensures the app still works during local development without Docker.

## Troubleshooting

### Variables not updating?
```bash
# Rebuild without cache
docker-compose build --no-cache war-front
docker-compose up -d
```

### Check what variables were used:
```bash
# View build args in docker-compose
docker-compose config

# For production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml config
```

### Verify in browser:
```javascript
// Open browser console
console.log(process.env.REACT_APP_API_BASE_URL)
```

### Check built files:
```bash
# After build, check static files (variables are embedded)
docker exec warroom-frontend cat /usr/share/nginx/html/static/js/main.*.js | grep -o 'http[^"]*4000'
```

## Development Without Docker

For local development without Docker:

1. **Create `.env` in war-front directory** (gitignored):
```bash
cd war-front
echo "REACT_APP_API_BASE_URL=http://localhost:4000/api" > .env
```

2. **Start React dev server**:
```bash
npm start
```

The React dev server will load `.env` from the local directory.

**Note**: For consistency, always use Docker for development when possible.
