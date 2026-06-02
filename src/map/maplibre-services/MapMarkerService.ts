// src/map/maplibre-services/MapMarkerService.ts

import * as maplibregl from 'maplibre-gl';
import type { LngLat } from '../../store/map-events';
import type { MarkerOptions } from '../IMapInterfaces';

export class MapMarkerService {
    private markers = new Map<string, maplibregl.Marker>();

    constructor(private readonly map: maplibregl.Map) {}

    add(id: string, lngLat: LngLat, options: MarkerOptions = {}): void {
        this.remove(id);
        const marker = new maplibregl.Marker({
            color: options.color ?? '#e63946',
            draggable: options.draggable ?? false,
        })
            .setLngLat([lngLat[0], lngLat[1]])
            .addTo(this.map);
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
