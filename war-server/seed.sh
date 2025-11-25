#!/bin/bash

# Database Seeding Quick Start Script
# This script helps you quickly seed the database with data from war-client/public

echo "╔════════════════════════════════════════════════════════╗"
echo "║      WAR ROOM DATABASE SEEDING - QUICK START          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from war-server directory"
    echo "Usage: cd war-server && ./seed.sh"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your database credentials:"
    echo ""
    echo "DB_HOST_DEV=localhost"
    echo "DB_PORT_DEV=3306"
    echo "DB_USER_DEV=your_username"
    echo "DB_PASSWORD_DEV=your_password"
    echo "DB_NAME=war_room_db"
    echo ""
    exit 1
fi

# Check if war-client/public folder exists
if [ ! -d "../war-client/public" ]; then
    echo "❌ Error: war-client/public folder not found"
    echo "Expected path: ../war-client/public"
    exit 1
fi

echo "✅ Pre-flight checks passed"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting database seeding..."
echo ""
echo "⚠️  WARNING: This will DELETE all existing data in the database!"
echo "Press Ctrl+C within 5 seconds to cancel..."
echo ""

sleep 5

# Run the seed script
npm run seed

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║      ✅ DATABASE SEEDING COMPLETED                     ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "  1. Verify data: npm start"
    echo "  2. Check API endpoints"
    echo "  3. Test the application"
else
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║      ❌ DATABASE SEEDING FAILED                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check your .env file credentials"
    echo "  2. Ensure MySQL is running"
    echo "  3. Review error messages above"
    echo "  4. See SEEDING_GUIDE.md for details"
    exit 1
fi
