// src/map/marker-utils.ts
// Shared SVG pin icon for HTML-overlay-based marker implementations.

export function pinSvg(color = '#e63946'): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
  <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
</svg>`;
}

export function pinDataUrl(color = '#e63946'): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pinSvg(color))}`;
}
