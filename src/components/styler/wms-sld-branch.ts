/**
 * The styler's own style for a WMS layer: state, not markup.
 *
 * Kept out of the component because every interesting decision here is one a
 * test should be able to make without a DOM — which sample areas to probe, what
 * a classification of sampled values comes out as, and whether the resulting
 * document will fit in a tile url. The component renders this and applies the
 * urls; it decides nothing.
 */
import { classifyCategorical, classifyNumeric, type ClassificationMethod } from '../../utils/classification';
import { colorSchemesFor } from '../../utils/color-schemes';
import {
    buildSld,
    categoricalSld,
    graduatedSld,
    type SldGeometry,
    type SldStyle,
} from '../../utils/wms-sld';
import type { SldProbeSample } from '../../utils/wms-sld-probe';

/** How many features are read to classify by. Enough to be representative. */
export const VALUE_SAMPLE = 2000;

/** Metres per pixel at zoom 0 in EPSG:3857, the constant every engine uses. */
const WORLD_RESOLUTION = 156543.03392804097;
const PROBE_PIXELS = 256;
/** WMS services commonly refuse a GetMap much larger than this. */
const MAX_PROBE_PIXELS = 2048;
const HALF_WORLD = 20037508.342789244;

function toMercator(lon: number, lat: number): [number, number] {
    const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
    return [
        (lon * HALF_WORLD) / 180,
        (Math.log(Math.tan(((90 + clamped) * Math.PI) / 360)) * HALF_WORLD) / Math.PI,
    ];
}

/**
 * Where and *at what scale* to draw the probe image.
 *
 * Scale is the part that matters, and the part the first version got wrong. A
 * WMS commonly withholds detail above a scale threshold rather than outside an
 * area — PDOK's BAG suppresses buildings above about 1:12000 — so a probe that
 * always asked for a 256-pixel image was coarser than the map's own tiles
 * whenever it covered more ground than one tile, and came back empty about a
 * screen full of buildings. Measured on one downtown bbox: blank at 256 pixels,
 * drawn at 384.
 *
 * So each sample carries the image size that keeps it at the map's own scale or
 * finer:
 *
 * 1. **What is on screen**, at the screen's own pixel size — the same scale the
 *    user is looking at, and the one place the layer is known to draw.
 * 2. **The centre**, at twice the map's resolution, for a service stricter than
 *    the current view.
 * 3. **The layer's extent**, coarse and last: a fallback for a layer with no
 *    scale limit at all, where the first two would be empty only if the map is
 *    somewhere the data is not.
 */
export function probeSamples(
    view: { center: [number, number]; zoom: number; size?: [number, number] } | null,
    bounds: number[] | null | undefined,
): SldProbeSample[] {
    const samples: SldProbeSample[] = [];
    if (view) {
        const [x, y] = toMercator(view.center[0], view.center[1]);
        const resolution = WORLD_RESOLUTION / 2 ** view.zoom;
        if (view.size) {
            const [width, height] = view.size;
            const halfWidth = (resolution * width) / 2;
            const halfHeight = (resolution * height) / 2;
            samples.push({
                bbox: [x - halfWidth, y - halfHeight, x + halfWidth, y + halfHeight],
                // Asked for at the size it is shown, so the request is at the
                // map's scale — capped, since a probe is not a print job.
                size: fitSize(width, height),
            });
        }
        const half = resolution * (PROBE_PIXELS / 2);
        samples.push({
            bbox: [x - half, y - half, x + half, y + half],
            size: [PROBE_PIXELS * 2, PROBE_PIXELS * 2],
        });
    }
    if (Array.isArray(bounds) && bounds.length === 4) {
        const [west, south] = toMercator(bounds[0], bounds[1]);
        const [east, north] = toMercator(bounds[2], bounds[3]);
        samples.push({ bbox: [west, south, east, north] });
    }
    if (samples.length === 0) samples.push({ bbox: [-HALF_WORLD, -HALF_WORLD, HALF_WORLD, HALF_WORLD] });
    return samples;
}

