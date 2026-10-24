// src/map/maplibre-services/MapMarkerService.ts

import * as maplibregl from 'maplibre-gl';
import type { LngLat } from '../../store/map-events';
import type { MarkerOptions } from '../IMapInterfaces';
import { pinSvg } from '../marker-utils';

export class MapMarkerService {
    private markers = new Map<string, maplibregl.Marker>();

    constructor(private readonly map: maplibregl.Map) {}

    add(id: string, lngLat: LngLat, options: MarkerOptions = {}): void {
        this.remove(id);
        const color = options.color ?? '#e63946';
        // The plain pin stays MapLibre's own; any other shape is the shared
        // SVG the other engines draw, so it looks the same everywhere.
        const element = options.glyph ? document.createElement('div') : undefined;
        if (element) element.innerHTML = pinSvg(color, options.glyph);
        const marker = new maplibregl.Marker({
            ...(element ? { element, anchor: 'bottom' as const } : { color }),
            draggable: options.draggable ?? false,
        })
            .setLngLat([lngLat[0], lngLat[1]])
            .addTo(this.map);

        if (options.onDrag) {
            marker.on('drag', () => {
                const pos = marker.getLngLat();
                options.onDrag!([pos.lng, pos.lat]);
            });
        }
        if (options.onDragEnd) {
            marker.on('dragend', () => {
                const pos = marker.getLngLat();
                options.onDragEnd!([pos.lng, pos.lat]);
            });
        }

        this.markers.set(id, marker);
    }

    move(id: string, lngLat: LngLat): void {
        this.markers.get(id)?.setLngLat([lngLat[0], lngLat[1]]);
    }

    remove(id: string): void {
        const marker = this.markers.get(id);
        if (marker) {
            marker.remove();
            this.markers.delete(id);
        }
    }
}
