#!/bin/bash

# ============================================
# PRODUCTION SERVER FOLDER RENAME SCRIPT
# Charity ID Migration: INT -> VARCHAR(8)
# ============================================
#
# This script renames charity thumbnail and slide folders
# to match the new unique IDs.
#
# Usage:
#   cd /path/to/war-server
#   chmod +x src/scripts/production-folder-rename.sh
#   ./src/scripts/production-folder-rename.sh
#
# IMPORTANT: Run this AFTER running production-migration.sql
# ============================================

echo "🔄 Starting folder rename migration..."

# Navigate to charities public folder
cd public/charities || { echo "❌ Could not find public/charities folder"; exit 1; }

echo ""
echo "📁 Renaming charity thumbnail folders..."
cd thumbnails 2>/dev/null || mkdir -p thumbnails && cd thumbnails

# Charity thumbnail folders: old_id -> new_id
mv 1 atrngkt2 2>/dev/null && echo "✓ thumbnails/1 -> thumbnails/atrngkt2"
mv 2 4fnbpmhl 2>/dev/null && echo "✓ thumbnails/2 -> thumbnails/4fnbpmhl"
mv 3 tkzwp7n8 2>/dev/null && echo "✓ thumbnails/3 -> thumbnails/tkzwp7n8"
mv 4 7asxh4cp 2>/dev/null && echo "✓ thumbnails/4 -> thumbnails/7asxh4cp"
mv 5 l3ohc4tc 2>/dev/null && echo "✓ thumbnails/5 -> thumbnails/l3ohc4tc"

cd ..

echo ""
echo "📁 Renaming slide folders..."
cd slides 2>/dev/null || mkdir -p slides && cd slides

# Slide folders: old_id -> new_id
mv 1 xuodvd7d 2>/dev/null && echo "✓ slides/1 -> slides/xuodvd7d"
mv 2 q7vy1ei3 2>/dev/null && echo "✓ slides/2 -> slides/q7vy1ei3"
mv 3 bd2onbbv 2>/dev/null && echo "✓ slides/3 -> slides/bd2onbbv"
mv 4 drwxffgx 2>/dev/null && echo "✓ slides/4 -> slides/drwxffgx"
mv 5 10pvx1co 2>/dev/null && echo "✓ slides/5 -> slides/10pvx1co"
mv 6 59ez5lbe 2>/dev/null && echo "✓ slides/6 -> slides/59ez5lbe"
mv 7 le1d41io 2>/dev/null && echo "✓ slides/7 -> slides/le1d41io"
mv 8 3xerrcv1 2>/dev/null && echo "✓ slides/8 -> slides/3xerrcv1"
mv 9 ll0dpvdz 2>/dev/null && echo "✓ slides/9 -> slides/ll0dpvdz"
mv 10 xxtl6hn2 2>/dev/null && echo "✓ slides/10 -> slides/xxtl6hn2"
mv 11 vjwij4jj 2>/dev/null && echo "✓ slides/11 -> slides/vjwij4jj"
mv 12 8plf5dpb 2>/dev/null && echo "✓ slides/12 -> slides/8plf5dpb"
mv 13 o6yaniuc 2>/dev/null && echo "✓ slides/13 -> slides/o6yaniuc"
mv 14 wr0q0nxz 2>/dev/null && echo "✓ slides/14 -> slides/wr0q0nxz"
mv 15 ipf72e8p 2>/dev/null && echo "✓ slides/15 -> slides/ipf72e8p"
mv 16 wdk61e3s 2>/dev/null && echo "✓ slides/16 -> slides/wdk61e3s"
mv 17 dr8rybtw 2>/dev/null && echo "✓ slides/17 -> slides/dr8rybtw"
mv 18 qy0k6f87 2>/dev/null && echo "✓ slides/18 -> slides/qy0k6f87"
mv 19 uzzwwad1 2>/dev/null && echo "✓ slides/19 -> slides/uzzwwad1"
mv 20 l2di3pnv 2>/dev/null && echo "✓ slides/20 -> slides/l2di3pnv"
mv 21 szyo1h20 2>/dev/null && echo "✓ slides/21 -> slides/szyo1h20"
mv 22 fit9sod6 2>/dev/null && echo "✓ slides/22 -> slides/fit9sod6"
mv 23 0kwzvs8v 2>/dev/null && echo "✓ slides/23 -> slides/0kwzvs8v"
mv 24 sg1j816q 2>/dev/null && echo "✓ slides/24 -> slides/sg1j816q"
mv 25 ooyssy24 2>/dev/null && echo "✓ slides/25 -> slides/ooyssy24"
mv 26 ruzu1fls 2>/dev/null && echo "✓ slides/26 -> slides/ruzu1fls"
mv 27 fqja51b1 2>/dev/null && echo "✓ slides/27 -> slides/fqja51b1"
mv 28 add7eke9 2>/dev/null && echo "✓ slides/28 -> slides/add7eke9"
mv 29 jf5pcqft 2>/dev/null && echo "✓ slides/29 -> slides/jf5pcqft"
mv 30 xfmjnoie 2>/dev/null && echo "✓ slides/30 -> slides/xfmjnoie"
mv 31 063wy7mk 2>/dev/null && echo "✓ slides/31 -> slides/063wy7mk"
mv 33 7aszvjtq 2>/dev/null && echo "✓ slides/33 -> slides/7aszvjtq"

echo ""
echo "✅ Folder rename migration completed!"
echo ""
echo "Thumbnail folders:"
ls -la ../thumbnails/
echo ""
echo "Slide folders:"
ls -la ../slides/
