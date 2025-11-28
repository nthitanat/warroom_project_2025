#!/usr/bin/env node
/**
 * Sync Environment Variables from Root .env
 * 
 * This script reads the centralized .env file from the project root,
 * extracts REACT_APP_* variables based on DEPLOYMENT_MODE,
 * and creates a .env file in the war-front directory.
 */

const fs = require('fs');
const path = require('path');

// Paths
const rootEnvPath = path.join(__dirname, '..', '.env');
const frontEnvPath = path.join(__dirname, '.env');

// Read root .env file
if (!fs.existsSync(rootEnvPath)) {
  console.error('❌ Error: Root .env file not found at', rootEnvPath);
  process.exit(1);
}

const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');

// Parse .env file
const parseEnv = (content) => {
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (!line || line.trim().startsWith('#')) continue;
    
    // Parse key=value
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  }
  
  return env;
};

const rootEnv = parseEnv(rootEnvContent);

// Determine deployment mode (default to development)
const deploymentMode = rootEnv.DEPLOYMENT_MODE || 'development';
const isProduction = deploymentMode === 'production';

console.log(`📦 Syncing environment variables for: ${deploymentMode.toUpperCase()}`);

// Build the React app .env content
const reactEnvLines = [
  '# ============================================',
  '# Auto-generated from root .env file',
  '# DO NOT EDIT - Changes will be overwritten',
  '# ============================================',
  `# Generated at: ${new Date().toISOString()}`,
  `# Deployment Mode: ${deploymentMode}`,
  '',
];

// Extract environment-specific variables
const prefix = isProduction ? 'PROD_' : 'DEV_';

// Map DEV_REACT_APP_* or PROD_REACT_APP_* to REACT_APP_*
Object.keys(rootEnv).forEach(key => {
  if (key.startsWith(prefix + 'REACT_APP_')) {
    const reactKey = key.replace(prefix, '');
    const value = rootEnv[key];
    reactEnvLines.push(`${reactKey}=${value}`);
    console.log(`  ✓ ${reactKey}=${value}`);
  }
});

// Add shared REACT_APP_* variables (not prefixed)
Object.keys(rootEnv).forEach(key => {
  if (key.startsWith('REACT_APP_') && !key.includes('DEV_') && !key.includes('PROD_')) {
    const value = rootEnv[key];
    reactEnvLines.push(`${key}=${value}`);
    console.log(`  ✓ ${key}=${value}`);
  }
});

// Add PORT configuration (React dev server port)
// Use CLIENT_PORT from root .env for the React dev server
if (rootEnv.CLIENT_PORT) {
  reactEnvLines.push(`PORT=${rootEnv.CLIENT_PORT}`);
  console.log(`  ✓ PORT=${rootEnv.CLIENT_PORT}`);
}

// Also add the API server port as REACT_APP_API_PORT for reference
if (rootEnv.PORT) {
  reactEnvLines.push(`REACT_APP_API_PORT=${rootEnv.PORT}`);
  console.log(`  ✓ REACT_APP_API_PORT=${rootEnv.PORT}`);
}

// Write to war-front/.env
const reactEnvContent = reactEnvLines.join('\n') + '\n';
fs.writeFileSync(frontEnvPath, reactEnvContent, 'utf8');

console.log(`✅ Environment variables synced to ${frontEnvPath}`);
