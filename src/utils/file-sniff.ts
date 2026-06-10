import { ZipReader, BlobReader, BlobWriter } from '@zip.js/zip.js';

export interface FileSniffResult {
  /** Short machine-readable kind, e.g. 'geojson', 'topojson', 'style', 'webmapx-config',
   *  'csv', 'xlsx', 'gpx', 'kml', 'kmz', 'shapefile-zip', 'gpkg', 'geotiff', 'json', 'zip', 'unknown' */
  kind: string;
  /** Human-readable description for display */
  description: string;
  /** Set if the file should be rejected (too big, or unsupported) */
  rejected?: boolean;
  /** For zip archives that were scanned recursively: one entry per contained file */
  children?: { path: string; size: number; result: FileSniffResult }[];
}

const HEADER_BYTES = 8192;

/** Rough cap on what we consider "easily fits in memory" for in-browser parsing. */
export function maxAcceptableFileSize(): number {
  const deviceMemoryGB = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (typeof deviceMemoryGB === 'number' && deviceMemoryGB > 0) {
    return Math.min(deviceMemoryGB * 0.1 * 1e9, 500 * 1024 * 1024);
  }
  return 100 * 1024 * 1024;
}

function bytesEqual(buf: Uint8Array, offset: number, expected: number[]): boolean {
  if (buf.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buf[offset + i] !== expected[i]) return false;
  }
  return true;
}

const DELIMITERS = [',', ';', '\t', '|'];

/** True if text looks like decoded binary data (control chars / replacement chars from invalid UTF-8). */
function looksBinary(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // allow tab, LF, CR; reject other control chars and the U+FFFD replacement char
    if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0xfffd) {
      return true;
    }
  }
  return false;
}

function detectCsv(text: string): FileSniffResult | null {
  if (looksBinary(text)) return null;

  let lines = text.split(/\r?\n/).filter((l) => l.length > 0).slice(0, 5);
  // the last line may be truncated by the header-byte sample; ignore it if there's more than one
  if (lines.length > 1) lines = lines.slice(0, -1);
  const firstLine = lines[0] ?? '';
  if (!firstLine) return null;

  let bestDelim: string | null = null;
  let bestCount = 0;
  for (const delim of DELIMITERS) {
    const count = firstLine.split(delim).length - 1;
    if (count > bestCount) {
      bestCount = count;
      bestDelim = delim;
    }
  }
  if (!bestDelim || bestCount < 1) return null;

  // Require a consistent column count across the first few lines.
  for (const line of lines) {
    if (line.split(bestDelim).length - 1 !== bestCount) return null;
  }

  const delimName = { ',': 'comma', ';': 'semicolon', '\t': 'tab', '|': 'pipe' }[bestDelim];
  return {
    kind: 'csv',
    description: `CSV (${delimName}-delimited, ${bestCount + 1} columns)`,
  };
}

function classifyJson(text: string): FileSniffResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { kind: 'json', description: 'JSON (could not parse)' };
  }
  if (typeof data !== 'object' || data === null) {
    return { kind: 'json', description: 'JSON (unrecognized structure)' };
  }
  const obj = data as Record<string, unknown>;
  const type = obj.type;
  if (type === 'Topology' && obj.objects && obj.arcs) {
    return { kind: 'topojson', description: 'TopoJSON' };
  }
  if (
    type === 'FeatureCollection' ||
    type === 'Feature' ||
    type === 'Point' || type === 'MultiPoint' ||
    type === 'LineString' || type === 'MultiLineString' ||
    type === 'Polygon' || type === 'MultiPolygon' ||
    type === 'GeometryCollection'
  ) {
    return { kind: 'geojson', description: `GeoJSON (${type})` };
  }
  if (obj.sources && obj.layers) {
    return { kind: 'maplibre-style', description: 'MapLibre style.json' };
  }
  if (typeof obj.version !== 'undefined' && obj.project && obj.map) {
    return { kind: 'webmapx-config', description: 'webmapx config.json' };
  }
  return { kind: 'json', description: 'JSON (unrecognized structure)' };
}

