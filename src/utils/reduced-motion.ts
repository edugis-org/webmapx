/**
 * Whether the visitor has asked their system for less motion
 * (`prefers-reduced-motion: reduce`).
 *
 * Camera moves jump instead of flying then, on every engine. Zooming out,
 * across and back in on the way to a place is exactly the kind of large
 * motion the setting exists to stop, and the jump lands on the same view.
 * MapLibre's own `flyTo` already does this unless a call is marked
 * `essential`; the other engines ask here.
 */
export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
