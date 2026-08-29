import proj4 from 'proj4';
import { parseShp, parseDbf } from 'shpjs';

/** Reprojects a geometry's coordinates in place to avoid doubling memory with a copy. */
function reprojectGeometryInPlace(geometry: GeoJSON.Geometry, project: (xy: [number, number]) => [number, number]): void {
  const visit = (coords: unknown): void => {
    const arr = coords as unknown[];
    if (typeof arr[0] === 'number') {
      const [x, y] = project(arr as [number, number]);
      arr[0] = x;
      arr[1] = y;
      return;
    }
    for (const item of arr) visit(item);
  };
  if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach((g) => reprojectGeometryInPlace(g, project));
  } else {
    visit((geometry as { coordinates: unknown }).coordinates);
  }
}

function isWgs84(prjText: string): boolean {
  return /GEOGCS\["[^"]*WGS[ _]?84/i.test(prjText) || /AUTHORITY\["EPSG","4326"\]\s*\]\s*$/i.test(prjText.trim());
}

/** Convert a shapefile (.shp + optional .dbf + optional .prj contents) into a GeoJSON FeatureCollection in WGS84. */
/**
 * Parse a shapefile in a dedicated Web Worker, so the (synchronous, CPU-heavy)
 * parsing/reprojection doesn't block the main thread. The buffers are
 * transferred (zero-copy) to the worker; the resulting FeatureCollection is
 * structured-cloned back.
 */
export function shapefileToGeoJSONInWorker(shpBuffer: ArrayBuffer, dbfBuffer: ArrayBuffer | null, prjText: string | null): Promise<GeoJSON.FeatureCollection> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/shapefile.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ success: boolean; data?: GeoJSON.FeatureCollection; error?: string }>) => {
      worker.terminate();
      if (e.data.success && e.data.data) resolve(e.data.data);
      else reject(new Error(e.data.error ?? 'shapefile worker failed'));
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(err.error ?? new Error(err.message));
    };
    const transfer: Transferable[] = [shpBuffer];
    if (dbfBuffer) transfer.push(dbfBuffer);
    worker.postMessage({ shpBuffer, dbfBuffer, prjText }, transfer);
  });
}

export function shapefileToGeoJSON(shpBuffer: ArrayBuffer, dbfBuffer: ArrayBuffer | null, prjText: string | null): GeoJSON.FeatureCollection {
  const geometries = parseShp(shpBuffer) as (GeoJSON.Geometry | null)[];
  const records = dbfBuffer ? parseDbf(dbfBuffer, undefined as unknown as ArrayBuffer) as Record<string, unknown>[] : [];

  const needsReproject = !!(prjText && !isWgs84(prjText));
  const converter = needsReproject ? proj4(prjText as string, 'EPSG:4326') : null;
  const project = converter ? (xy: [number, number]) => converter.forward(xy) as [number, number] : null;
  const features: GeoJSON.Feature[] = new Array(geometries.length);
  let count = 0;
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    geometries[i] = null; // drop reference so GC can reclaim as we go
    if (!geometry) continue;
    if (project) reprojectGeometryInPlace(geometry, project);
    features[count++] = {
      type: 'Feature',
      geometry,
      properties: records[i] ?? {},
    };
    records[i] = undefined as unknown as Record<string, unknown>;
  }
  features.length = count;
  return { type: 'FeatureCollection', features };
}
