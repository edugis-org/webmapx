import type { CatalogConfig, LayerConfig, SourceConfig } from '../config/types';
import type { ILayerService, ILogicalLayerExecutor, LayerInsertOptions } from './IMapInterfaces';

type PendingAddRequest = {
    layerId: string;
    layerConfig: LayerConfig;
    sourceConfig: SourceConfig;
    options?: LayerInsertOptions;
    resolve: (value: boolean) => void;
};

export class DeferredLogicalLayerExecutor implements ILogicalLayerExecutor {
    private layerService?: ILayerService;
    private pendingCatalog: CatalogConfig | null = null;
    private pendingAddRequests: PendingAddRequest[] = [];
    private pendingRemoveRequests: string[] = [];

    bind(layerService: ILayerService): void {
        this.layerService = layerService;
        this.flushPendingOperations();
    }

    setCatalog(catalog: CatalogConfig): void {
        this.pendingCatalog = catalog;
        this.layerService?.setCatalog(catalog);
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig, options?: LayerInsertOptions): Promise<boolean> {
        if (this.layerService) {
            return this.layerService.addLayer(layerId, layerConfig, sourceConfig, options);
        }

        return new Promise<boolean>((resolve) => {
            this.pendingAddRequests.push({ layerId, layerConfig, sourceConfig, options, resolve });
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

    private flushPendingOperations(): void {
        if (!this.layerService) {
            return;
        }

        if (this.pendingCatalog) {
            this.layerService.setCatalog(this.pendingCatalog);
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
                const success = await this.layerService!.addLayer(request.layerId, request.layerConfig, request.sourceConfig, request.options);
                request.resolve(success);
            } catch {
                request.resolve(false);
            }
        });
    }
}