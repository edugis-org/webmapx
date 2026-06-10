/** Minimal QGIS .qml (singleSymbol / categorizedSymbol renderer) -> MapLibre paint converter. */

export interface QmlStyle {
  type: 'fill' | 'line' | 'circle';
  paint: Record<string, unknown>;
}

/** Convert a QGIS color prop value ("r,g,b,a" or "#rrggbb") to a CSS color. */
function qmlColor(val: string): string {
  if (val.startsWith('#')) return val;
  const parts = val.split(',').slice(0, 4).map(Number);
  if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
    const [r, g, b, a = 255] = parts;
    return a < 255 ? `rgba(${r},${g},${b},${(a / 255).toFixed(2)})` : `rgb(${r},${g},${b})`;
  }
  return val;
}

function getProp(layerEl: Element, key: string): string | undefined {
  // legacy QGIS: <prop k="key" v="value"/>
  for (const p of Array.from(layerEl.querySelectorAll(':scope > prop'))) {
    if (p.getAttribute('k') === key) return p.getAttribute('v') ?? undefined;
  }
  // QGIS 3.x: <Option type="Map"><Option name="key" value="value"/>...</Option>
  for (const p of Array.from(layerEl.querySelectorAll(':scope > Option > Option'))) {
    if (p.getAttribute('name') === key) return p.getAttribute('value') ?? undefined;
  }
  return undefined;
}

interface SymbolStyle {
  type: 'fill' | 'line' | 'circle';
  color?: string;
  outlineColor?: string;
  width?: number;
  radius?: number;
}

function extractSymbolStyle(symbolEl: Element): SymbolStyle | null {
  const symbolType = symbolEl.getAttribute('type');
  const layerEl = symbolEl.querySelector(':scope > layer');
  if (!layerEl) return null;

  if (symbolType === 'fill') {
    const color = getProp(layerEl, 'color');
    const outlineColor = getProp(layerEl, 'outline_color') ?? getProp(layerEl, 'line_color');
    return { type: 'fill', color: color ? qmlColor(color) : undefined, outlineColor: outlineColor ? qmlColor(outlineColor) : undefined };
  }
  if (symbolType === 'line') {
    const color = getProp(layerEl, 'line_color') ?? getProp(layerEl, 'color');
    const width = getProp(layerEl, 'line_width') ?? getProp(layerEl, 'width');
    return { type: 'line', color: color ? qmlColor(color) : undefined, width: width ? Math.max(1, parseFloat(width) * 2) : undefined };
  }
  if (symbolType === 'marker') {
    const color = getProp(layerEl, 'color');
    const size = getProp(layerEl, 'size');
    return { type: 'circle', color: color ? qmlColor(color) : undefined, radius: size ? Math.max(1, parseFloat(size) * 2) : undefined };
  }
  return null;
}

function paintFromSymbolStyle(style: SymbolStyle, color: unknown, outlineColor?: unknown): Record<string, unknown> {
  if (style.type === 'fill') {
    const paint: Record<string, unknown> = {};
    if (color !== undefined) paint['fill-color'] = color;
    const outline = outlineColor ?? style.outlineColor;
    if (outline !== undefined) paint['fill-outline-color'] = outline;
    return paint;
  }
  if (style.type === 'line') {
    const paint: Record<string, unknown> = { 'line-width': style.width ?? 2 };
    if (color !== undefined) paint['line-color'] = color;
    return paint;
  }
  const paint: Record<string, unknown> = { 'circle-radius': style.radius ?? 8 };
  if (color !== undefined) paint['circle-color'] = color;
  return paint;
}

/** Parse a QGIS .qml file's renderer (singleSymbol or categorizedSymbol) into a MapLibre paint. */
export function parseQmlStyle(qmlText: string): QmlStyle | null {
  const cleaned = qmlText.replace(/<!DOCTYPE[^>]*>/i, '');
  const doc = new DOMParser().parseFromString(cleaned, 'application/xml');
  if (doc.querySelector('parsererror')) return null;

  const renderer = doc.querySelector('renderer-v2');
  if (!renderer) return null;
  const rendererType = renderer.getAttribute('type');

  const layerOpacityText = doc.querySelector('qgis > layerOpacity')?.textContent;
  const layerOpacity = layerOpacityText ? parseFloat(layerOpacityText) : undefined;

  if (rendererType === 'categorizedSymbol') {
    const field = renderer.getAttribute('attr');
    const categories = Array.from(renderer.querySelectorAll(':scope > categories > category'));
    const symbolsByName = new Map<string, Element>();
    for (const symbolEl of Array.from(renderer.querySelectorAll(':scope > symbols > symbol'))) {
      const name = symbolEl.getAttribute('name');
      if (name) symbolsByName.set(name, symbolEl);
    }

    let baseStyle: SymbolStyle | null = null;
    const colorMatch: unknown[] = ['match', ['to-string', ['get', field ?? '']]];
    const outlineMatch: unknown[] = ['match', ['to-string', ['get', field ?? '']]];
    let fallbackColor: string | undefined;
    let fallbackOutline: string | undefined;
    let hasOutline = false;

    for (const category of categories) {
      const symbolName = category.getAttribute('symbol');
      const value = category.getAttribute('value') ?? '';
      const symbolEl = symbolName ? symbolsByName.get(symbolName) : undefined;
      if (!symbolEl) continue;
      const style = extractSymbolStyle(symbolEl);
      if (!style) continue;
      if (!baseStyle) baseStyle = style;
      const color = style.color;
      if (!color) continue;
      if (style.outlineColor) hasOutline = true;
      if (value === '' && category.getAttribute('render') !== 'false') {
        // QGIS "all other values" category typically has an empty value
        fallbackColor = color;
        fallbackOutline = style.outlineColor;
        continue;
      }
      colorMatch.push(value, color);
      outlineMatch.push(value, style.outlineColor ?? color);
    }

    if (!baseStyle || !field) return null;
    if (colorMatch.length <= 2) return null; // no usable categories
    colorMatch.push(fallbackColor ?? baseStyle.color ?? '#444444');
    outlineMatch.push(fallbackOutline ?? fallbackColor ?? baseStyle.outlineColor ?? baseStyle.color ?? '#444444');

    const paint = paintFromSymbolStyle(baseStyle, colorMatch, hasOutline ? outlineMatch : undefined);
    if (baseStyle.type === 'fill' && layerOpacity !== undefined) paint['fill-opacity'] = layerOpacity;
    return { type: baseStyle.type, paint };
  }

  // singleSymbol (and fallback for other renderer types: use the first symbol)
  const symbol = doc.querySelector('renderer-v2 > symbols > symbol');
  if (!symbol) return null;
  const style = extractSymbolStyle(symbol);
  if (!style) return null;
  const paint = paintFromSymbolStyle(style, style.color);
  if (style.type === 'fill' && layerOpacity !== undefined) paint['fill-opacity'] = layerOpacity;
  return { type: style.type, paint };
}
