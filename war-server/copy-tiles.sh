#!/bin/bash

# Copy Public Assets from war-client to war-server
# This script copies analytics tiles for serving via the backend API

echo "🚀 Starting to copy public assets from war-client to war-server..."

# Define source and destination
SOURCE="../war-client/public"
DEST="./public"

# Check if source exists
if [ ! -d "$SOURCE" ]; then
    echo "❌ Error: Source directory $SOURCE not found"
    echo "Make sure you're running this script from the war-server directory"
    exit 1
fi

# Create destination if it doesn't exist
mkdir -p "$DEST"

echo "📁 Copying analytics data for API serving..."
mkdir -p "$DEST/analytics"

# Copy tiles directory
if [ -d "$SOURCE/analytics/tiles" ]; then
    cp -r "$SOURCE/analytics/tiles" "$DEST/analytics/"
    echo "  ✓ Copied analytics/tiles/"
fi

# Copy JSON files
if [ -f "$SOURCE/analytics/analytics.json" ]; then
    cp "$SOURCE/analytics/analytics.json" "$DEST/analytics/"
    echo "  ✓ Copied analytics.json"
fi

if [ -f "$SOURCE/analytics/village-info.json" ]; then
    cp "$SOURCE/analytics/village-info.json" "$DEST/analytics/"
    echo "  ✓ Copied village-info.json"
fi

echo ""
echo "✅ Analytics data copied successfully!"
echo ""
echo "📊 Summary of copied assets:"
echo "  - analytics/tiles/ (for /api/analytics/tiles/* endpoint)"
echo "  - analytics.json (for /api/analytics/data endpoint)"
echo "  - village-info.json (for /api/analytics/village-info endpoint)"
echo ""
echo "🎉 Done! Your war-server can now serve analytics data and map tiles."
