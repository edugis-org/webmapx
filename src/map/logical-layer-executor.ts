import type { AnyLayerConfig } from '../config/types';
import type { ILayerService, ILogicalLayerExecutor, LayerInsertOptions } from './IMapInterfaces';
import { extractBaseOpacity } from './layer-opacity-utils';

type PendingAddRequest = {
    layerConfig: AnyLayerConfig;
    options?: LayerInsertOptions;
    resolve: (value: boolean) => void;
};

export class DeferredLogicalLayerExecutor implements ILogicalLayerExecutor {
    private layerService?: ILayerService;
    private pendingAddRequests: PendingAddRequest[] = [];
    private pendingRemoveRequests: string[] = [];
    /** Config-defined base opacity per logical layer id — the slider scales relative to this. */
    private baseOpacity: Map<string, number> = new Map();

    bind(layerService: ILayerService): void {
        this.layerService = layerService;
        this.flushPendingOperations();
    }

    unbind(): void {
        this.layerService = undefined;
        this.pendingAddRequests = [];
        this.pendingRemoveRequests = [];
        this.baseOpacity.clear();
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        this.baseOpacity.set(layerConfig.id, extractBaseOpacity(layerConfig));

        if (this.layerService) {
            return this.layerService.addLayer(layerConfig, options);
        }

        return new Promise<boolean>((resolve) => {
            this.pendingAddRequests.push({ layerConfig, options, resolve });
        });
    }

    removeLayer(layerId: string): void {
        this.baseOpacity.delete(layerId);

        if (this.layerService) {
            this.layerService.removeLayer(layerId);
            return;
        }

        this.pendingRemoveRequests.push(layerId);
    }

    moveLayer(layerId: string, beforeLayerId?: string | null): void {
        this.layerService?.moveLayer(layerId, beforeLayerId);
    }

    getVisibleLayers(): string[] {
        return this.layerService?.getVisibleLayers() ?? [];
    }

    isLayerVisible(layerId: string): boolean {
        return this.layerService?.isLayerVisible(layerId) ?? false;
    }

    setLayerVisibility(layerId: string, visible: boolean): void {
        this.layerService?.setLayerVisibility(layerId, visible);
    }

    setLayerOpacity(layerId: string, factor: number): void {
        const baseOpacity = this.baseOpacity.get(layerId) ?? 1;
        this.layerService?.setLayerOpacity(layerId, baseOpacity * factor);
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        return this.layerService?.getSourceData(sourceId) ?? null;
    }

    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean {
        return this.layerService?.setSourceData(sourceId, data) ?? false;
    }

    updateLayerStyle(layerId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean {
        return this.layerService?.updateLayerStyle(layerId, subLayerId, partialPaint) ?? false;
    }

    private flushPendingOperations(): void {
        if (!this.layerService) {
            return;
        }

        const pendingRemovals = [...this.pendingRemoveRequests];
        this.pendingRemoveRequests = [];
        for (const layerId of pendingRemovals) {
            this.layerService.removeLayer(layerId);
        }

        const pendingAdds = [...this.pendingAddRequests];
        this.pendingAddRequests = [];
        pendingAdds.forEach(async (request) => {
            try {
                const success = await this.layerService!.addLayer(request.layerConfig, request.options);
                request.resolve(success);
            } catch {
                request.resolve(false);
            }
        });
    }
}
