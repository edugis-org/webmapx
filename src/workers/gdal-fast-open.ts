// src/workers/gdal-fast-open.ts
//
// Opening a dropped file in the spatial worker without paying for a feature
// count nobody asked for. Same approach as PolderGIS (`src/core/convert.ts`,
// `openDataset`/`datasetInfo`), measured there on the 7.8 GB BAG GeoPackage:
// 80 s → 6 s to open.
//
// gdal3.js's `Gdal.open()` runs `ogrinfo -json` after opening, and that counts
// every feature of every layer. A GeoPackage without `gpkg_ogr_contents` (GDAL
// writes it, QGIS and many other producers do not) is then read in full, and
// `Gdal.getInfo()` counts the same way again. webmapx opened a multi-layer file
// twice — once to list its layers, once per layer to convert it — so a file
// was scanned three times before the first layer was converted, and picking a
// 50-feature layer from a large GeoPackage took as long as listing it.
//
// Worker-only (WORKERFS); `openFast` answers undefined anywhere else and the
// caller falls back to `Gdal.open`.

// Worker-only global; the project's DOM lib does not declare it.
declare const FileReaderSync: { new (): { readAsArrayBuffer(blob: Blob): ArrayBuffer } };

type Ccall = (name: string, returnType: string | null, argTypes: string[], args: unknown[]) => any;

interface GdalModule {
  FS: {
    mkdir(path: string): void;
    rmdir(path: string): void;
    mount(type: unknown, opts: unknown, mountpoint: string): void;
    unmount(mountpoint: string): void;
    unlink(path: string): void;
  };
  WORKERFS: { stream_ops: Record<string, any> };
  ccall: Ccall;
}

/** A dataset handle as gdal3.js's own functions (ogr2ogr, ogrinfo, close) accept it. */
export interface FastDataset {
  pointer: number;
  path: string;
  type: 'vector' | 'raster';
  /** The WORKERFS directory this file is mounted in, removed by `closeFast`. */
  mountDir: string;
}

export interface LayerCount {
  name: string;
  featureCount: number;
  /** True when the count is the highest FID rather than a count (GeoPackage without stored counts). */
  estimated?: boolean;
}

interface GdalLike {
  Module?: unknown;
  ogr2ogr(ds: any, args: string[], outputName?: string): Promise<string | { local: string; real: string }>;
  ogrinfo(ds: any, args?: string[]): Promise<unknown>;
  getFileBytes(path: any): Promise<Uint8Array>;
  close(ds: any): Promise<void>;
}

function moduleOf(gdal: GdalLike): GdalModule | undefined {
  const m = gdal.Module as Partial<GdalModule> | undefined;
  return m?.FS && m.WORKERFS && m.ccall ? (m as GdalModule) : undefined;
}

const inWorker = (): boolean => typeof (globalThis as { importScripts?: unknown }).importScripts === 'function';

let mountSeq = 0;

/**
 * Opens one File with `GDALOpenEx`, mounted on its own WORKERFS directory (so
 * several can be open at once and gdal3.js's single input mount is untouched).
 * Undefined when not in a worker or GDAL cannot open it — the caller then uses
 * `Gdal.open`, which reports why.
 */
export function openFast(gdal: GdalLike, file: File): FastDataset | undefined {
  const M = moduleOf(gdal);
  if (!M || !inWorker()) return undefined;
  const mountDir = `/wx-in-${++mountSeq}`;
  M.FS.mkdir(mountDir);
  M.FS.mount(M.WORKERFS, { files: [file] }, mountDir);
  const pointer = M.ccall('GDALOpenEx', 'number', ['string', 'number', 'number', 'number', 'number'], [`${mountDir}/${file.name}`, 0, 0, 0, 0]) as number;
  if (!pointer) {
    unmount(M, mountDir);
    return undefined;
  }
  const raster = (M.ccall('GDALGetRasterCount', 'number', ['number'], [pointer]) as number) > 0
    && (M.ccall('GDALDatasetGetLayerCount', 'number', ['number'], [pointer]) as number) === 0;
  return { pointer, path: file.name, type: raster ? 'raster' : 'vector', mountDir };
}

/** Closes a dataset from `openFast` and removes its mount. */
export async function closeFast(gdal: GdalLike, ds: FastDataset): Promise<void> {
  await gdal.close(ds);
  const M = moduleOf(gdal);
  if (M) unmount(M, ds.mountDir);
}

function unmount(M: GdalModule, dir: string): void {
  try { M.FS.unmount(dir); } catch { /* not mounted */ }
  try { M.FS.rmdir(dir); } catch { /* not there */ }
}

/** Rows of an SQL query as plain objects, or undefined when the query fails (a table that is not there). */
async function sqlRows(gdal: GdalLike, ds: FastDataset, sql: string, tag: string): Promise<Record<string, unknown>[] | undefined> {
  const M = moduleOf(gdal);
  const out = `/output/${tag}.geojson`;
  // A failed run leaves its output behind, and the next would then fail on it.
  try { M?.FS.unlink(out); } catch { /* none */ }
  try {
    const path = await gdal.ogr2ogr(ds, ['-f', 'GeoJSON', '-sql', sql], tag);
    const bytes = await gdal.getFileBytes(path);
    try { M?.FS.unlink(out); } catch { /* gone */ }
    const fc = JSON.parse(new TextDecoder().decode(bytes)) as { features?: { properties?: Record<string, unknown> }[] };
    return (fc.features ?? []).map((f) => f.properties ?? {});
  } catch {
    try { M?.FS.unlink(out); } catch { /* none */ }
    return undefined;
  }
}

