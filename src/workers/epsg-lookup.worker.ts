/**
 * EPSG Lookup Web Worker
 * 
 * This worker loads geographic data and determines appropriate EPSG codes
 * based on lat/lng coordinates by identifying the country they fall within.
 * 
 * Features:
 * - Lazy loads data files only when needed
 * - Point-in-polygon detection for country identification
 * - Returns locally popular EPSG codes for the detected country
 * - Auto-cleanup after idle timeout
 */

interface CountryEpsgData {
  type: string;
  version: string;
  description: string;
  countries: Record<string, {
    name: string;
    epsgCodes: string[];
    primary: string;
  }>;
}

interface GeoJSONFeature {
  type: string;
  properties: {
    ISO_A3: string;
    NAME: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

interface LookupRequest {
  type: 'lookup';
  lat: number;
  lng: number;
  requestId: string;
}

interface LoadDataRequest {
  type: 'loadData';
  baseUrl: string;
}

interface ShutdownRequest {
  type: 'shutdown';
}

type WorkerRequest = LookupRequest | LoadDataRequest | ShutdownRequest;

interface LookupResponse {
  type: 'lookup-result';
  requestId: string;
  success: boolean;
  countryCode?: string;
  countryName?: string;
  epsgCodes?: string[];
  primaryEpsg?: string;
  alternativeMatches?: Array<{countryCode: string; countryName: string; epsgCodes: string[]; primaryEpsg: string}>;
  error?: string;
}

interface ReadyResponse {
  type: 'ready';
  success: boolean;
  error?: string;
}

interface ShutdownResponse {
  type: 'shutdown-complete';
}

type WorkerResponse = LookupResponse | ReadyResponse | ShutdownResponse;

// Data cache
let countryEpsgData: CountryEpsgData | null = null;
let geoJsonData: GeoJSONData | null = null;
let isDataLoaded = false;
let baseUrl = '';

/**
 * Load both data files
 */
async function loadData(url: string): Promise<void> {
  baseUrl = url;
  
  try {
    // Load country-EPSG mapping
    const epsgResponse = await fetch(`${baseUrl}/data/country-epsg-codes.json`);
    if (!epsgResponse.ok) {
      throw new Error(`Failed to load country EPSG codes: ${epsgResponse.status}`);
    }
    countryEpsgData = await epsgResponse.json();
    
    // Load world boundaries TopoJSON
    const topoResponse = await fetch(`${baseUrl}/data/world-countries-simplified.topojson`);
    if (!topoResponse.ok) {
      throw new Error(`Failed to load world countries TopoJSON: ${topoResponse.status}`);
    }
    const topoData = await topoResponse.json();
    
    // Convert TopoJSON to GeoJSON
    // TopoJSON format: {type: "Topology", objects: {collection: {...}}, arcs: [...]}
    // We need to decode the arcs and convert to GeoJSON features
    geoJsonData = convertTopoJsonToGeoJson(topoData);
    
    console.log(`Loaded ${geoJsonData.features.length} countries`);
    
    isDataLoaded = true;
  } catch (error) {
    isDataLoaded = false;
    throw error;
  }
}

/**
 * Convert TopoJSON to GeoJSON
 * Simple implementation that decodes arcs and builds geometries
 */
function convertTopoJsonToGeoJson(topology: any): GeoJSONData {
  const features: GeoJSONFeature[] = [];
  
  // Get the main object (usually there's one collection)
  const objectKey = Object.keys(topology.objects)[0];
  const collection = topology.objects[objectKey];
  
  if (!collection.geometries) {
    throw new Error('Invalid TopoJSON: no geometries found');
  }
  
  // Decode arcs helper
  function decodeArc(arcIndex: number): number[][] {
    const isReversed = arcIndex < 0;
    const arc = topology.arcs[Math.abs(arcIndex)];
    const points: number[][] = [];
    let x = 0, y = 0;
    
    for (const [dx, dy] of arc) {
      x += dx;
      y += dy;
      points.push([x, y]);
    }
    
    // Apply transform if present
    if (topology.transform) {
      const {scale, translate} = topology.transform;
      const transformed = points.map(([px, py]) => [
        px * scale[0] + translate[0],
        py * scale[1] + translate[1]
      ]);
      // Reverse if negative index (reversed arc direction)
      return isReversed ? transformed.reverse() : transformed;
    }
    
    // Reverse if negative index
    return isReversed ? points.reverse() : points;
  }
  
  // Decode arc sequence (handles holes)
  // Stitches multiple arcs together into a single ring
  function decodeRing(arcIndices: number[]): number[][] {
    const ring: number[][] = [];
    
    for (let i = 0; i < arcIndices.length; i++) {
      const points = decodeArc(arcIndices[i]);
      
      if (i === 0) {
        // First arc: add all points
        ring.push(...points);
      } else {
        // Subsequent arcs: skip first point (it's shared with previous arc's last point)
        ring.push(...points.slice(1));
      }
    }
    
    return ring;
  }
  
  // Decode all rings of a polygon
  function decodeArcs(arcs: number[][]): number[][][] {
    return arcs.map(arcIndices => decodeRing(arcIndices));
  }
  
  // Convert each geometry
  for (const geom of collection.geometries) {
    if (geom.type === 'Polygon') {
      const coords = decodeArcs(geom.arcs);
      features.push({
        type: 'Feature',
        properties: geom.properties || {},
        geometry: {
          type: 'Polygon',
          coordinates: coords
        }
      });
    } else if (geom.type === 'MultiPolygon') {
      const coords = geom.arcs.map((polyArcs: number[][]) => decodeArcs(polyArcs));
      features.push({
        type: 'Feature',
        properties: geom.properties || {},
        geometry: {
          type: 'MultiPolygon',
          coordinates: coords
        }
      });
    }
  }
  
  console.log(`Converted ${features.length} features from TopoJSON`);
  if (features.length > 0) {
    const sample = features[0];
    console.log(`Sample feature: ${sample.properties.NAME}, type: ${sample.geometry.type}, rings: ${sample.geometry.type === 'Polygon' ? sample.geometry.coordinates.length : 'N/A'}`);
  }
  
  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Point-in-polygon test using ray casting algorithm
 * @param point [lng, lat]
 * @param polygon Array of coordinate rings (first is exterior, rest are holes)
 */
function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  const [x, y] = point;
  const ring = polygon[0]; // Only check exterior ring for simplicity
  
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate approximate area of a polygon using the Shoelace formula
 * Returns area in square degrees (for comparison purposes only)
 */
function calculatePolygonArea(ring: number[][]): number {
  let area = 0;
  const n = ring.length;
  
  for (let i = 0; i < n - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculate total area of a feature
 */
function calculateFeatureArea(feature: GeoJSONFeature): number {
  let totalArea = 0;
  
  if (feature.geometry.type === 'Polygon') {
    const polygon = feature.geometry.coordinates as number[][][];
    // Use only the outer ring (first ring) for area calculation
    totalArea = calculatePolygonArea(polygon[0]);
  } else if (feature.geometry.type === 'MultiPolygon') {
    const multiPolygon = feature.geometry.coordinates as number[][][][];
    for (const polygon of multiPolygon) {
      // Use only the outer ring of each polygon
      totalArea += calculatePolygonArea(polygon[0]);
    }
  }
  
  return totalArea;
}

/**
 * Find all countries that contain the given coordinates
 * Returns array sorted by area (smallest first, likely most accurate for borders)
 */
function findCountries(lng: number, lat: number): GeoJSONFeature[] {
  if (!geoJsonData) return [];
  
  const point: [number, number] = [lng, lat];
  const matches: Array<{feature: GeoJSONFeature; area: number}> = [];
  
  for (const feature of geoJsonData.features) {
    let isInside = false;
    
    if (feature.geometry.type === 'Polygon') {
      isInside = pointInPolygon(point, feature.geometry.coordinates as number[][][]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      const multiPolygon = feature.geometry.coordinates as number[][][][];
      for (const polygon of multiPolygon) {
        if (pointInPolygon(point, polygon)) {
          isInside = true;
          break;
        }
      }
    }
    
    if (isInside) {
      const area = calculateFeatureArea(feature);
      matches.push({feature, area});
    }
  }
  
  // Sort by area (smallest first - likely most accurate for border areas)
  matches.sort((a, b) => a.area - b.area);
  
  if (matches.length > 0) {
    const countryList = matches.map(m => `${m.feature.properties.NAME} (${m.feature.properties.ISO_A3})`).join(', ');
    console.log(`Matched countries: ${countryList}`);
  }
  
  return matches.map(m => m.feature);
}

/**
 * Look up EPSG codes for given coordinates
 */
function lookupEpsgCodes(lat: number, lng: number): Omit<LookupResponse, 'type' | 'requestId'> {
  if (!isDataLoaded || !countryEpsgData || !geoJsonData) {
    return {
      success: false,
      error: 'Data not loaded'
    };
  }
  
  // Validate coordinates
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      success: false,
      error: 'Invalid coordinates'
    };
  }
  
  // Find all matching countries
  const countries = findCountries(lng, lat);
  
  if (countries.length === 0) {
    return {
      success: false,
      error: 'Coordinates not found in any country'
    };
  }
  
  // Use the first (smallest) country as primary match
  const primaryCountry = countries[0];
  const countryCode = primaryCountry.properties.ISO_A3;
  const countryInfo = countryEpsgData.countries[countryCode];
  
  if (!countryInfo) {
    return {
      success: false,
      error: `No EPSG data for country: ${countryCode}`,
      countryCode,
      countryName: primaryCountry.properties.NAME
    };
  }
  
  // Collect alternative matches (if any) with their EPSG codes
  const alternativeMatches = countries.slice(1)
    .map(country => {
      const code = country.properties.ISO_A3;
      if (!countryEpsgData) return null;
      const info = countryEpsgData.countries[code];
      if (!info) return null;
      
      return {
        countryCode: code,
        countryName: info.name,
        epsgCodes: info.epsgCodes,
        primaryEpsg: info.primary
      };
    })
    .filter(Boolean) as Array<{countryCode: string; countryName: string; epsgCodes: string[]; primaryEpsg: string}>;
  
  return {
    success: true,
    countryCode,
    countryName: countryInfo.name,
    epsgCodes: countryInfo.epsgCodes,
    primaryEpsg: countryInfo.primary,
    ...(alternativeMatches.length > 0 && { alternativeMatches })
  };
}

/**
 * Cleanup data from memory
 */
function cleanup(): void {
  countryEpsgData = null;
  geoJsonData = null;
  isDataLoaded = false;
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  
  try {
    switch (message.type) {
      case 'loadData': {
        await loadData(message.baseUrl);
        const response: ReadyResponse = {
          type: 'ready',
          success: true
        };
        self.postMessage(response);
        break;
      }
      
      case 'lookup': {
        const result = lookupEpsgCodes(message.lat, message.lng);
        const response: LookupResponse = {
          type: 'lookup-result',
          requestId: message.requestId,
          ...result
        };
        self.postMessage(response);
        break;
      }
      
      case 'shutdown': {
        cleanup();
        const response: ShutdownResponse = {
          type: 'shutdown-complete'
        };
        self.postMessage(response);
        break;
      }
      
      default:
        console.warn('Unknown message type:', (message as any).type);
    }
  } catch (error) {
    if (message.type === 'loadData') {
      const response: ReadyResponse = {
        type: 'ready',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      self.postMessage(response);
    } else if (message.type === 'lookup') {
      const response: LookupResponse = {
        type: 'lookup-result',
        requestId: message.requestId,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      self.postMessage(response);
    }
  }
};

// Signal that the worker is ready to receive initialization
console.log('EPSG Lookup Worker v2 initialized');
self.postMessage({ type: 'worker-initialized' });
