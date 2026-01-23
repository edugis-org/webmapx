# Scripts Directory

This directory contains build and maintenance scripts that are part of the repository but not included in the production build.

## Available Scripts

### `setup-cesium.sh`

Copies Cesium static assets from node_modules to public/cesium/. These assets are required for Cesium to run but are excluded from git to avoid repository bloat.

**Usage:**
```bash
./scripts/setup-cesium.sh
```

**What it does:**
1. Checks if Cesium is installed in node_modules
2. Creates `public/cesium/` directory
3. Copies all assets from `node_modules/cesium/Build/Cesium/`
4. Reports the number of files and total size copied

**Requirements:**
- Cesium package installed via npm (`npm install`)

**When to run:**
- After `npm install` (first time or after dependencies change)
- When Cesium assets are missing
- After updating the cesium package version

**Output:**
- `public/cesium/` - Contains Workers/, ThirdParty/, Widgets/, and other Cesium runtime assets

**Note:** The `public/cesium/` directory is git-ignored. Run this script on each machine/environment after cloning the repository.

---

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
