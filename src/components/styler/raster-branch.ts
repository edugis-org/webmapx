/**
 * What a raster layer can be asked, without any rendering.
 *
 * A raster layer arrives as finished pictures: there is no geometry to classify
 * and no paint to build an expression from, so the styler's levels do not apply
 * to it at all. What *can* be changed depends on where the pictures come from —
 * a WMS draws them on request and will draw them differently if asked for
 * another of its named styles, a plain tile service serves what it has already
 * drawn — and deciding which of the two this is, is the whole of the logic
 * here. It is kept out of the component so the decision can be tested without a
 * DOM, and so the step dialog and the styler cannot drift apart while both are
 * live.
 */
import { readWmsSource, withWmsStyleUrl, type WmsStyleOption } from '../../utils/wms-source';
import { withSldBodyUrl } from '../../utils/wms-sld';
import type { RasterStyleTarget, SourceControl } from './style-context';

export type RasterBranchKind =
    /** Not WMS: the pictures are already drawn, so only opacity is left. */
    | 'tiles'
    /** WMS, but this engine cannot repoint a live source. */
    | 'fixed'
    /** WMS offering fewer than two styles: nothing to choose between. */
    | 'single'
    /** WMS offering a choice. */
    | 'choice';

export interface RasterBranch {
    kind: RasterBranchKind;
    /** The one style a `single` service draws, when it named one. */
    only?: WmsStyleOption;
}

/**
 * Which question the panel may ask about this raster layer.
 *
 * An engine that cannot say where a live source points cannot repoint it
 * either, so the style list is not offered there: a choice that silently fails
 * is worse than no choice.
 */
export function rasterBranch(
    raster: RasterStyleTarget | null | undefined,
    sourceControl: SourceControl | null | undefined,
    styles: WmsStyleOption[] | null,
): RasterBranch {
    if (!raster || !readWmsSource(raster.sourceConfig)) return { kind: 'tiles' };
    const repointable = !!sourceControl && (sourceControl.getTiles?.(raster.sourceId) ?? null) !== null;
    if (!repointable) return { kind: 'fixed' };
    const offered = styles ?? [];
    if (offered.length < 2) return offered.length === 1 ? { kind: 'single', only: offered[0] } : { kind: 'single' };
    return { kind: 'choice' };
}

/**
 * The urls this source should be requesting to draw itself in `style`.
 *
 * The urls the engine is actually requesting come first, not the ones the
 * config declared: a WMS given as a bare endpoint plus `layers`/`styles` keys
 * has its GetMap url assembled by the engine, and rewriting the bare endpoint
 * instead would point the layer at a request with no bbox. Empty means there is
 * nothing to rewrite and the caller should leave the source alone.
 */
export function wmsStyleTiles(
    raster: RasterStyleTarget,
    sourceControl: SourceControl | null | undefined,
    style: string,
): string[] {
    const live = sourceControl?.getTiles?.(raster.sourceId) ?? null;
    const declared = raster.sourceConfig?.tiles ?? raster.sourceConfig?.url;
    const current = live ?? (Array.isArray(declared)
        ? declared as string[]
        : typeof declared === 'string' ? [declared] : []);
    // A style of our own and a named style in the same request is undefined
    // between services — some honour the document, some the name — so choosing
    // one of the service's own styles takes the document back off. Without
    // this, picking a named style after drawing your own appears to do nothing.
    return current.map((url) => withWmsStyleUrl(withSldBodyUrl(url, null), style));
}
