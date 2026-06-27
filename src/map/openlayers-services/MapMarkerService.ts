// src/map/openlayers-services/MapMarkerService.ts
// Uses ol/Overlay (HTML element) for marker rendering — no extra VectorLayer needed.

import OLMap from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat, toLonLat } from 'ol/proj';
import type { LngLat } from '../../store/map-events';
import type { MarkerOptions } from '../IMapInterfaces';
import { pinSvg } from '../marker-utils';

interface MarkerEntry {
    overlay: Overlay;
    element: HTMLDivElement;
    draggable: boolean;
    dragCleanup?: () => void;
}

export class MapMarkerService {
    private markers = new Map<string, MarkerEntry>();

    constructor(private readonly map: OLMap) {}

    add(id: string, lngLat: LngLat, options: MarkerOptions = {}): void {
        this.remove(id);

        const color = options.color ?? '#e63946';
        const draggable = options.draggable ?? false;

        const element = document.createElement('div');
        element.style.cssText = 'cursor:pointer;user-select:none;';
        element.innerHTML = pinSvg(color);

        const overlay = new Overlay({
            element,
            positioning: 'bottom-center',
            stopEvent: false,
            position: fromLonLat([lngLat[0], lngLat[1]]),
        });
        this.map.addOverlay(overlay);

        const entry: MarkerEntry = { overlay, element, draggable };

        if (draggable) {
            entry.dragCleanup = this.attachDrag(element, overlay, options);
        }

        this.markers.set(id, entry);
    }

    move(id: string, lngLat: LngLat): void {
        const entry = this.markers.get(id);
        if (entry) {
            entry.overlay.setPosition(fromLonLat([lngLat[0], lngLat[1]]));
        }
    }

    remove(id: string): void {
        const entry = this.markers.get(id);
        if (entry) {
            entry.dragCleanup?.();
            this.map.removeOverlay(entry.overlay);
            this.markers.delete(id);
        }
    }

    private attachDrag(element: HTMLElement, overlay: Overlay, options: MarkerOptions): () => void {
        let dragging = false;

        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            dragging = true;
            element.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return;
            const mapEl = this.map.getTargetElement();
            const rect = mapEl.getBoundingClientRect();
            const pixel: [number, number] = [e.clientX - rect.left, e.clientY - rect.top];
            const coord = this.map.getCoordinateFromPixel(pixel);
            if (coord) {
                overlay.setPosition(coord);
                if (options.onDrag) {
                    const ll = toLonLat(coord);
                    options.onDrag([ll[0], ll[1]]);
                }
            }
        };

        const onPointerUp = () => {
            if (!dragging) return;
            dragging = false;
            if (options.onDragEnd) {
                const pos = overlay.getPosition();
                if (pos) {
                    const ll = toLonLat(pos);
                    options.onDragEnd([ll[0], ll[1]]);
                }
            }
        };

        element.addEventListener('pointerdown', onPointerDown);
        element.addEventListener('pointermove', onPointerMove);
        element.addEventListener('pointerup', onPointerUp);

        return () => {
            element.removeEventListener('pointerdown', onPointerDown);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerup', onPointerUp);
        };
    }
}
