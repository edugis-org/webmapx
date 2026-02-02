#!/bin/bash

# =============================================================================
# Cesium Assets Setup Script
# =============================================================================
# This script copies Cesium static assets from node_modules to public/cesium/
# These assets are required for Cesium to run but are excluded from git
# to avoid bloating the repository.
#
# Usage:
#   ./scripts/setup-cesium.sh
#
# Run this after npm install or when Cesium assets are missing.
# =============================================================================

set -e  # Exit on error

# Get script directory and workspace root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
SOURCE_DIR="$WORKSPACE_ROOT/node_modules/cesium/Build/Cesium"
DEST_DIR="$WORKSPACE_ROOT/public/cesium"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Cesium Assets Setup${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}ERROR: Cesium not found in node_modules${NC}"
    echo -e "${YELLOW}Please run 'npm install' first${NC}"
    exit 1
fi

# Create destination directory
echo -e "${YELLOW}Creating public/cesium directory...${NC}"
mkdir -p "$DEST_DIR"

# Copy Cesium assets
echo -e "${YELLOW}Copying Cesium assets from node_modules...${NC}"
cp -r "$SOURCE_DIR"/* "$DEST_DIR"/

# Count files
FILE_COUNT=$(find "$DEST_DIR" -type f | wc -l)
DIR_SIZE=$(du -sh "$DEST_DIR" | cut -f1)

echo ""
echo -e "${GREEN}✓ Success!${NC}"
echo -e "Copied ${FILE_COUNT} files (${DIR_SIZE}) to public/cesium/"
echo ""
echo -e "${YELLOW}Note:${NC} These files are ignored by git (.gitignore)"
echo -e "Run this script again after updating the cesium package"
echo ""
