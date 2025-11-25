# Centralized Environment Configuration - Summary

## What Changed?

### ✅ Centralized .env File
- **Single `.env` file** at project root (no subdirectory .env files needed)
- Uses `DEV_*` and `PROD_*` prefixes for environment-specific values
- Automatically injected into both server and client containers

### ✅ Files Created/Modified

1. **`.env.template`** - Updated with example values from reference
   - Added proper VPN credentials structure
   - Added remote server configuration
   - Includes GitHub token placeholder

2. **`docker-compose.yml`** - Modified to use centralized .env
   - Added `env_file: .env` directive
   - Uses `DEV_*` variables by default
   - Properly injects into both services

3. **`docker-compose.prod.yml`** - NEW production override file
   - Overrides with `PROD_*` variables
   - Used automatically during remote deployment

4. **`remote-deploy.sh`** - Updated deployment script
   - Uses `-f docker-compose.yml -f docker-compose.prod.yml` for all operations
   - Uploads `.env` file to remote server (already implemented)
   - Forces production mode on remote

5. **`.gitignore`** - Updated
   - Ignores `.env` (sensitive data)
   - Allows `.env.template` (safe to commit)

6. **Documentation**
   - `DOCKER_DEPLOYMENT.md` - Updated with centralized .env info
   - `ENV_REFERENCE.md` - NEW quick reference guide

## How to Use

### Local Development
```bash
# Create your .env from template
cp .env.template .env

# Edit with your values
vim .env

# Start with development config (uses DEV_* variables)
docker-compose up -d
```

### Production Deployment
```bash
# The deployment script handles everything automatically
./remote-deploy.sh

# It will:
# 1. Upload your .env to remote server
# 2. Use production overrides (PROD_* variables)
# 3. Build and deploy both services
```

## Key Benefits

1. ✅ **Single Source of Truth** - One .env file for everything
2. ✅ **No Duplication** - No need to maintain multiple .env files
3. ✅ **Auto-Sync** - Deployment script uploads .env automatically
4. ✅ **Environment Separation** - Clear DEV/PROD separation
5. ✅ **Docker Native** - Uses docker-compose override pattern
6. ✅ **Secure** - .env never committed to Git

## Migration from Old Setup

If you had separate `.env` files in subdirectories:

```bash
# Remove old .env files
rm war-server/.env
rm war-front/.env

# Use centralized .env at root
cp .env.template .env
# Fill in your values
```

## Testing

### Test Local Development
```bash
docker-compose up -d
docker-compose ps
```

### Test Production Config Locally
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

## Troubleshooting

### Variables Not Loading?
```bash
# Check if .env exists
ls -la .env

# View what docker-compose sees
docker-compose config

# View production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml config
```

### Remote Deployment Issues?
The script automatically:
- Uploads `.env` to `/tmp/.env.warroom`
- Moves it to `$DEPLOY_PATH/.env`
- Forces `DEPLOYMENT_MODE=production`

Check remote server:
```bash
ssh user@remote
cat /www/warroom-deploy/.env | grep DEPLOYMENT_MODE
```

## Security Checklist

- [x] `.env` is in `.gitignore`
- [x] `.env.template` has no real credentials
- [x] Strong passwords for PROD_* variables
- [x] Unique JWT secrets for DEV and PROD
- [x] GitHub token has minimal required permissions
- [x] VPN credentials stored securely in .env

## Next Steps

1. Copy `.env.template` to `.env`
2. Fill in real credentials
3. Test locally: `docker-compose up -d`
4. Deploy: `./remote-deploy.sh`
