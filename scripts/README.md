# Scripts Directory

This directory contains build and maintenance scripts that are part of the repository but not included in the production build.

## Available Scripts

### `prepare-country-data.sh`

Downloads and processes Natural Earth country boundary data for use in the EPSG lookup worker.

**Usage:**
```bash
chmod +x scripts/prepare-country-data.sh
./scripts/prepare-country-data.sh
```

**What it does:**
1. Downloads `ne_50m_admin_0_map_units.zip` from Natural Earth
2. Extracts the shapefile
3. Uses mapshaper to:
   - Filter to keep only `ISO_A3_EH` and `NAME` fields
   - Rename `ISO_A3_EH` to `ISO_A3` (this keeps territories separate from their parent countries)
   - Remove invalid entries (`ISO_A3 = "-99"`)
   - Add 0.1 degree buffer for coastal/border accuracy
   - Simplify geometry to 10% of original detail
   - Clean topology
4. Outputs to `public/data/world-countries-simplified.geojson`
5. Cleans up temporary files

**Requirements:**
- `curl` or `wget`
- `unzip`
- `npx` (comes with Node.js)
- `mapshaper` (installed automatically via npx)

**When to run:**
- Initial setup
- When updating to a new version of Natural Earth data
- When changing buffer size or simplification settings

**Output:**
- `public/data/world-countries-simplified.geojson` - Used by the EPSG lookup worker

## Notes

- The `temp/` subdirectory is created during script execution and cleaned up automatically
- All scripts in this directory are excluded from the production build
- Scripts are version-controlled for reproducibility
