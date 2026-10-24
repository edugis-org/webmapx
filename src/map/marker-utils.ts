// src/map/marker-utils.ts
// Shared SVG marker icons for HTML-overlay-based marker implementations, and
// for MapLibre whenever a marker is not its default pin.

import type { MarkerGlyph } from './IMapInterfaces';

/**
 * The information marker: a round disc on a point, with a white italic i —
 * round to match the info tool's own button (an i in a circle), italic as on
 * the information sign people already know. The white edge keeps it readable
 * on aerial photos. Same 24×36 box and bottom-centre tip as the pin, so every
 * engine anchors it the same way.
 */
function infoSignSvg(color: string): string {
    // Disc centred at (12, 11.5), r 10.5; the point leaves it where the
    // tangents from the tip (12, 35) would, near (7.5, 21) and (16.5, 21).
    // The i's bounding box (measured: centre 12.54, 13.05; 17.1 tall) is
    // scaled to about half the disc's height and centred on the disc.
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path d="M12 35 7.5 21A10.5 10.5 0 1 1 16.5 21Z" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
  <g fill="white" transform="translate(12 11.5) scale(0.64) translate(-12.54 -13.05)">
    <circle cx="13.6" cy="6.4" r="1.9"/>
    <path d="M11.4 10.2h4.1l-2 8.2c-.2.8.5 1 1.3.5l.5.9c-1.6 1.3-3 1.8-4 1.8-1.4 0-2-.9-1.6-2.4l1.6-6.4c.2-.8-.4-1-1.4-.7l-.2-.9Z"/>
  </g>
</svg>`;
}

export function pinSvg(color = '#e63946', glyph?: MarkerGlyph): string {
    if (glyph === 'info') return infoSignSvg(color);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
  <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
</svg>`;
}

export function pinDataUrl(color = '#e63946', glyph?: MarkerGlyph): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pinSvg(color, glyph))}`;
}
