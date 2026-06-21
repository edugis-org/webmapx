import { ZipReader, BlobReader, BlobWriter } from '@zip.js/zip.js';
import { isZip, sniffBlob } from './file-sniff';
import { parseQmlStyle, type QmlStyle } from './qml-style';
import type { CompositeStyleLayerConfig, SubLayerSpec } from '../config/types';

export interface NamedBlob {
  name: string;
  blob: Blob;
}

function basename(path: string): string {
  return path.split('/').pop() || path;
}

function stripExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}

/** Sanitize a filename into something safe to use as part of a layer/source id. */
function sanitizeId(name: string): string {
  return stripExtension(name).replace(/[^a-zA-Z0-9_-]/g, '-');
}

async function extractZipEntries(blob: Blob): Promise<NamedBlob[]> {
  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();
  const result: NamedBlob[] = [];
  for (const entry of entries) {
    if (entry.directory || !entry.getData) continue;
    result.push({ name: basename(entry.filename), blob: await entry.getData(new BlobWriter()) });
  }
  await reader.close();
  return result;
}

/**
 * Groups dropped files for layer-import purposes:
 * - each top-level zip's contents become their own group
 * - all non-zip top-level files are grouped together as one additional group
 */
export async function groupDroppedFiles(files: File[]): Promise<NamedBlob[][]> {
  const groups: NamedBlob[][] = [];
  const loose: NamedBlob[] = [];
  for (const file of files) {
    if (await isZip(file)) {
      groups.push(...splitZipEntriesByLayer(await extractZipEntries(file)));
    } else {
      loose.push({ name: file.name, blob: file });
    }
  }
  if (loose.length > 0) groups.push(loose);
  return groups;
}

/**
 * Splits zip entries into one group per `<name>_style.json` (multi-layer save format),
 * each paired with its matching `<name>.geojson`. Entries that don't belong to any
 * `<name>_style.json` are returned as a single trailing group (legacy single-style.json
 * or loose-geojson zips).
 */
function splitZipEntriesByLayer(entries: NamedBlob[]): NamedBlob[][] {
  const styleEntries = entries.filter((e) => /_style\.json$/i.test(e.name));
  if (styleEntries.length === 0) return [entries];

  const groups: NamedBlob[][] = [];
  const used = new Set<NamedBlob>();
  for (const styleEntry of styleEntries) {
    const base = styleEntry.name.replace(/_style\.json$/i, '').toLowerCase();
    const group: NamedBlob[] = [styleEntry];
    used.add(styleEntry);
    for (const entry of entries) {
      if (used.has(entry)) continue;
      if (stripExtension(entry.name).toLowerCase() === base) {
        group.push(entry);
        used.add(entry);
      }
    }
    groups.push(group);
  }
  const rest = entries.filter((e) => !used.has(e));
  if (rest.length > 0) groups.push(rest);
  return groups;
}

const DEFAULT_COLOR = '#444444';

/** Collect the set of GeoJSON geometry types present (recursing into GeometryCollections). */
function collectGeometryTypes(data: GeoJSON.FeatureCollection): Set<string> {
  const types = new Set<string>();
  const visit = (geometry: GeoJSON.Geometry | null | undefined) => {
    if (!geometry) return;
    types.add(geometry.type);
    if (geometry.type === 'GeometryCollection') {
      geometry.geometries.forEach(visit);
    }
  };
  for (const feature of data.features) visit(feature.geometry);
  return types;
}

function defaultLayersForSource(prefix: string, fileBase: string, sourceKey: string, data: GeoJSON.FeatureCollection, qmlStyle?: QmlStyle | null): SubLayerSpec[] {
  const idPrefix = `${prefix}${fileBase}`;
  const types = collectGeometryTypes(data);
  const hasPolygon = types.has('Polygon') || types.has('MultiPolygon');
  const hasLine = types.has('LineString') || types.has('MultiLineString');
  const hasPoint = types.has('Point') || types.has('MultiPoint');

  const layers: SubLayerSpec[] = [];
  if (hasPolygon) {
    layers.push({
      id: `${idPrefix}-fill`,
      type: 'fill',
      source: sourceKey,
      filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
      paint: qmlStyle?.type === 'fill' ? qmlStyle.paint : { 'fill-color': DEFAULT_COLOR, 'fill-opacity': 0.3 },
    });
  }
  const polygonFillHasOutline = hasPolygon && qmlStyle?.type === 'fill' && 'fill-outline-color' in qmlStyle.paint;
  if (hasLine || (hasPolygon && !polygonFillHasOutline)) {
    layers.push({
      id: `${idPrefix}-line`,
      type: 'line',
      source: sourceKey,
      filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'], true, false],
      paint: qmlStyle?.type === 'line' ? qmlStyle.paint : { 'line-color': DEFAULT_COLOR, 'line-width': 2 },
    });
  }
  if (hasPoint) {
    layers.push({
      id: `${idPrefix}-circle`,
      type: 'circle',
      source: sourceKey,
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      paint: qmlStyle?.type === 'circle' ? qmlStyle.paint : { 'circle-color': DEFAULT_COLOR, 'circle-radius': 8 },
    });
  }
  return layers;
}

