import proj4 from 'proj4';
import { asyncBufferFromUrl, cachedAsyncBuffer, parquetMetadataAsync, parquetReadObjects } from 'hyparquet';
import type { AsyncBuffer, FileMetaData } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import { EPSG_DEFS } from './epsg-definitions';

/**
 * GeoParquet -> GeoJSON, read in the browser with hyparquet.
 *
 * hyparquet already decodes a WKB column named in the file's `geo` metadata into
 * GeoJSON geometry, so what is left here is choosing the geometry column,
 * reprojecting to WGS84 and making the other columns safe for a GeoJSON source:
 * INT64 arrives as BigInt, which neither JSON nor MapLibre's worker accepts.
 *
 * Everything is read into memory. That is what the drop path does for every
 * other format, and it is fine for the sizes it accepts; a file too large for
 * that wants its PMTiles twin, not a cleverer reader.
 */

/** The parts of GeoParquet's `geo` metadata this reader uses. */
interface GeoMetadata {
    primary_column?: string;
    columns?: Record<string, {
        encoding?: string;
        /** PROJJSON; absent means OGC:CRS84, null means unknown. */
        crs?: { id?: { authority?: string; code?: string | number } } | null;
    }>;
}

export interface GeoParquetInfo {
    geometryColumn: string;
    /** `EPSG:<code>` or `OGC:CRS84`; null when the file declares the CRS unknown. */
    crs: string | null;
    rowCount: number;
}

function readGeoMetadata(metadata: FileMetaData): GeoMetadata | null {
    const value = metadata.key_value_metadata?.find(({ key }) => key === 'geo')?.value;
    if (!value) return null;
    try {
        return JSON.parse(value) as GeoMetadata;
    } catch {
        return null;
    }
}

export function describeGeoParquet(metadata: FileMetaData): GeoParquetInfo {
    const geo = readGeoMetadata(metadata);
    if (!geo?.columns) throw new Error('Parquet file has no GeoParquet "geo" metadata');
    const geometryColumn = geo.primary_column && geo.columns[geo.primary_column]
        ? geo.primary_column
        : Object.keys(geo.columns)[0];
    const column = geo.columns[geometryColumn];
    if (!column) throw new Error('GeoParquet metadata names no geometry column');
    if (column.encoding !== 'WKB') {
        throw new Error(`GeoParquet geometry encoding "${column.encoding}" is not supported (only WKB)`);
    }
    let crs: string | null;
    if (column.crs === undefined) crs = 'OGC:CRS84';
    else if (column.crs === null) crs = null;
    else {
        const id = column.crs.id;
        crs = id?.authority && id.code !== undefined ? `${id.authority}:${id.code}` : null;
    }
    return { geometryColumn, crs, rowCount: Number(metadata.num_rows) };
}

function isWgs84(crs: string | null): boolean {
    return crs === null || crs === 'OGC:CRS84' || crs === 'EPSG:4326';
}

function projectorFor(crs: string): (xy: [number, number]) => [number, number] {
    const match = /^EPSG:(\d+)$/i.exec(crs);
    const code = match?.[1];
    const definition = code && (EPSG_DEFS[code] ?? (proj4.defs(`EPSG:${code}`) ? `EPSG:${code}` : undefined));
    if (!definition) throw new Error(`GeoParquet CRS ${crs} is not known here, cannot reproject to WGS84`);
    const converter = proj4(definition, 'EPSG:4326');
    return (xy) => converter.forward(xy) as [number, number];
}

function reprojectInPlace(geometry: GeoJSON.Geometry, project: (xy: [number, number]) => [number, number]): void {
    if (geometry.type === 'GeometryCollection') {
        geometry.geometries.forEach((g) => reprojectInPlace(g, project));
        return;
    }
    const visit = (coords: unknown[]): void => {
        if (typeof coords[0] === 'number') {
            const [x, y] = project(coords as [number, number]);
            coords[0] = x;
            coords[1] = y;
            return;
        }
        for (const item of coords) visit(item as unknown[]);
    };
    visit((geometry as { coordinates: unknown[] }).coordinates);
}

/** A column value as something JSON and MapLibre can carry. */
function toPropertyValue(value: unknown): unknown {
    if (typeof value === 'bigint') {
        return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
            ? Number(value)
            : value.toString();
    }
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Uint8Array) return undefined; // raw bytes mean nothing on a map
    if (Array.isArray(value)) return value.map(toPropertyValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPropertyValue(v)]));
    }
    return value;
}

/** Read a GeoParquet file into a WGS84 FeatureCollection. Rows without geometry are dropped. */
export async function geoParquetToGeoJSON(source: ArrayBuffer | AsyncBuffer): Promise<GeoJSON.FeatureCollection> {
    const file: AsyncBuffer = source instanceof ArrayBuffer ? source : cachedAsyncBuffer(source);
    const metadata = await parquetMetadataAsync(file);
    const { geometryColumn, crs } = describeGeoParquet(metadata);
    const project = isWgs84(crs) ? null : projectorFor(crs as string);

    const rows = await parquetReadObjects({ file, metadata, compressors }) as Record<string, unknown>[];
    const features: GeoJSON.Feature[] = [];
    for (const row of rows) {
        const geometry = row[geometryColumn] as GeoJSON.Geometry | null | undefined;
        if (!geometry) continue;
        if (project) reprojectInPlace(geometry, project);
        const properties: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
            if (key === geometryColumn) continue;
            const converted = toPropertyValue(value);
            if (converted !== undefined) properties[key] = converted;
        }
        features.push({ type: 'Feature', geometry, properties });
    }
    return { type: 'FeatureCollection', features };
}

/**
 * Read a remote GeoParquet file. hyparquet fetches the footer and then the
 * column chunks with range requests, so the host must allow `Range` and, from
 * a browser, answer CORS; static object stores generally do both.
 */
export async function geoParquetUrlToGeoJSON(url: string): Promise<GeoJSON.FeatureCollection> {
    return geoParquetToGeoJSON(await asyncBufferFromUrl({ url }));
}
