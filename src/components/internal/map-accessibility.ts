import type { IMap } from '../../map/IMapInterfaces';

/**
 * Makes the map itself reachable and named for assistive technology, the same
 * way on every engine.
 *
 * The engines disagree: MapLibre labels its canvas as a region called "Map" and
 * makes it focusable, Leaflet makes its container focusable with no name,
 * OpenLayers and Cesium do neither — so a keyboard user could reach the map on
 * two engines, and hear what it was on one. Everything here is decided from the
 * DOM the engine produced, not from which engine it is, so an engine added later
 * is handled the same way.
 *
 * - **One landmark, named after the map.** The engine's own `role="region"` if
 *   it made one (a second region around it would nest two landmarks for one
 *   map), otherwise the map surface. Named by the config's `map.label`.
 * - **`aria-busy`** on that landmark while the map loads, in place of a spinner
 *   announcing itself.
 * - **Keyboard.** If the engine left nothing focusable, the surface becomes a
 *   tab stop (OpenLayers handles keys once its target has focus, it just never
 *   made it focusable). Arrow keys pan and `+` `-` zoom through the adapter
 *   only for an engine that reports no keyboard handling of its own
 *   (`getNavigationCapabilities().keyboard`) — running both would move the
 *   map twice per key.
 */

const PAN_STEP_PX = 100;
const OWNED = 'data-webmapx-a11y';

export interface MapAccessibilityHandle {
    /** Re-inspects the engine's DOM (after it has drawn, or after an engine switch). */
    refresh(): void;
    dispose(): void;
}

/**
 * Focusable things inside a map that are controls, not the map. Cesium 1.145
 * made its "Data attribution" link a tab stop; counting it as the engine's own
 * focus target left the map itself unreachable, and arrows and `+` went to a
 * link.
 */
const CONTROL = 'a, button, input, select, textarea, [role="button"], [role="link"]';

function hasOwnFocusTarget(surface: HTMLElement): boolean {
    const own = surface.getAttribute(OWNED) === 'focus';
    if (!own && surface.tabIndex >= 0 && surface.hasAttribute('tabindex')) return true;
    return Array.from(surface.querySelectorAll<HTMLElement>('[tabindex]'))
        .some((el) => el.tabIndex >= 0 && !el.closest('[inert]') && !el.matches(CONTROL));
}

export function setupMapAccessibility(
    surface: HTMLElement,
    adapter: IMap,
    getLabel: () => string,
): MapAccessibilityHandle {
    let landmark: HTMLElement = surface;

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.target !== surface || event.altKey || event.ctrlKey || event.metaKey) return;
        if (adapter.getNavigationCapabilities().keyboard) return;
        const step = event.shiftKey ? PAN_STEP_PX * 3 : PAN_STEP_PX;
        let dx = 0;
        let dy = 0;
        switch (event.key) {
            case 'ArrowLeft': dx = -step; break;
            case 'ArrowRight': dx = step; break;
            case 'ArrowUp': dy = -step; break;
            case 'ArrowDown': dy = step; break;
            case '+':
            case '=':
                adapter.setZoom(adapter.getZoom() + 1);
                event.preventDefault();
                return;
            case '-':
            case '_':
                adapter.setZoom(adapter.getZoom() - 1);
                event.preventDefault();
                return;
            default:
                return;
        }
        const { center, zoom } = adapter.getViewportState();
        const [x, y] = adapter.project(center);
        const next = adapter.unproject([x + dx, y + dy]);
        if (next) adapter.setViewport(next, zoom);
        event.preventDefault();
    };

    const refresh = () => {
        const engineRegion = surface.querySelector<HTMLElement>('[role="region"]');
        const nextLandmark = engineRegion && !engineRegion.closest('[inert]') ? engineRegion : surface;
        if (nextLandmark !== landmark && landmark === surface) {
            surface.removeAttribute('role');
            surface.removeAttribute('aria-label');
            surface.removeAttribute('aria-busy');
        }
        landmark = nextLandmark;
        if (landmark === surface) surface.setAttribute('role', 'region');
        landmark.setAttribute('aria-label', getLabel());

        const ownsFocus = surface.getAttribute(OWNED) === 'focus';
        if (hasOwnFocusTarget(surface)) {
            if (ownsFocus) {
                surface.removeAttribute('tabindex');
                surface.removeAttribute(OWNED);
            }
        } else if (!ownsFocus) {
            surface.tabIndex = 0;
            surface.setAttribute(OWNED, 'focus');
        }
    };

    const unsubscribe = adapter.store.subscribe((state) => {
        if (state.mapBusy) landmark.setAttribute('aria-busy', 'true');
        else landmark.removeAttribute('aria-busy');
    });

    surface.addEventListener('keydown', onKeyDown);
    refresh();

    return {
        refresh,
        dispose() {
            unsubscribe();
            surface.removeEventListener('keydown', onKeyDown);
            if (surface.getAttribute(OWNED) === 'focus') {
                surface.removeAttribute('tabindex');
                surface.removeAttribute(OWNED);
            }
        },
    };
}
