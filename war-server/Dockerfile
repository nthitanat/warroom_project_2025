# ============================================
# WarRoom Server - Dockerfile
# ============================================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install if package-lock.json doesn't exist or is out of sync
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production || npm install --only=production; \
    else \
        npm install --only=production; \
    fi

# Copy application files
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public/analytics/tiles public/charities public/lessons

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
