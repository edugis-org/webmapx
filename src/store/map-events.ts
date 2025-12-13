// src/store/map-events.ts
// Normalized map events that are library-agnostic.
// Tools subscribe to these events without knowing if MapLibre, OpenLayers, or Leaflet is underneath.

export type LngLat = [number, number];  // [longitude, latitude]
export type Pixel = [number, number];   // [x, y] screen coordinates

/**
 * Resolution at pointer position (degrees per pixel).
 * Useful for snapping, precision display, etc.
 */
export interface PointerResolution {
    lng: number;
    lat: number;
}

/**
 * Base interface for all map events.
 */
interface BaseMapEvent {
    /** Original event from the map library (for advanced use cases) */
    originalEvent?: unknown;
}

/**
 * Pointer move event - emitted continuously as the mouse/touch moves over the map.
 */
export interface PointerMoveEvent extends BaseMapEvent {
    type: 'pointer-move';
    coords: LngLat;
    pixel: Pixel;
    resolution: PointerResolution | null;
}

/**
 * Pointer leave event - emitted when pointer leaves the map canvas.
 */
export interface PointerLeaveEvent extends BaseMapEvent {
    type: 'pointer-leave';
}

/**
 * Click event - emitted on map click/tap.
 */
export interface ClickEvent extends BaseMapEvent {
    type: 'click';
    coords: LngLat;
    pixel: Pixel;
    resolution: PointerResolution | null;
    /** Features at click location (if requested/available) */
    features?: unknown[];
}

/**
 * Double-click event.
 */
export interface DoubleClickEvent extends BaseMapEvent {
    type: 'dblclick';
    coords: LngLat;
    pixel: Pixel;
}

/**
 * Context menu event (right-click).
 */
export interface ContextMenuEvent extends BaseMapEvent {
    type: 'contextmenu';
    coords: LngLat;
    pixel: Pixel;
}

/**
 * Drag events - for drawing, measuring, and other interactive tools.
 */
export interface DragStartEvent extends BaseMapEvent {
    type: 'drag-start';
    coords: LngLat;
    pixel: Pixel;
}

export interface DragEvent extends BaseMapEvent {
    type: 'drag';
    coords: LngLat;
    pixel: Pixel;
    /** Starting coordinates when drag began */
    startCoords: LngLat;
    startPixel: Pixel;
}

export interface DragEndEvent extends BaseMapEvent {
    type: 'drag-end';
    coords: LngLat;
    pixel: Pixel;
    startCoords: LngLat;
    startPixel: Pixel;
}

/**
 * View change event - emitted when the map viewport changes (pan, zoom, rotate).
 */
export interface ViewChangeEvent extends BaseMapEvent {
    type: 'view-change';
    center: LngLat;
    zoom: number;
    bearing: number;
    pitch: number;
    bounds: {
        sw: LngLat;  // southwest
        ne: LngLat;  // northeast
    };
}

/**
 * View change end event - emitted when map movement ends (after animation/interaction).
 */
export interface ViewChangeEndEvent extends ViewChangeEvent {
    type: 'view-change-end';
}

/**
 * Union of all map events.
 */
export type MapEvent =
    | PointerMoveEvent
    | PointerLeaveEvent
    | ClickEvent
    | DoubleClickEvent
    | ContextMenuEvent
    | DragStartEvent
    | DragEvent
    | DragEndEvent
    | ViewChangeEvent
    | ViewChangeEndEvent;

/**
 * Map of event types to their corresponding event interfaces.
 */
export interface MapEventMap {
    'pointer-move': PointerMoveEvent;
    'pointer-leave': PointerLeaveEvent;
    'click': ClickEvent;
    'dblclick': DoubleClickEvent;
    'contextmenu': ContextMenuEvent;
    'drag-start': DragStartEvent;
    'drag': DragEvent;
    'drag-end': DragEndEvent;
    'view-change': ViewChangeEvent;
    'view-change-end': ViewChangeEndEvent;
}

export type MapEventType = keyof MapEventMap;

/**
 * Event listener callback type.
 */
export type MapEventListener<T extends MapEventType> = (event: MapEventMap[T]) => void;

/**
 * MapEventBus - A typed event emitter for normalized map events.
 *
 * Tools subscribe to events here without any knowledge of the underlying map library.
 * Adapters emit events here after normalizing library-specific events.
 *
 * @example
 * // In a tool component:
 * const unsubscribe = eventBus.on('pointer-move', (e) => {
 *     console.log(`Pointer at ${e.coords[0]}, ${e.coords[1]}`);
 * });
 *
 * // In an adapter:
 * eventBus.emit({ type: 'pointer-move', coords: [lng, lat], pixel: [x, y], resolution: null });
 */
export class MapEventBus {
    private listeners: Map<MapEventType, Set<MapEventListener<any>>> = new Map();

    /**
     * Subscribe to a specific event type.
     * @returns Unsubscribe function
     */
    on<T extends MapEventType>(eventType: T, listener: MapEventListener<T>): () => void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.get(eventType)?.delete(listener);
        };
    }

    /**
     * Subscribe to an event type for a single occurrence.
     * @returns Unsubscribe function (in case you want to cancel before it fires)
     */
    once<T extends MapEventType>(eventType: T, listener: MapEventListener<T>): () => void {
        const wrappedListener: MapEventListener<T> = (event) => {
            this.off(eventType, wrappedListener);
            listener(event);
        };
        return this.on(eventType, wrappedListener);
    }

    /**
     * Unsubscribe from a specific event type.
     */
    off<T extends MapEventType>(eventType: T, listener: MapEventListener<T>): void {
        this.listeners.get(eventType)?.delete(listener);
    }

    /**
     * Emit an event to all subscribers.
     */
    emit<T extends MapEventType>(event: MapEventMap[T]): void {
        const listeners = this.listeners.get(event.type as T);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (err) {
                    console.error(`[MapEventBus] Error in listener for "${event.type}":`, err);
                }
            });
        }
    }

    /**
     * Remove all listeners for a specific event type, or all listeners if no type specified.
     */
    clear(eventType?: MapEventType): void {
        if (eventType) {
            this.listeners.delete(eventType);
        } else {
            this.listeners.clear();
        }
    }
}
