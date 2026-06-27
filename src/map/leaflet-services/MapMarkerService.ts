// src/map/leaflet-services/MapMarkerService.ts

import * as L from 'leaflet';
import type { LngLat } from '../../store/map-events';
import type { MarkerOptions } from '../IMapInterfaces';
import { pinSvg } from '../marker-utils';

function makeDivIcon(color: string): L.DivIcon {
    return L.divIcon({
        html: pinSvg(color),
        className: '',
        iconSize: [24, 36],
        iconAnchor: [12, 36],
    });
}

export class MapMarkerService {
    private markers = new Map<string, L.Marker>();

    constructor(private readonly map: L.Map) {}

    add(id: string, lngLat: LngLat, options: MarkerOptions = {}): void {
        this.remove(id);
        const color = options.color ?? '#e63946';
        const marker = L.marker([lngLat[1], lngLat[0]], {
            icon: makeDivIcon(color),
            draggable: options.draggable ?? false,
        }).addTo(this.map);

        if (options.onDrag) {
            marker.on('drag', () => {
                const pos = marker.getLatLng();
                options.onDrag!([pos.lng, pos.lat]);
            });
        }
        if (options.onDragEnd) {
            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                options.onDragEnd!([pos.lng, pos.lat]);
            });
        }

        this.markers.set(id, marker);
    }

    move(id: string, lngLat: LngLat): void {
        this.markers.get(id)?.setLatLng([lngLat[1], lngLat[0]]);
    }

    remove(id: string): void {
        const marker = this.markers.get(id);
        if (marker) {
            marker.remove();
            this.markers.delete(id);
        }
    }
}
