/**
 * Feature info for a raster layer that has no features of its own — weather
 * tiles, say — answered by a JSON service asked about one point:
 *
 *   "getFeatureInfoUrl": "https://api.weatherapi.com/v1/current.json?key={key-weatherapi}&q={latitude},{longitude}"
 *
 * `{latitude}`/`{longitude}` are what mark the url as a point request rather
 * than a WMS GetFeatureInfo; the convention is EduGIS's, so its configs work
 * unchanged. Keys are already substituted by the time the url gets here
 * (`BaseAdapter.addLayer` fills in `{key-…}` everywhere in a layer).
 *
 * The answer is flattened to dotted keys (`current.temp_c`, `location.name`),
 * which is what a layer's `attributes.translations` name: services nest their
 * values, and a leaf name alone collides (`location.lat` and a measured `lat`).
 */
import type { FeatureInfo } from '../map/IQueryService';
import type { LngLat } from '../store/map-events';

const POINT_TOKEN = /\{(latitude|longitude)\}/;

export function isPointInfoUrl(url: string): boolean {
    return POINT_TOKEN.test(url);
}

/**
 * A click on a repeated world copy reports a longitude past ±180 (364.89 for
 * Amsterdam one world east), which a service rejects, so it is wrapped back
 * into [-180, 180) first.
 */
export function wrapLongitude(lng: number): number {
    return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/** Five decimals is about a metre: more says nothing, and keeps the url readable. */
export function buildPointInfoUrl(url: string, [lng, lat]: LngLat): string {
    return url
        .replace(/\{latitude\}/g, lat.toFixed(5))
        .replace(/\{longitude\}/g, wrapLongitude(lng).toFixed(5));
}

/**
 * Nested objects become dotted keys; an array of plain values is joined, an
 * array of objects is kept as it is (shown as JSON) since numbering its entries
 * into keys names nothing a translation could refer to.
 */
export function flattenJson(value: unknown, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            flattenJson(v, prefix ? `${prefix}.${k}` : k, out);
        }
    } else if (prefix) {
        out[prefix] = Array.isArray(value) && value.every((v) => v === null || typeof v !== 'object')
            ? value.join(', ')
            : value;
    }
    return out;
}

export interface PointInfoRequest {
    url: string;
    layerId: string;
    layerTitle: string;
    lngLat: LngLat;
}

/**
 * Asks each layer's service about the point. Layers naming the same url (four
 * weather layers backed by one weather API) share a single request, and each
 * still gets its own result, so each shows the values its own translations pick.
 * A failing service yields nothing for its layers rather than an error: one
 * service down must not hide what every other layer has to say.
 */
export async function fetchPointFeatureInfo(
    requests: PointInfoRequest[],
    fetchFn: typeof fetch = fetch,
): Promise<FeatureInfo[]> {
    const pending = new Map<string, Promise<Record<string, unknown> | null>>();
    const ask = (url: string) => {
        let answer = pending.get(url);
        if (!answer) {
            answer = fetchFn(url)
                .then((response) => (response.ok ? response.json() : null))
                .then((json) => (json !== null && typeof json === 'object' ? flattenJson(json) : null))
                .catch(() => null);
            pending.set(url, answer);
        }
        return answer;
    };
    const results = await Promise.all(requests.map(async (request) => {
        const properties = await ask(buildPointInfoUrl(request.url, request.lngLat));
        if (!properties || Object.keys(properties).length === 0) return null;
        const info: FeatureInfo = {
            layerId: request.layerId,
            layerTitle: request.layerTitle,
            properties,
            geometry: { type: 'Point', coordinates: [request.lngLat[0], request.lngLat[1]] },
            source: 'point',
        };
        return info;
    }));
    return results.filter((info): info is FeatureInfo => info !== null);
}
