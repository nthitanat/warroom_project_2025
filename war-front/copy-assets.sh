#!/bin/bash

# Copy Public Assets from war-client to war-front
# This script copies all necessary public assets from the Next.js app to the React app

echo "🚀 Starting to copy public assets from war-client to war-front..."

# Define source and destination
SOURCE="../war-client/public"
DEST="./public"

# Check if source exists
if [ ! -d "$SOURCE" ]; then
    echo "❌ Error: Source directory $SOURCE not found"
    echo "Make sure you're running this script from the war-front directory"
    exit 1
fi

# Create destination if it doesn't exist
mkdir -p "$DEST"

echo "📁 Copying analytics data and tiles..."
cp -r "$SOURCE/analytics" "$DEST/"

echo "📁 Copying charity images and data..."
cp -r "$SOURCE/charities" "$DEST/"

echo "📁 Copying common assets (fonts, network)..."
cp -r "$SOURCE/common" "$DEST/"

echo "📁 Copying lesson content and images..."
cp -r "$SOURCE/lesson" "$DEST/"

echo "📁 Copying warroom data..."
cp -r "$SOURCE/warroom" "$DEST/"

echo "📁 Copying about images..."
if [ -d "$SOURCE/about" ]; then
    cp -r "$SOURCE/about" "$DEST/"
fi

echo "✅ All public assets copied successfully!"
echo ""
echo "📊 Summary of copied folders:"
echo "  - analytics/ (map tiles and data)"
echo "  - charities/ (images and data)"
echo "  - common/ (fonts and network images)"
echo "  - lesson/ (images and data)"
echo "  - warroom/ (data)"
echo ""
echo "🎉 Done! Your war-front/public folder is ready."
