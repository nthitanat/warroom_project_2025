# WarRoom Docker Deployment Guide

This guide explains how to use Docker and deploy the WarRoom application to a remote Chula server.

## 📋 Prerequisites

### Local Machine
- Docker and Docker Compose installed
- macOS or Linux operating system
- Homebrew (for macOS)
- Git

### Remote Server Access
- Chula VPN credentials
- Remote server SSH credentials
- GitHub personal access token (for private repositories)

## 🚀 Quick Start

### 1. Setup Environment Variables

**Important: This project uses a centralized `.env` file at the project root.**

Copy the template and fill in your credentials:

```bash
cp .env.template .env
```

Edit `.env` and update the following sections:
- **VPN Configuration**: Your Chula VPN username and password (from example)
- **Database Configuration**: Development and production database credentials
- **Remote Server**: SSH credentials for the remote server (from example)
- **GitHub**: Repository URL and personal access token
- **JWT Secrets**: Update with secure random strings

**Note:** The `.env` file is automatically injected into both server and client containers via docker-compose. No need for separate `.env` files in `war-server/` or `war-front/` directories.

### 2. Local Development with Docker

Build and run locally (development mode):

```bash
# Start all services with development configuration
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

For production mode locally (testing):

```bash
# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3001/api

### 3. Remote Deployment

Make the deployment scripts executable (already done):

```bash
chmod +x connect-vpn.sh disconnect-vpn.sh remote-deploy.sh
```

Run the deployment script:

```bash
./remote-deploy.sh
```

Select from the menu:
1. **Full Deploy** - Clone/pull repo, build React app, build Docker images, start containers
2. **Quick Update** - Pull latest code and restart containers (no rebuild)
3. **Start containers** - Start stopped containers
4. **Stop containers** - Stop running containers
5. **Restart containers** - Restart containers
6. **View logs** - Stream container logs
7. **Container status** - Check status and resource usage

## 📁 Project Structure

```
warroom_project_2025/
├── .env                    # Centralized environment variables (create from .env.template)
├── .env.template           # Environment variables template
├── .gitignore             # Git ignore rules
├── docker-compose.yml     # Docker Compose base configuration
├── docker-compose.prod.yml # Docker Compose production overrides
├── connect-vpn.sh         # VPN connection script
├── disconnect-vpn.sh      # VPN disconnection script
├── remote-deploy.sh       # Remote deployment script
├── DOCKER_DEPLOYMENT.md   # This file
├── war-server/
│   ├── Dockerfile         # Server Docker image
│   ├── package.json
│   └── src/
└── war-front/
    ├── Dockerfile         # Frontend Docker image
    ├── nginx.conf         # Nginx configuration
    ├── package.json
    └── src/
```

## 🐳 Docker Configuration

### Centralized Environment Management

This project uses a **single centralized `.env` file** at the project root that:
- Contains all environment variables for both server and client
- Uses `DEV_` and `PROD_` prefixes for environment-specific values
- Is automatically injected into Docker containers via `docker-compose.yml`
- Has production overrides in `docker-compose.prod.yml`

**No need for separate `.env` files in subdirectories!**

### Services

#### war-server (Backend)
- **Port**: 3001
- **Image**: Node.js 18 Alpine
- **Health Check**: HTTP check on /api/health endpoint
- **Volumes**: Public files directory mounted
- **Database**: Connects to external MySQL via `host.docker.internal`

#### war-front (Frontend)
- **Port**: 80
- **Image**: Multi-stage build (Node.js + Nginx)
- **Nginx**: Serves static files with SPA routing
- **Health Check**: HTTP check on /health endpoint

### Environment Variables

The docker-compose configuration uses:
- **`docker-compose.yml`**: Base configuration with DEV_ prefixed variables
- **`docker-compose.prod.yml`**: Production overrides with PROD_ prefixed variables

During deployment, the script automatically:
1. Uploads the `.env` file from your local machine to the remote server
2. Uses `docker-compose -f docker-compose.yml -f docker-compose.prod.yml` for production
3. Injects the correct variables based on the deployment mode

## 🔐 VPN Connection

### Connect to VPN

```bash
./connect-vpn.sh
```

This script:
1. Checks if `openconnect` is installed (installs if needed)
2. Connects to Chula VPN using credentials from `.env`
3. Runs VPN in background with PID file at `/var/run/openconnect.pid`

### Disconnect from VPN

```bash
./disconnect-vpn.sh
```

Or manually:
```bash
sudo kill $(cat /var/run/openconnect.pid)
```

## 🚢 Deployment Process

The `remote-deploy.sh` script automates the entire deployment:

### Full Deploy Process
1. **VPN Connection**: Connects to Chula VPN if not already connected
2. **Server Check**: Verifies remote server is reachable
3. **File Upload**: Uploads `.env` file to remote server
4. **Repository**: Clones or pulls latest code from GitHub
5. **React Build**: Builds React app for production
6. **Deploy Build**: Moves build to `/www/wwwroot/engagement.chula.ac.th/warroom`
7. **Docker Build**: Builds and starts Docker containers
8. **Health Check**: Verifies services are responding

### Quick Update Process
1-4. Same as Full Deploy
5. **Restart**: Restarts containers without rebuilding

## 🌐 Production URLs

After deployment, access the application at:
- **Web Client**: `http://REMOTE_HOST`
- **API Server**: `http://REMOTE_HOST:3001/api`

## 🛠️ Troubleshooting

### VPN Connection Issues

```bash
# Check if VPN is connected
pgrep openconnect

# View VPN connection details
sudo cat /var/run/openconnect.pid
```

### Docker Issues

```bash
# View container logs
docker-compose logs -f

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart war-server
docker-compose restart war-front

# Rebuild containers
docker-compose up -d --build
```

### Remote Server Issues

```bash
# SSH into remote server manually
ssh -p REMOTE_PORT REMOTE_USER@REMOTE_HOST

# Check Docker status on remote server
sudo docker-compose ps
sudo docker-compose logs -f
```

### Database Connection Issues

If containers can't connect to the database:

1. Verify `host.docker.internal` is accessible (should work on Docker Desktop)
2. Check database credentials in `.env`
3. Ensure MySQL is running and accessible
4. Check firewall rules

## 📝 Development Workflow

### Local Development

```bash
# Start services
docker-compose up -d

# Watch logs
docker-compose logs -f war-server
docker-compose logs -f war-front

# Make changes to code (hot reload should work for development)

# Rebuild after package.json changes
docker-compose up -d --build
```

### Testing Before Deployment

```bash
# Set to production mode locally
export DEPLOYMENT_MODE=production

# Build and test
docker-compose up -d --build

# Run tests
# ...

# Reset to development
export DEPLOYMENT_MODE=development
```

## 🔒 Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong passwords** - For database, JWT secrets, and server access
3. **Rotate credentials regularly** - Especially for production
4. **Limit VPN access** - Only use when needed
5. **Use SSH keys** - Consider setting up SSH keys instead of password auth

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [OpenConnect VPN Client](https://www.infradead.org/openconnect/)
- [Nginx Configuration](https://nginx.org/en/docs/)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Docker and container logs
3. Verify all credentials in `.env` file
4. Ensure VPN is connected for remote operations