const LON_KEYS = [
  'lon', 'lng', 'longitude', 'long', 'x',
  // Dutch
  'lengtegraad', 'lengte',
  // German
  'längengrad', 'laengengrad', 'länge', 'laenge',
  // French (same as English)
  // Spanish
  'longitud',
];
const LAT_KEYS = [
  'lat', 'latitude', 'y',
  // Dutch
  'breedtegraad', 'breedte',
  // German
  'breitengrad', 'breite',
  // French (same as English)
  // Spanish
  'latitud',
];

function findColumn(keys: string[], candidates: string[]): string | undefined {
  return keys.find((k) => candidates.some((c) => c.toLowerCase() === k));
}

/** Convert PapaParse rows to a GeoJSON FeatureCollection of Points using coordinate columns. */
function csvToGeoJSON(rows: Record<string, unknown>[], filename: string): GeoJSON.FeatureCollection | null {
  if (rows.length === 0) return null;
  const columns = Object.keys(rows[0]);
  const lonKey = findColumn(LON_KEYS, columns);
  const latKey = findColumn(LAT_KEYS, columns);
  if (!lonKey || !latKey) {
    console.warn(`[csv-import] "${filename}": no coordinate columns found. Tried lon=${LON_KEYS.join('/')}, lat=${LAT_KEYS.join('/')}`);
    return null;
  }
  const features: GeoJSON.Feature[] = [];
  for (const row of rows) {
    const lon = Number(row[lonKey]);
    const lat = Number(row[latKey]);
    if (!isFinite(lon) || !isFinite(lat)) continue;
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (k !== lonKey && k !== latKey) properties[k] = v;
    }
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties });
  }
  if (features.length === 0) return null;
  return { type: 'FeatureCollection', features };
}

/**
 * Builds a composite `type: 'style'` layer config from a group of dropped files.
 * Currently supports: one or more GeoJSON files, optionally styled by an
 * accompanying MapLibre-style-spec `style.json` (whose `sources[*].data`
 * filename references are matched against the GeoJSON files in the group).
 *
 * Returns null if the group doesn't contain any recognizable GeoJSON.
 */
