# ============================================
# WarRoom Client - Dockerfile
# ============================================

# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build arguments for React environment variables
ARG NODE_ENV=production
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_ENABLE_API_LOGGING

# Set environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV REACT_APP_ENABLE_API_LOGGING=${REACT_APP_ENABLE_API_LOGGING}

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
