import type { AnyLayerConfig } from '../config/types';
import type { ILayerService, ILogicalLayerExecutor, LayerInsertOptions } from './IMapInterfaces';

type PendingAddRequest = {
    layerConfig: AnyLayerConfig;
    options?: LayerInsertOptions;
    resolve: (value: boolean) => void;
};

export class DeferredLogicalLayerExecutor implements ILogicalLayerExecutor {
    private layerService?: ILayerService;
    private pendingAddRequests: PendingAddRequest[] = [];
    private pendingRemoveRequests: string[] = [];

    bind(layerService: ILayerService): void {
        this.layerService = layerService;
        this.flushPendingOperations();
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        if (this.layerService) {
            return this.layerService.addLayer(layerConfig, options);
        }

        return new Promise<boolean>((resolve) => {
            this.pendingAddRequests.push({ layerConfig, options, resolve });
        });
    }

    removeLayer(layerId: string): void {
        if (this.layerService) {
            this.layerService.removeLayer(layerId);
            return;
        }

        this.pendingRemoveRequests.push(layerId);
    }

    getVisibleLayers(): string[] {
        return this.layerService?.getVisibleLayers() ?? [];
    }

    isLayerVisible(layerId: string): boolean {
        return this.layerService?.isLayerVisible(layerId) ?? false;
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