export async function buildLayerConfigFromGroup(group: NamedBlob[]): Promise<CompositeStyleLayerConfig | null> {
  const geojsonFiles: { name: string; data: GeoJSON.FeatureCollection }[] = [];
  let styleFile: { name: string; style: Record<string, unknown> } | null = null;
  const shpFiles = new Map<string, NamedBlob>();
  const dbfFiles = new Map<string, NamedBlob>();
  const prjFiles = new Map<string, NamedBlob>();
  let qmlStyle: QmlStyle | null = null;

  for (const item of group) {
    const sniff = await sniffBlob(item.blob);
    const lowerName = item.name.toLowerCase();
    // Extension-based checks for well-known companion files must come before
    // content-sniff checks — .prj WKT strings are comma-rich and get mis-detected as CSV.
    if (lowerName.endsWith('.dbf')) {
      dbfFiles.set(stripExtension(lowerName), item);
    } else if (lowerName.endsWith('.prj')) {
      prjFiles.set(stripExtension(lowerName), item);
    } else if (sniff.kind === 'geojson') {
      try {
        geojsonFiles.push({ name: item.name, data: JSON.parse(await item.blob.text()) });
      } catch {
        // skip unparsable file
      }
    } else if (sniff.kind === 'topojson') {
      try {
        const topology = JSON.parse(await item.blob.text());
        const { feature } = await import('topojson-client');
        const objects = topology.objects as Record<string, unknown>;
        for (const [name, object] of Object.entries(objects)) {
          const data = feature(topology, object as never) as unknown as GeoJSON.FeatureCollection;
          geojsonFiles.push({ name: Object.keys(objects).length > 1 ? `${item.name}#${name}` : item.name, data });
        }
      } catch {
        // skip unparsable file
      }
    } else if (sniff.kind === 'maplibre-style' && !styleFile) {
      try {
        styleFile = { name: item.name, style: JSON.parse(await item.blob.text()) };
      } catch {
        // skip unparsable style
      }
    } else if (sniff.kind === 'gpx') {
      try {
        const { gpx } = await import('@tmcw/togeojson');
        const xml = new DOMParser().parseFromString(await item.blob.text(), 'text/xml');
        geojsonFiles.push({ name: item.name, data: gpx(xml) as GeoJSON.FeatureCollection });
      } catch { /* skip */ }
    } else if (sniff.kind === 'kml') {
      try {
        const { kml } = await import('@tmcw/togeojson');
        const xml = new DOMParser().parseFromString(await item.blob.text(), 'text/xml');
        geojsonFiles.push({ name: item.name, data: kml(xml) as GeoJSON.FeatureCollection });
      } catch { /* skip */ }
    } else if (sniff.kind === 'kmz') {
      try {
        const { kml } = await import('@tmcw/togeojson');
        const entries = await extractZipEntries(item.blob);
        const kmlEntry = entries.find((e) => e.name.toLowerCase().endsWith('.kml'));
        if (kmlEntry) {
          const xml = new DOMParser().parseFromString(await kmlEntry.blob.text(), 'text/xml');
          geojsonFiles.push({ name: item.name, data: kml(xml) as GeoJSON.FeatureCollection });
        }
      } catch { /* skip */ }
    } else if (sniff.kind === 'csv') {
      try {
        const Papa = (await import('papaparse')).default;
        const parsed = Papa.parse(await item.blob.text(), { header: true, skipEmptyLines: true, dynamicTyping: true });
        const data = csvToGeoJSON(parsed.data as Record<string, unknown>[], item.name);
        if (data) geojsonFiles.push({ name: item.name, data });
      } catch { /* skip */ }
    } else if (sniff.kind === 'shp' && lowerName.endsWith('.shp')) {
      shpFiles.set(stripExtension(lowerName), item);
    } else if (sniff.kind === 'qml') {
      console.log('parsing qml style');
      qmlStyle = parseQmlStyle(await item.blob.text());
      console.log('style result:', JSON.stringify(qmlStyle));
    }
  }

  if (shpFiles.size > 0) {
    const { shapefileToGeoJSONInWorker } = await import('./shapefile');
    for (const [base, shp] of shpFiles) {
      const dbf = dbfFiles.get(base);
      const prj = prjFiles.get(base);
      try {
        const data = await shapefileToGeoJSONInWorker(
          await shp.blob.arrayBuffer(),
          dbf ? await dbf.blob.arrayBuffer() : null,
          prj ? await prj.blob.text() : null
        );
        geojsonFiles.push({ name: shp.name, data });
      } catch (error) {
        console.error(`[dropped-layer-builder] failed to parse shapefile "${shp.name}"`, error);
      }
    }
  }

  if (geojsonFiles.length === 0) return null;

  const baseId = sanitizeId(
    typeof styleFile?.style.id === 'string' ? styleFile.style.id : geojsonFiles[0].name
  );
  const prefix = `${baseId}:`;

  // Map sanitized geojson filename (with and without extension) -> prefixed source key + data.
  const sourcesByFile = new Map<string, { sourceKey: string; data: GeoJSON.FeatureCollection }>();
  for (const file of geojsonFiles) {
    const fileBase = sanitizeId(file.name);
    const sourceKey = `${prefix}${fileBase}`;
    const entry = { sourceKey, data: file.data };
    sourcesByFile.set(file.name.toLowerCase(), entry);
    sourcesByFile.set(stripExtension(file.name).toLowerCase(), entry);
    sourcesByFile.set(fileBase.toLowerCase(), entry);
  }

  const sources: Record<string, unknown> = {};
  let layers: SubLayerSpec[];

  if (styleFile) {
    const styleSources = (styleFile.style.sources as Record<string, { type?: string; data?: unknown } & Record<string, unknown>>) ?? {};
    const sourceKeyMap = new Map<string, string>();
    for (const [key, source] of Object.entries(styleSources)) {
      // Deny raster sources - dropped raster layers are not supported.
      if (source.type === 'raster' || source.type === 'raster-dem') continue;
      const dataRef = typeof source.data === 'string' ? sourcesByFile.get(source.data.toLowerCase()) : undefined;
      if (dataRef) {
        sources[dataRef.sourceKey] = { ...source, data: dataRef.data };
        sourceKeyMap.set(key, dataRef.sourceKey);
      } else {
        const newKey = `${prefix}${sanitizeId(key)}`;
        sources[newKey] = source;
        sourceKeyMap.set(key, newKey);
      }
    }
    const styleLayers = (styleFile.style.layers as SubLayerSpec[]) ?? [];
    layers = styleLayers
      // Deny raster/hillshade layers and any layer whose source was dropped above.
      .filter((layer) => layer.type !== 'raster' && layer.type !== 'hillshade' && (!layer.source || sourceKeyMap.has(layer.source)))
      .map((layer) => ({
        ...layer,
        id: `${prefix}${sanitizeId(layer.id ?? layer.type)}`,
        source: layer.source ? sourceKeyMap.get(layer.source) ?? layer.source : layer.source,
      }));
  } else {
    layers = [];
    for (const file of geojsonFiles) {
      const fileBase = sanitizeId(file.name);
      const sourceKey = `${prefix}${fileBase}`;
      sources[sourceKey] = { type: 'geojson', data: file.data };
      layers.push(...defaultLayersForSource(prefix, fileBase, sourceKey, file.data, qmlStyle));
    }
  }

  const styleMetadata = (styleFile?.style.metadata as Record<string, unknown> | undefined) ?? {};

  return {
    id: baseId,
    type: 'style',
    version: 8,
    title: typeof styleFile?.style.title === 'string' ? styleFile.style.title as string : geojsonFiles[0].name,
    metadata: { ...styleMetadata, dynamic: true },
    sources,
    layers,
  };
}
