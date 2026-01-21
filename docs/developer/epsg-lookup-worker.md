# EPSG Lookup Worker

## Overview

The EPSG Lookup Worker is a lazy-loaded web worker that determines appropriate EPSG coordinate reference system codes based on geographic coordinates (latitude/longitude). It identifies the country containing the coordinates and returns commonly used EPSG codes for that region.

## Features

- **Lazy Loading**: Worker and data files are only loaded on first use, not at application startup
- **Auto Cleanup**: Worker automatically terminates after 1 minute of idle time to free memory
- **Geographic Detection**: Uses simplified world boundaries to determine which country contains coordinates
- **Country-Specific EPSG Codes**: Returns a list of commonly used EPSG codes for the detected country
- **Promise-Based API**: Easy-to-use async/await interface

## Architecture

### Components

1. **Data Files** (in `/public/data/`):
   - `country-epsg-codes.json` - Maps country codes to EPSG codes
   - `world-countries-simplified.geojson` - Simplified world boundaries for point-in-polygon detection

2. **Web Worker** (`/src/workers/epsg-lookup.worker.ts`):
   - Loads data files
   - Performs point-in-polygon calculations
   - Returns EPSG codes based on country

3. **Worker Manager** (`/src/utils/epsg-lookup-manager.ts`):
   - Manages worker lifecycle
   - Handles lazy initialization
   - Manages idle timeout and cleanup
   - Provides simple API

## Usage

### Basic Example

```typescript
import { epsgLookupManager } from '../utils/epsg-lookup-manager';

// Look up EPSG codes for coordinates
async function getLocalEpsgCodes(lat: number, lng: number) {
  const result = await epsgLookupManager.lookup(lat, lng);
  
  if (result.success) {
    console.log('Country:', result.countryName);
    console.log('Primary EPSG:', result.primaryEpsg);
    console.log('Available EPSG codes:', result.epsgCodes);
  } else {
    console.error('Lookup failed:', result.error);
  }
  
  return result;
}

// Example: Netherlands coordinates
await getLocalEpsgCodes(52.0907, 5.1214);
// Returns: { success: true, countryName: 'Netherlands', primaryEpsg: '28992', epsgCodes: ['28992', '25831', '25832', '4326'] }
```

### Integration with Coordinate Tool

```typescript
import { epsgLookupManager, type EpsgLookupResult } from '../utils/epsg-lookup-manager';

class MyCoordinateTool extends LitElement {
  @state()
  private localEpsgCodes: string[] = [];
  
  @state()
  private detectedCountry: string = '';
  
  async handleCoordinateChange(lat: number, lng: number) {
    // Look up local EPSG codes for this location
    const result = await epsgLookupManager.lookup(lat, lng);
    
    if (result.success && result.epsgCodes) {
      this.localEpsgCodes = result.epsgCodes;
      this.detectedCountry = result.countryName || '';
      
      // You can now use these EPSG codes to transform coordinates
      // or display them to the user
    }
  }
}
```

### Configuration

You can customize the idle timeout:

```typescript
import { epsgLookupManager } from '../utils/epsg-lookup-manager';

// Set idle timeout to 2 minutes (default is 1 minute)
epsgLookupManager.setIdleTimeout(120000);
```

### Manual Cleanup

If you need to manually cleanup the worker before the idle timeout:

```typescript
import { epsgLookupManager } from '../utils/epsg-lookup-manager';

// Cleanup immediately
epsgLookupManager.cleanup();
```

## API Reference

### `epsgLookupManager.lookup(lat, lng)`

Look up EPSG codes for given coordinates.

**Parameters:**
- `lat: number` - Latitude (-90 to 90)
- `lng: number` - Longitude (-180 to 180)

**Returns:** `Promise<EpsgLookupResult>`

```typescript
interface EpsgLookupResult {
  success: boolean;
  countryCode?: string;      // ISO 3166-1 alpha-3 code (e.g., 'NLD')
  countryName?: string;       // Human-readable country name
  epsgCodes?: string[];       // Array of EPSG codes commonly used in this country
  primaryEpsg?: string;       // Most commonly used EPSG code for this country
  error?: string;             // Error message if success is false
}
```

### `epsgLookupManager.setIdleTimeout(timeoutMs)`

Set the idle timeout duration.

**Parameters:**
- `timeoutMs: number` - Timeout in milliseconds (default: 60000 = 1 minute)

### `epsgLookupManager.cleanup()`

Manually terminate the worker and free resources.

### `epsgLookupManager.ready`

Boolean property indicating if the worker is initialized and ready.

## Performance

- **Data Size**: 
  - `country-epsg-codes.json`: ~15 KB
  - `world-countries-simplified.geojson`: ~50 KB
  - Total: ~65 KB loaded only on first use

- **Memory**: Worker and data are freed after 1 minute of inactivity

- **Speed**: Point-in-polygon lookup typically takes < 10ms for ~55 countries

## Limitations

- **Simplified Boundaries**: Uses simplified rectangular bounding boxes for countries, not exact borders
  - This means coordinates near borders might be assigned to the wrong country
  - Coastal areas might not be detected
  
- **Coverage**: Currently includes ~55 major countries. Not all countries are included.

- **Border Disputes**: Uses simplified boundaries and may not reflect disputed territories accurately

## Extending

### Adding Countries

Edit `/public/data/country-epsg-codes.json`:

```json
{
  "countries": {
    "XXX": {
      "name": "Country Name",
      "epsgCodes": ["EPSG1", "EPSG2", "EPSG3", "4326"],
      "primary": "EPSG1"
    }
  }
}
```

Edit `/public/data/world-countries-simplified.geojson`:

```json
{
  "type": "Feature",
  "properties": { "ISO_A3": "XXX", "NAME": "Country Name" },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[west, south], [west, north], [east, north], [east, south], [west, south]]]
  }
}
```

### Improving Accuracy

For more accurate country detection, replace the simplified GeoJSON with a more detailed boundary file. Keep in mind:
- Larger files will increase memory usage and load time
- More complex polygons will slow down point-in-polygon calculations
- Consider using Web Workers for intensive calculations (already implemented)

## Troubleshooting

**Worker fails to load:**
- Check browser console for errors
- Ensure data files exist in `/public/data/`
- Verify Vite is serving the public directory correctly

**"No country found" errors:**
- Coordinates might be in an ocean or uncovered country
- Check coordinate order (lng, lat vs lat, lng)
- Verify coordinates are within valid ranges

**Worker doesn't cleanup:**
- Check if requests are being made within the idle timeout period
- Manually call `cleanup()` if needed

## Browser Support

Requires browsers with:
- Web Workers support
- ES Modules in Workers
- Fetch API

Supported by all modern browsers (Chrome, Firefox, Safari, Edge).