async function classifyZip(blob: Blob): Promise<FileSniffResult> {
  type ZipEntry = { filename: string; directory: boolean; getData?: (writer: BlobWriter) => Promise<Blob> };
  let entries: ZipEntry[];
  try {
    const reader = new ZipReader(new BlobReader(blob));
    entries = await reader.getEntries() as ZipEntry[];
    await reader.close();
  } catch {
    return { kind: 'zip', description: 'ZIP archive (could not list contents)', rejected: true };
  }
  const names = entries.map((e) => e.filename.toLowerCase());
  if (names.some((n) => n.startsWith('xl/'))) {
    return { kind: 'xlsx', description: 'Excel workbook (.xlsx)' };
  }
  if (names.includes('doc.kml') || names.some((n) => n.endsWith('.kml'))) {
    return { kind: 'kmz', description: 'KMZ (zipped KML) - not yet supported', rejected: true };
  }

  // Generic zip: recursively sniff each contained file.
  const maxSize = maxAcceptableFileSize();
  const children: { path: string; size: number; result: FileSniffResult }[] = [];
  for (const entry of entries) {
    if (entry.directory || !entry.getData) continue;
    let entryBlob: Blob;
    try {
      entryBlob = await entry.getData(new BlobWriter());
    } catch {
      children.push({ path: entry.filename, size: 0, result: { kind: 'unknown', description: 'Could not read entry', rejected: true } });
      continue;
    }
    if (entryBlob.size > maxSize) {
      children.push({
        path: entry.filename,
        size: entryBlob.size,
        result: {
          kind: 'too-large',
          description: `File too large (${(entryBlob.size / 1e6).toFixed(1)} MB, limit ${(maxSize / 1e6).toFixed(0)} MB)`,
          rejected: true,
        },
      });
      continue;
    }
    const result = await sniffBlob(entryBlob);
    children.push({ path: entry.filename, size: entryBlob.size, result });
  }
  return {
    kind: 'zip',
    description: `ZIP archive (${entries.length} entries)`,
    children,
  };
}

function detectXml(text: string): FileSniffResult | null {
  const sample = text.slice(0, 1024);
  if (/<gpx[\s>]/i.test(sample)) return { kind: 'gpx', description: 'GPX track/route' };
  if (/<kml[\s>]/i.test(sample)) return { kind: 'kml', description: 'KML' };
  if (/<qgis[\s>]/i.test(sample)) return { kind: 'qml', description: 'QGIS layer style (.qml)' };
  if (/^\s*<\?xml/i.test(sample) || /^\s*</.test(sample)) {
    return { kind: 'xml', description: 'XML (unrecognized format)', rejected: true };
  }
  return null;
}

/** True if the blob starts with a ZIP local-file or end-of-central-directory signature. */
export async function isZip(blob: Blob): Promise<boolean> {
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return bytesEqual(header, 0, [0x50, 0x4b, 0x03, 0x04]) || bytesEqual(header, 0, [0x50, 0x4b, 0x05, 0x06]);
}

/** Sniff a blob's content type assuming its size has already been cleared. */
export async function sniffBlob(blob: Blob): Promise<FileSniffResult> {
  const headerBuf = new Uint8Array(await blob.slice(0, HEADER_BYTES).arrayBuffer());

  if (bytesEqual(headerBuf, 0, [0x50, 0x4b, 0x03, 0x04]) || bytesEqual(headerBuf, 0, [0x50, 0x4b, 0x05, 0x06])) {
    return classifyZip(blob);
  }
  if (bytesEqual(headerBuf, 0, [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65])) {
    return { kind: 'gpkg', description: 'GeoPackage (SQLite) - not yet supported', rejected: true };
  }
  if (bytesEqual(headerBuf, 0, [0x49, 0x49, 0x2a, 0x00]) || bytesEqual(headerBuf, 0, [0x4d, 0x4d, 0x00, 0x2a])) {
    return { kind: 'geotiff', description: 'GeoTIFF - not yet supported', rejected: true };
  }
  if (bytesEqual(headerBuf, 0, [0xd0, 0xcf, 0x11, 0xe0])) {
    return { kind: 'xls', description: 'Excel workbook (.xls, legacy) - not yet supported', rejected: true };
  }
  if (bytesEqual(headerBuf, 0, [0x00, 0x00, 0x27, 0x0a])) {
    return { kind: 'shp', description: 'Shapefile geometry (.shp)' };
  }

  const text = new TextDecoder('utf-8', { fatal: false }).decode(headerBuf).trim();
  const xml = detectXml(text);
  if (xml) return xml;

  if (text.startsWith('{') || text.startsWith('[')) {
    const fullText = blob.size <= headerBuf.length ? text : await blob.text();
    return classifyJson(fullText);
  }

  const csv = detectCsv(text);
  if (csv) return csv;

  return { kind: 'unknown', description: 'Unrecognized file type', rejected: true };
}

/**
 * Determine a dropped file's content type by sniffing its header and (for small
 * text-like files) its full contents, without reading more than necessary.
 * ZIP archives (that aren't a recognized container format like xlsx/kmz) are
 * scanned recursively, including nested directories and nested zips.
 */
export async function sniffFile(file: File): Promise<FileSniffResult> {
  const maxSize = maxAcceptableFileSize();
  if (file.size > maxSize) {
    return {
      kind: 'too-large',
      description: `File too large (${(file.size / 1e6).toFixed(1)} MB, limit ${(maxSize / 1e6).toFixed(0)} MB)`,
      rejected: true,
    };
  }
  return sniffBlob(file);
}
