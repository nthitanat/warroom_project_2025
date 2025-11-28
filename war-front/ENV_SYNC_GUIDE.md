# Environment Variable Synchronization Guide

## Overview

This React application uses a **centralized `.env` file** located at the project root (`../env`). The `sync-env.js` script automatically synchronizes the appropriate environment variables to `war-front/.env` before running or building the app.

## How It Works

### 1. Centralized Configuration

All environment variables are defined in the **root `.env` file**:

```bash
# Root .env structure
DEPLOYMENT_MODE=development  # or 'production'

# Development variables (DEV_ prefix)
DEV_REACT_APP_API_BASE_URL=http://localhost:4000/api
DEV_REACT_APP_ENABLE_API_LOGGING=true

# Production variables (PROD_ prefix)
PROD_REACT_APP_API_BASE_URL=https://engagement.chula.ac.th/war-room-api/api
PROD_REACT_APP_ENABLE_API_LOGGING=false

# Shared variables (no prefix)
REACT_APP_MAPTILER_API_KEY=your_key_here
PORT=4000          # API server port
CLIENT_PORT=4001   # React dev server port
```

### 2. Automatic Synchronization

The `sync-env.js` script runs automatically:
- **Before `npm start`** (via `prestart` script in package.json)
- **Before `npm run build`** (via `prebuild` script in package.json)

You can also run it manually:
```bash
npm run sync-env
```

### 3. What Gets Synced

The script extracts and maps variables based on `DEPLOYMENT_MODE`:

| Root .env Variable | Mode | Generated .env Variable | Value |
|-------------------|------|------------------------|--------|
| `DEV_REACT_APP_API_BASE_URL` | development | `REACT_APP_API_BASE_URL` | `http://localhost:4000/api` |
| `PROD_REACT_APP_API_BASE_URL` | production | `REACT_APP_API_BASE_URL` | `https://engagement.chula.ac.th/war-room-api/api` |
| `REACT_APP_MAPTILER_API_KEY` | both | `REACT_APP_MAPTILER_API_KEY` | `your_key_here` |
| `CLIENT_PORT` | both | `PORT` | `4001` (React dev server) |
| `PORT` | both | `REACT_APP_API_PORT` | `4000` (API server reference) |

### 4. Generated .env File

After running `sync-env.js`, the `war-front/.env` file looks like:

```bash
# ============================================
# Auto-generated from root .env file
# DO NOT EDIT - Changes will be overwritten
# ============================================
# Generated at: 2025-11-28T14:49:19.935Z
# Deployment Mode: development

REACT_APP_API_BASE_URL=http://localhost:4000/api
REACT_APP_ENABLE_API_LOGGING=true
REACT_APP_MAPTILER_API_KEY=kbhBumUPT9d635Evqvfh
PORT=4001
REACT_APP_API_PORT=4000
```

## Usage

### Development

Simply run:
```bash
npm start
```

The script will:
1. Read `DEPLOYMENT_MODE` from root `.env` (should be `development`)
2. Extract `DEV_REACT_APP_*` variables and remove the `DEV_` prefix
3. Add shared `REACT_APP_*` variables
4. Set `PORT=4001` from `CLIENT_PORT`
5. Generate `war-front/.env`
6. Start the React dev server on port 4001

### Production Build

```bash
npm run build
```

If `DEPLOYMENT_MODE=production` in root `.env`, it will:
1. Extract `PROD_REACT_APP_*` variables and remove the `PROD_` prefix
2. Add shared `REACT_APP_*` variables
3. Set `PORT=4001` from `CLIENT_PORT`
4. Generate `war-front/.env`
5. Build the React app for production

### Switching Environments

Edit the root `.env` file:
```bash
# Change this line
DEPLOYMENT_MODE=production  # or 'development'
```

Then run:
```bash
npm run sync-env
npm start
```

## Port Configuration

The React app will run on the port specified by `CLIENT_PORT` in the root `.env`:

- **Dev Server Port**: Uses `CLIENT_PORT` (default: 4001)
- **API Server Port**: References `PORT` (default: 4000) for API calls

When running locally without Docker:
- React app: http://localhost:4001
- API server: http://localhost:4000

The `REACT_APP_API_BASE_URL` is automatically constructed using the `PORT` value.

## Important Notes

### ⚠️ Never Edit war-front/.env Manually

The `war-front/.env` file is **auto-generated** and will be overwritten. Always edit the root `.env` file instead.

### ✅ Git Ignore

The `war-front/.env` file is already in `.gitignore` and should never be committed.

### 🔄 When to Sync

The sync happens automatically, but you may want to manually sync if:
- You change the root `.env` file while the dev server is running
- You want to verify the generated values
- You're troubleshooting environment issues

Just run:
```bash
npm run sync-env
```

### 🐳 Docker vs Non-Docker

- **With Docker**: The root `.env` is mounted directly into containers
- **Without Docker**: The `sync-env.js` script generates `war-front/.env` from root

Both methods use the same centralized configuration source.

## Troubleshooting

### Issue: Wrong API URL

**Solution**: Check `DEPLOYMENT_MODE` in root `.env` and verify the correct `DEV_REACT_APP_API_BASE_URL` or `PROD_REACT_APP_API_BASE_URL` is set.

### Issue: Port conflict

**Solution**: Change `CLIENT_PORT` in root `.env` and run `npm run sync-env`.

### Issue: Missing variables

**Solution**: Ensure variables are prefixed correctly in root `.env`:
- Development: `DEV_REACT_APP_*`
- Production: `PROD_REACT_APP_*`
- Shared: `REACT_APP_*` (no prefix)

### Issue: Changes not reflecting

**Solution**: Stop the dev server, run `npm run sync-env`, then `npm start` again.

## Script Details

The `sync-env.js` script:
1. Reads `../env` (project root)
2. Parses key=value pairs
3. Determines deployment mode
4. Extracts environment-specific variables
5. Maps prefixed variables to standard React names
6. Adds port configuration
7. Writes to `war-front/.env`
8. Logs what was synced

This ensures a single source of truth for all environment configuration across development, Docker, and production deployments.
