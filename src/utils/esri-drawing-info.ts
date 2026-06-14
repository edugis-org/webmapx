// src/utils/esri-drawing-info.ts
// Converts an Esri FeatureServer/MapServer layer's `drawingInfo.renderer`
// (from `${layerUrl}?f=json`) into MapLibre `paint`/`layout` properties.
// Covers the common renderer types (simple, uniqueValue, classBreaks) for
// the symbol types webmapx's discovered layers can use (fill/line/circle).

type EsriColor = [number, number, number, number?];

interface EsriSymbol {
  type?: string; // 'esriSFS' | 'esriSLS' | 'esriSMS' | 'esriPMS' | ...
  color?: EsriColor;
  outline?: EsriSymbol;
  width?: number; // line width / outline width, in points
  size?: number; // marker size, in points
  style?: string; // e.g. 'esriSLSDash' for line symbols
}

interface EsriRenderer {
  type?: string; // 'simple' | 'uniqueValue' | 'classBreaks'
  symbol?: EsriSymbol;
  transparency?: number; // 0-100, applies to the whole renderer's colors
  field1?: string;
  field2?: string;
  field3?: string;
  fieldDelimiter?: string;
  uniqueValueInfos?: { value: string; symbol?: EsriSymbol }[];
  defaultSymbol?: EsriSymbol;
  field?: string;
  classBreakInfos?: { classMaxValue: number; symbol?: EsriSymbol }[];
}

export type MaplibreGeometryKind = 'fill' | 'line' | 'circle';

export interface ConvertedSymbology {
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  /**
   * For `fill` symbols whose outline is wider than 1px: a separate `line`
   * layer's paint to render that outline, since MapLibre's
   * `fill-outline-color` is a fixed ~1px antialiased edge and can't carry a
   * width. Callers should add this as a second sub-layer on the same source.
   */
  outline?: { paint: Record<string, unknown> };
}

/**
 * `[r,g,b]` or `[r,g,b,a]` (alpha 0-255) -> CSS `rgba()`.
 * `opacityFactor` (0-1) is multiplied into the alpha, for `drawingInfo.transparency`.
 */
