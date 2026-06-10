import proj4 from 'proj4';
import { parseShp, parseDbf } from 'shpjs';

function reprojectGeometry(geometry: GeoJSON.Geometry, project: (xy: [number, number]) => [number, number]): GeoJSON.Geometry {
  const map = (coords: unknown): unknown => {
    if (Array.isArray(coords) && typeof coords[0] === 'number') {
      return project(coords as [number, number]);
    }
    return (coords as unknown[]).map(map);
  };
  return { ...geometry, coordinates: map((geometry as { coordinates: unknown }).coordinates) } as GeoJSON.Geometry;
}

function isWgs84(prjText: string): boolean {
  return /GEOGCS\["[^"]*WGS[ _]?84/i.test(prjText) || /AUTHORITY\["EPSG","4326"\]\s*\]\s*$/i.test(prjText.trim());
}

/** Convert a shapefile (.shp + optional .dbf + optional .prj contents) into a GeoJSON FeatureCollection in WGS84. */
export function shapefileToGeoJSON(shpBuffer: ArrayBuffer, dbfBuffer: ArrayBuffer | null, prjText: string | null): GeoJSON.FeatureCollection {
  console.log('reading shp data');
  const geometries = parseShp(shpBuffer) as (GeoJSON.Geometry | null)[];
  const records = dbfBuffer ? parseDbf(dbfBuffer, undefined as unknown as ArrayBuffer) as Record<string, unknown>[] : [];

  const needsReproject = !!(prjText && !isWgs84(prjText));
  const converter = needsReproject ? proj4(prjText as string, 'EPSG:4326') : null;
  const project = converter ? (xy: [number, number]) => converter.forward(xy) as [number, number] : null;

  if (project) console.log('projecting...');
  console.log('converting to geojson');
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    if (!geometry) continue;
    features.push({
      type: 'Feature',
      geometry: project ? reprojectGeometry(geometry, project) : geometry,
      properties: records[i] ?? {},
    });
  }
  return { type: 'FeatureCollection', features };
}
