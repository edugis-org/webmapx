#!/bin/bash

# =============================================================================
# Natural Earth Data Download and Processing Script
# =============================================================================
# This script downloads country/territory boundaries from Natural Earth
# and processes them for use in the EPSG lookup worker.
#
# Requirements:
# - curl or wget
# - npx (Node.js)
# - mapshaper (installed via npx)
#
# Usage:
#   ./scripts/prepare-country-data.sh
# =============================================================================

set -e  # Exit on error

# Get script directory and workspace root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
NE_URL="https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_map_units.zip"
TEMP_DIR="$SCRIPT_DIR/temp"
OUTPUT_DIR="$WORKSPACE_ROOT/public/data"
ZIP_FILE="$TEMP_DIR/ne_data.zip"
OUTPUT_FILE="$OUTPUT_DIR/world-countries-simplified.topojson"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Natural Earth Country Data Preparation${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Create directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p "$TEMP_DIR"
mkdir -p "$OUTPUT_DIR"

# Download data
echo -e "${YELLOW}Downloading Natural Earth data...${NC}"
if command -v curl &> /dev/null; then
    curl -L -o "$ZIP_FILE" "$NE_URL"
elif command -v wget &> /dev/null; then
    wget -O "$ZIP_FILE" "$NE_URL"
else
    echo -e "${RED}Error: Neither curl nor wget found. Please install one.${NC}"
    exit 1
fi


# Extract the zip file
echo -e "${YELLOW}Extracting zip file...${NC}"
if command -v unzip &> /dev/null; then
    unzip -q -o "$ZIP_FILE" -d "$TEMP_DIR"
elif command -v python3 &> /dev/null; then
    python3 -m zipfile -e "$ZIP_FILE" "$TEMP_DIR"
else
    echo -e "${RED}Error: Neither unzip nor python3 found. Please install unzip.${NC}"
    exit 1
fi

# Find the shapefile
SHAPEFILE=$(find "$TEMP_DIR" -name "*.shp" -type f | head -1)

if [ -z "$SHAPEFILE" ]; then
    echo -e "${RED}Error: No shapefile found in extracted data${NC}"
    exit 1
fi

echo -e "${YELLOW}Found shapefile: $SHAPEFILE${NC}"

# Process with mapshaper
echo -e "${YELLOW}Processing with mapshaper...${NC}"
echo -e "${YELLOW}  - Filtering to keep only ISO_A3_EH and NAME fiels${NC}"
echo -e "${YELLOW}  - Renaming ISO_A3_EH to ISO_A3${NC}"
echo -e "${YELLOW}  - Removing invalid entries${NC}"
echo -e "${YELLOW}  - Buffering by 1000 meters (creates overlaps)${NC}"

npx mapshaper "$SHAPEFILE" \
  -filter-fields ISO_A3_EH,NAME \
  -rename-fields ISO_A3=ISO_A3_EH \
  -buffer radius=1000 \
  -o format=topojson "$OUTPUT_FILE"

# Check output
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    FEATURE_COUNT=$(grep -o '"type": "Feature"' "$OUTPUT_FILE" | wc -l)
    
    echo ""
    echo -e "${GREEN}✓ Success!${NC}"
    echo -e "${GREEN}  Output file: $OUTPUT_FILE${NC}"
    echo -e "${GREEN}  File size: $FILE_SIZE${NC}"
    echo -e "${GREEN}  Features: $FEATURE_COUNT${NC}"
else
    echo -e "${RED}Error: Output file was not created${NC}"
    exit 1
fi

# Cleanup
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Done! Country data is ready for use.${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Review the generated file: ${OUTPUT_FILE}"
echo -e "  2. Update country-epsg-codes.json if needed for new territories"
echo -e "  3. Test with: npm run dev → open epsg-lookup-test.html"
echo ""