function esriColorToCss(color: EsriColor | undefined, opacityFactor = 1): string | undefined {
  if (!color) return undefined;
  const [r, g, b, a = 255] = color;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255) * opacityFactor})`;
}

/** `drawingInfo.transparency` (0-100, 0 = opaque) -> opacity factor (0-1). */
function transparencyToOpacityFactor(transparency: number | undefined): number {
  if (typeof transparency !== 'number') return 1;
  return (100 - Math.min(100, Math.max(0, transparency))) / 100;
}

/** Esri symbol widths/sizes are in points; MapLibre uses pixels (1pt = 1px at 96dpi, close enough). */
function esriSizeToPx(size: number | undefined): number | undefined {
  return typeof size === 'number' ? size : undefined;
}

// Esri simple-line dash styles -> MapLibre `line-dasharray` (in line-width units).
const ESRI_LINE_DASH_PATTERNS: Record<string, number[]> = {
  esrislsdash: [4, 3],
  esrislsdot: [1, 3],
  esrislsdashdot: [4, 3, 1, 3],
  esrislsdashdotdot: [4, 3, 1, 3, 1, 3],
};

/** Converts a single Esri symbol to MapLibre paint properties for the given geometry kind. */
function symbolToPaint(symbol: EsriSymbol | undefined, kind: MaplibreGeometryKind, opacityFactor = 1): Record<string, unknown> {
  if (!symbol) return {};

  switch (kind) {
    case 'fill': {
      const paint: Record<string, unknown> = {};
      const outlineColor = esriColorToCss(symbol.outline?.color, opacityFactor);
      if (outlineColor) paint['fill-outline-color'] = outlineColor;

      const fillColor = esriColorToCss(symbol.color, opacityFactor);
      if (fillColor) paint['fill-color'] = fillColor;
      return paint;
    }
    case 'line': {
      const paint: Record<string, unknown> = {};
      const color = esriColorToCss(symbol.color, opacityFactor);
      if (color) paint['line-color'] = color;
      const width = esriSizeToPx(symbol.width);
      if (width !== undefined) paint['line-width'] = width;
      const dasharray = ESRI_LINE_DASH_PATTERNS[(symbol.style ?? '').toLowerCase()];
      if (dasharray) paint['line-dasharray'] = dasharray;
      return paint;
    }
    case 'circle': {
      const paint: Record<string, unknown> = {};
      const color = esriColorToCss(symbol.color, opacityFactor);
      if (color) paint['circle-color'] = color;
      const radius = esriSizeToPx(symbol.size);
      if (radius !== undefined) paint['circle-radius'] = radius / 2;
      const strokeColor = esriColorToCss(symbol.outline?.color, opacityFactor);
      if (strokeColor) paint['circle-stroke-color'] = strokeColor;
      const strokeWidth = esriSizeToPx(symbol.outline?.width);
      if (strokeWidth !== undefined) paint['circle-stroke-width'] = strokeWidth;
      return paint;
    }
  }
}

/**
 * If a fill symbol's outline is wider than 1px, returns a `line` paint to
 * render it as a separate sub-layer (MapLibre's `fill-outline-color` is a
 * fixed ~1px edge regardless of the Esri outline width).
 */
function fillOutlineLinePaint(symbol: EsriSymbol | undefined, opacityFactor: number): { paint: Record<string, unknown> } | undefined {
  const outline = symbol?.outline;
  const width = esriSizeToPx(outline?.width);
  if (!outline || width === undefined || width <= 1) return undefined;

  const color = esriColorToCss(outline.color, opacityFactor);
  if (!color) return undefined;

  const paint: Record<string, unknown> = { 'line-color': color, 'line-width': width };
  const dasharray = ESRI_LINE_DASH_PATTERNS[(outline.style ?? '').toLowerCase()];
  if (dasharray) paint['line-dasharray'] = dasharray;
  return { paint };
}

/** The MapLibre paint property holding fill/line/circle color, per geometry kind. */
const COLOR_PROPERTY: Record<MaplibreGeometryKind, string> = {
  fill: 'fill-color',
  line: 'line-color',
  circle: 'circle-color',
};

/**
 * Builds the `['get'|'concat', ...]` expression matching `uniqueValueInfos[].value`
 * for a (possibly multi-field) uniqueValue renderer.
 */
function uniqueValueFieldExpression(renderer: EsriRenderer): unknown | undefined {
  const fields = [renderer.field1, renderer.field2, renderer.field3].filter((f): f is string => Boolean(f));
  if (fields.length === 0) return undefined;
  if (fields.length === 1) return ['get', fields[0]];

  const delimiter = renderer.fieldDelimiter ?? ',';
  const expr: unknown[] = ['concat'];
  fields.forEach((field, i) => {
    if (i > 0) expr.push(delimiter);
    expr.push(['to-string', ['get', field]]);
  });
  return expr;
}

/**
 * Converts an Esri `drawingInfo` object (from a FeatureServer/MapServer
 * layer's `?f=json` response) into MapLibre `paint`/`layout`. Returns
 * `undefined` if the renderer type/symbol combination isn't supported
 * (caller should fall back to its own default paint).
 */
export function convertEsriDrawingInfo(
  drawingInfo: { renderer?: EsriRenderer } | undefined,
  kind: MaplibreGeometryKind
): ConvertedSymbology | undefined {
  const renderer = drawingInfo?.renderer;
  if (!renderer) return undefined;

  const opacityFactor = transparencyToOpacityFactor(renderer.transparency);

  switch (renderer.type) {
    case 'simple': {
      const paint = symbolToPaint(renderer.symbol, kind, opacityFactor);
      if (!Object.keys(paint).length) return undefined;
      const outline = kind === 'fill' ? fillOutlineLinePaint(renderer.symbol, opacityFactor) : undefined;
      return { paint, ...(outline ? { outline } : {}) };
    }

    case 'uniqueValue': {
      const fieldExpr = uniqueValueFieldExpression(renderer);
      const infos = renderer.uniqueValueInfos;
      if (!fieldExpr || !infos?.length) return undefined;

      const colorProp = COLOR_PROPERTY[kind];
      const expression: unknown[] = ['match', fieldExpr];
      let fallback: string | undefined;
      const seenLabels = new Set<string>();

      for (const info of infos) {
        const color = esriColorToCss(info.symbol?.color, opacityFactor);
        if (!color) continue;
        // MapLibre `match` requires unique input labels; Esri renderers can
        // list the same value multiple times (e.g. "" for several classes).
        if (seenLabels.has(info.value)) continue;
        seenLabels.add(info.value);
        expression.push(info.value, color);
        fallback ??= color;
      }

      const defaultColor = esriColorToCss(renderer.defaultSymbol?.color, opacityFactor);
      fallback = defaultColor ?? fallback;
      if (!fallback) return undefined;
      expression.push(fallback);

      // Non-color properties (width/radius/outline) come from the first symbol.
      const paint = symbolToPaint(infos[0]?.symbol, kind, opacityFactor);
      paint[colorProp] = expression;
      const outline = kind === 'fill' ? fillOutlineLinePaint(infos[0]?.symbol, opacityFactor) : undefined;
      return { paint, ...(outline ? { outline } : {}) };
    }

    case 'classBreaks': {
      const field = renderer.field;
      const breaks = renderer.classBreakInfos;
      if (!field || !breaks?.length) return undefined;

      const colorProp = COLOR_PROPERTY[kind];
      // ['step', input, output(-inf..breaks[0]], breaks[0], output(breaks[0]..breaks[1]], ...]
      const expression: unknown[] = ['step', ['get', field]];
      const firstColor = esriColorToCss(breaks[0]?.symbol?.color, opacityFactor)
        ?? esriColorToCss(renderer.defaultSymbol?.color, opacityFactor);
      if (!firstColor) return undefined;
      expression.push(firstColor);

      for (let i = 0; i < breaks.length - 1; i++) {
        const color = esriColorToCss(breaks[i + 1]?.symbol?.color, opacityFactor)
          ?? esriColorToCss(renderer.defaultSymbol?.color, opacityFactor);
        if (!color) return undefined;
        expression.push(breaks[i].classMaxValue, color);
      }

      const paint = symbolToPaint(breaks[0]?.symbol, kind, opacityFactor);
      paint[colorProp] = expression;
      const outline = kind === 'fill' ? fillOutlineLinePaint(breaks[0]?.symbol, opacityFactor) : undefined;
      return { paint, ...(outline ? { outline } : {}) };
    }

    default:
      return undefined;
  }
}