const quoteIdent = (name: string): string => `"${name.replace(/"/g, '""')}"`;

/**
 * The vector layers of a dataset and their feature counts, without a full scan.
 * A GeoPackage's counts come from `gpkg_ogr_contents`; a layer it does not list
 * gets its highest FID instead (instant on SQLite, and exact unless features
 * were deleted), marked `estimated`. Other formats are counted by their driver,
 * which for every format webmapx imports is either stored or already parsed.
 */
export async function listLayers(gdal: GdalLike, ds: FastDataset): Promise<{ driver: string; layers: LayerCount[] }> {
  const M = moduleOf(gdal)!;
  const call = M.ccall;
  const driver = call('GDALGetDescription', 'string', ['number'], [call('GDALGetDatasetDriver', 'number', ['number'], [ds.pointer])]) as string;
  const n = call('GDALDatasetGetLayerCount', 'number', ['number'], [ds.pointer]) as number;
  const handles = Array.from({ length: n }, (_, i) => call('GDALDatasetGetLayer', 'number', ['number', 'number'], [ds.pointer, i]) as number);
  const names = handles.map((h) => call('OGR_L_GetName', 'string', ['number'], [h]) as string);

  const counts = new Map<string, LayerCount>();
  if (driver === 'GPKG') {
    // Asked first: querying a missing table makes GDAL print an error, and its absence is the normal case here.
    const hasCounts = (await sqlRows(gdal, ds, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'gpkg_ogr_contents'", 'wx_gpkg_has_counts'))?.length;
    for (const row of (hasCounts ? await sqlRows(gdal, ds, 'SELECT table_name, feature_count FROM gpkg_ogr_contents', 'wx_gpkg_counts') : undefined) ?? []) {
      if (typeof row.feature_count === 'number') counts.set(String(row.table_name), { name: String(row.table_name), featureCount: row.feature_count });
    }
    // The FID column's name (OGR_L_GetFIDColumn is not exported by gdal3.js); -nocount keeps this cheap.
    const missing = names.filter((name) => !counts.has(name));
    const info = missing.length
      ? (await gdal.ogrinfo(ds, ['-so', '-al', '-nocount', '-noextent', '-json']).catch(() => null)) as { layers?: { name: string; fidColumnName?: string }[] } | null
      : null;
    for (let i = 0; i < n; i++) {
      if (counts.has(names[i])) continue;
      const fid = info?.layers?.find((l) => l.name === names[i])?.fidColumnName || 'fid';
      const rows = await sqlRows(gdal, ds, `SELECT MAX(${quoteIdent(fid)}) AS n FROM ${quoteIdent(names[i])}`, 'wx_gpkg_maxfid');
      const v = rows?.[0]?.n;
      if (typeof v === 'number') counts.set(names[i], { name: names[i], featureCount: v, estimated: true });
      else if (rows) counts.set(names[i], { name: names[i], featureCount: 0 }); // MAX over no rows is NULL: empty
    }
  }
  const layers = names.map((name, i) => counts.get(name)
    ?? { name, featureCount: call('OGR_L_GetFeatureCount', 'number', ['number', 'number'], [handles[i], 1]) as number });
  return { driver, layers };
}

/**
 * Reads ahead on WORKERFS: GDAL reads a file in small pieces (SQLite pages,
 * text lines), and WORKERFS turns each one into a Blob.slice + FileReaderSync
 * of its own, whose fixed cost dominates. With this a miss reads `blockBytes`
 * at once and later reads are served from that window. PolderGIS measured it
 * in the browser: GeoPackage 2.8×, GeoJSON 2.3×, shapefile 28×, CSV 29×.
 * Patches WORKERFS for every file opened afterwards in this worker; installing
 * twice is harmless.
 */
export function installReadCache(gdal: GdalLike, blockBytes = 4 * 1024 * 1024): boolean {
  const M = moduleOf(gdal);
  if (!M) return false;
  const ops = M.WORKERFS.stream_ops;
  const original = ops.__wxOriginalRead ?? ops.read;
  ops.__wxOriginalRead = original;
  ops.read = (stream: any, buffer: Uint8Array, offset: number, length: number, position: number): number => {
    const node = stream.node;
    const blob: Blob = node.contents;
    if (position >= blob.size) return 0;
    if (length > blockBytes) return original(stream, buffer, offset, length, position);
    let window = node.__wxReadWindow as { start: number; bytes: Uint8Array } | undefined;
    if (!window || position < window.start || position + length > window.start + window.bytes.length) {
      const end = Math.min(blob.size, position + blockBytes);
      window = { start: position, bytes: new Uint8Array(new FileReaderSync().readAsArrayBuffer(blob.slice(position, end))) };
      node.__wxReadWindow = window;
    }
    const count = Math.min(length, window.start + window.bytes.length - position);
    buffer.set(window.bytes.subarray(position - window.start, position - window.start + count), offset);
    return count;
  };
  return true;
}