/** The screen's own size, kept within what a service will render in one go. */
function fitSize(width: number, height: number): [number, number] {
    const longest = Math.max(width, height);
    if (longest <= MAX_PROBE_PIXELS) return [Math.round(width), Math.round(height)];
    const scale = MAX_PROBE_PIXELS / longest;
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

export type SldDriver = 'single' | 'attribute';

export interface SldDraft {
    driver: SldDriver;
    color: string;
    /** Drawn around each feature. Empty means no outline at all. */
    strokeColor: string;
    attribute: string | null;
    method: ClassificationMethod;
    classCount: number;
    scheme: string;
    /** What the sample said, so the form can be built without asking again. */
    values: unknown[] | null;
}

export function emptyDraft(): SldDraft {
    return {
        driver: 'single',
        color: '#3182bd',
        strokeColor: '',
        attribute: null,
        method: 'quantile',
        classCount: 5,
        scheme: '',
        values: null,
    };
}

export interface SldBuildResult {
    style: SldStyle | null;
    /** What the legend shows, and what the rules were built from. */
    classes: Array<{ label: string; color: string }>;
    /** Why there is no style, in words the panel can show. */
    problem?: string;
}

/**
 * The style a draft stands for, with the classes it produced.
 *
 * A numeric column is classified with exactly the code a vector layer uses, so
 * a WMS choropleth and a GeoJSON one put their breaks in the same places; a
 * text column becomes categories. The difference from the vector path is that
 * the values are a *sample* of the service's data, not the data, which is what
 * the panel warns about rather than this function.
 */
export function buildDraftStyle(draft: SldDraft): SldBuildResult {
    const extra = {
        ...(draft.strokeColor ? { strokeColor: draft.strokeColor } : {}),
    };
    if (draft.driver === 'single' || !draft.attribute) {
        return {
            style: { kind: 'single', color: draft.color, ...extra },
            classes: [{ label: 'all features', color: draft.color }],
        };
    }
    const values = draft.values ?? [];
    if (values.length === 0) {
        return { style: null, classes: [], problem: 'No values came back for that column, so there is nothing to classify.' };
    }
    const numbers = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    // A column is treated as numbers only when nearly all of it is numbers: one
    // stray code in a numeric column is a missing value, but a column that is
    // half text is a category column whatever its schema type says.
    if (numbers.length >= values.length * 0.8 && numbers.length > 1) {
        const classification = classifyNumeric(numbers, {
            method: draft.method,
            classCount: draft.classCount,
        });
        if (classification.classes.length === 0) {
            return { style: null, classes: [], problem: 'Those values are all the same, so there is nothing to classify.' };
        }
        const scheme = pickScheme(draft.scheme, classification.classes.length, 'seq');
        const style = graduatedSld(draft.attribute, classification.classes, scheme, extra);
        return {
            style,
            classes: style.breaks.map((band, index) => ({
                label: band.label ?? String(index),
                color: band.color,
            })),
        };
    }
    const features = values
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map((value) => ({ type: 'Feature' as const, properties: { value }, geometry: null }));
    const classification = classifyCategorical(features as never, 'value', { maxCategories: draft.classCount });
    if (classification.categories.length === 0) {
        return { style: null, classes: [], problem: 'That column is empty in every feature we sampled.' };
    }
    const scheme = pickScheme(draft.scheme, classification.categories.length, 'qual');
    const style = categoricalSld(
        draft.attribute,
        classification.categories.map((category) => category.value),
        scheme,
        // Values beyond the ones sampled are real data, so they are drawn in
        // grey rather than dropped: a feature that vanishes reads as a bug.
        { ...extra, otherColor: '#cccccc' },
    );
    return {
        style,
        classes: [
            ...style.categories.map((category) => ({ label: String(category.value), color: category.color })),
            ...(classification.otherValues > 0 ? [{ label: 'other', color: '#cccccc' }] : []),
        ],
    };
}

function pickScheme(name: string, count: number, type: 'seq' | 'qual'): readonly string[] {
    const schemes = colorSchemesFor(count, type);
    const chosen = schemes.find((scheme) => scheme.name === name) ?? schemes[0];
    return chosen?.colors ?? Array.from({ length: count }, () => '#3182bd');
}

/** The document for a draft, or the reason there is none to send. */
export function draftDocument(
    layer: string,
    geometry: SldGeometry,
    draft: SldDraft,
): { sld: string | null; classes: Array<{ label: string; color: string }>; problem?: string } {
    const built = buildDraftStyle(draft);
    if (!built.style) return { sld: null, classes: [], problem: built.problem };
    // No length check: how long a request may be is the service's answer, not a
    // constant this code can know, so the style is sent and a refusal is read
    // back from the service itself (`verifyStyledRequest`).
    return { sld: buildSld(layer, geometry, built.style), classes: built.classes };
}
