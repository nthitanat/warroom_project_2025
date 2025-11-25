# Environment Variables Reference

## Centralized .env File

This project uses a **single `.env` file** at the project root for all configurations.

### Quick Setup

```bash
# Copy template
cp .env.template .env

# Edit with your values
vim .env  # or use your preferred editor
```

## Environment Variable Structure

### Prefix Convention
- `DEV_*` - Development environment variables
- `PROD_*` - Production environment variables
- No prefix - Shared across all environments

### How It Works

1. **Local Development**: Docker Compose uses `DEV_*` variables by default
2. **Production**: `docker-compose.prod.yml` overrides with `PROD_*` variables
3. **Deployment**: `remote-deploy.sh` automatically uploads `.env` to server

## Required Variables

### VPN Configuration (from example)
```bash
VPN_HOST=vpn.chula.ac.th
VPN_USERNAME=your_username
VPN_PASSWORD=your_password
```

### Local System
```bash
SUDO_PASSWORD=your_mac_password
```

### Remote Server (from example)
```bash
REMOTE_HOST=161.200.199.67
REMOTE_USER=adminroot
REMOTE_PASSWORD="your_password"
REMOTE_PORT=22
```

### Database (Development)
```bash
DEV_DB_HOST=host.docker.internal
DEV_DB_PORT=3306
DEV_DB_USER=warroomadmin
DEV_DB_PASSWORD=your_password
DEV_DB_NAME=warroom
```

### Database (Production)
```bash
PROD_DB_HOST=host.docker.internal
PROD_DB_PORT=3306
PROD_DB_USER=warroomadmin
PROD_DB_PASSWORD=your_prod_password
PROD_DB_NAME=warroom
```

### JWT Secrets
```bash
DEV_JWT_SECRET=warroom_jwt_secret_key_2025
DEV_JWT_EXPIRES_IN=24h

PROD_JWT_SECRET=warroom_jwt_secret_key_production_2025
PROD_JWT_EXPIRES_IN=24h
```

### API URLs
```bash
# Development
DEV_REACT_APP_API_BASE_URL=http://localhost:3001/api

# Production
PROD_REACT_APP_API_BASE_URL=https://engagement.chula.ac.th/war-room-api
```

### GitHub
```bash
REPO_URL=https://github.com/yourusername/warroom_project_2025.git
GITHUB_TOKEN=your_personal_access_token
```

## Important Notes

1. **Never commit `.env` to Git** - It's in `.gitignore`
2. **Keep `.env.template` updated** - It's the reference for all developers
3. **No subdirectory .env files** - Everything is centralized at project root
4. **Production values** - Always use strong passwords and secrets for PROD_* variables
5. **Auto-upload** - `remote-deploy.sh` automatically uploads `.env` to remote server

## Troubleshooting

### Environment not loading?
```bash
# Check if .env exists
ls -la .env

# Verify docker-compose is using it
docker-compose config
```

### Wrong environment in production?
The deployment script automatically uses production overrides via:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Need to update remote .env?
Just run the deployment script again - it always uploads the latest `.env`

## Security Best Practices

1. ✅ Use different passwords for DEV and PROD
2. ✅ Rotate credentials regularly
3. ✅ Use strong JWT secrets (random 64+ character strings)
4. ✅ Keep GitHub tokens secure and with minimal permissions
5. ✅ Never share your `.env` file via email/chat
6. ✅ Use `.env.template` for sharing configuration structure only
