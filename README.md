# War Room Project 2025

Digital War Room (DSN) - A comprehensive disaster management platform by Chulalongkorn University.

## Project Overview

The War Room Project is a full-stack web application designed to support disaster management through:
- Real-time analytics and mapping
- Community charity management
- Educational lesson libraries
- War room coordination and podcasts

## Architecture

- **Frontend**: React 18 with custom SCSS styling system
- **Backend**: Node.js with Express
- **Database**: MySQL
- **Deployment**: Docker containerized with production deployment to Chula servers

## Project Structure

```
warroom_project_2025/
├── .env                        # 🔑 CENTRALIZED environment configuration
├── docker-compose.yml          # Development Docker setup
├── docker-compose.prod.yml     # Production Docker setup
├── remote-deploy.sh            # Automated deployment script
├── war-front/                  # React frontend application
│   ├── sync-env.js            # Auto-syncs env from root .env
│   ├── src/
│   └── package.json
└── war-server/                 # Node.js backend API
    ├── src/
    └── package.json
```

## 🔑 Centralized Environment Configuration

**Important**: This project uses a **single centralized `.env` file** at the project root.

### How It Works

1. **Single Source of Truth**: All environment variables are defined in the root `.env` file
2. **Mode-Based Configuration**: Variables are prefixed with `DEV_` or `PROD_` based on deployment mode
3. **Automatic Synchronization**: 
   - React app automatically syncs variables before `npm start` or `npm run build`
   - Docker containers mount the root `.env` file directly
   - Deployment scripts inject the correct variables for production

### Environment Variables Structure

```bash
# Deployment Mode Control
DEPLOYMENT_MODE=development  # or 'production'

# React Client Configuration
DEV_REACT_APP_API_BASE_URL=http://localhost:4000/api
PROD_REACT_APP_API_BASE_URL=https://engagement.chula.ac.th/war-room-api/api

# Shared Variables (all environments)
REACT_APP_MAPTILER_API_KEY=your_key_here

# Server Configuration
DEV_DB_HOST=host.docker.internal
DEV_DB_PORT=3306
PROD_DB_HOST=127.0.0.1

# ... more variables
```

### For Developers

**Never create separate `.env` files in subdirectories** - always use the root `.env` file.

- To change environment: Update `DEPLOYMENT_MODE` in root `.env`
- For React: Variables are auto-synced via `sync-env.js` script
- For Server: Docker mounts the root `.env` file directly
- For Production: Deployment script forces `DEPLOYMENT_MODE=production`

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MySQL (for local development without Docker)

### Local Development (with Docker)

1. Clone the repository:
```bash
git clone https://github.com/nthitanat/warroom_project_2025.git
cd warroom_project_2025
```

2. Configure environment:
```bash
# Copy example or create .env in project root
# Set DEPLOYMENT_MODE=development
```

3. Start with Docker:
```bash
docker-compose up -d
```

4. Access the application:
   - Frontend: http://localhost:4001
   - API: http://localhost:4000/api

### Local Development (without Docker)

#### Frontend Only

```bash
cd war-front
npm install
npm start  # Automatically syncs env from root .env
```
Access at http://localhost:3000

#### Backend Only

```bash
cd war-server
npm install
# Ensure root .env has DEV_* variables configured
node src/server.js
```
API available at http://localhost:4000

### Database Setup

Run the migration script:
```bash
bash database-migration.sh
```

## Deployment

### Production Deployment to Chula Servers

The project includes an automated deployment script that:
1. Connects to Chula VPN
2. SSHs to remote server
3. Pulls latest code from GitHub
4. Builds and deploys containers

```bash
bash remote-deploy.sh
```

Select from deployment options:
1. Full Deploy (git pull + build + restart)
2. Quick Update (git pull + restart, no rebuild)
3. Client Rebuild Only (rebuild React only)
4. Start/Stop/Restart containers
5. View logs
6. Container status

### Production URLs

- Web Client: https://engagement.chula.ac.th/war-room/
- API Server: https://engagement.chula.ac.th/war-room-api/api

## Development Workflow

### Making Changes

1. Update code in `war-front/` or `war-server/`
2. Test locally with Docker: `docker-compose up --build`
3. Commit and push to GitHub
4. Deploy to production: `bash remote-deploy.sh`

### Environment Changes

1. Edit root `.env` file
2. For local Docker: Restart containers
3. For production: Run deployment script (automatically syncs .env)

### React Component Development

Follow the 4-file component pattern:
- `Component.jsx` - Presentation
- `Component.module.scss` - Styles
- `useComponent.js` - State management
- `ComponentHandler.js` - Business logic

See `war-front/README.md` for detailed guidelines.

## Scripts

- `docker-compose.yml` - Local development setup
- `docker-compose.prod.yml` - Production deployment
- `remote-deploy.sh` - Automated production deployment
- `database-migration.sh` - Database setup and migration
- `connect-vpn.sh` - Connect to Chula VPN
- `disconnect-vpn.sh` - Disconnect from VPN

## Technology Stack

### Frontend
- React 18
- React Router
- Axios for API calls
- MapLibre GL for mapping
- Custom SCSS system (no UI library)

### Backend
- Node.js with Express
- MySQL with mysql2
- JWT authentication
- Multer for file uploads
- CORS and rate limiting

### DevOps
- Docker & Docker Compose
- GitHub for version control
- Automated deployment scripts
- VPN integration for secure access

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with Docker
4. Submit a pull request

## License

Proprietary - Chulalongkorn University

## Contact

War Room Project Team - Chulalongkorn University
```