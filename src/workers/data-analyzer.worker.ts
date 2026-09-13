import { analyzeDataset, type DatasetAnalysis } from '../utils/data-analyzer';

export interface DataAnalyzerRequest {
    properties: GeoJSON.GeoJsonProperties[];
    complete: boolean;
}

export type DataAnalyzerResponse =
    | { status: 'progress'; message: string }
    | { status: 'ok'; analysis: DatasetAnalysis }
    | { status: 'error'; message: string };

function post(response: DataAnalyzerResponse): void {
    self.postMessage(response);
}

self.onmessage = (event: MessageEvent<DataAnalyzerRequest>) => {
    try {
        post({ status: 'progress', message: `Calculating on ${event.data.properties.length} features...` });
        const features = event.data.properties.map(properties => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [0, 0] },
            properties,
        }));
        const analysis = analyzeDataset(features, event.data.complete);
        post({ status: 'ok', analysis });
    } catch (error) {
        post({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
};
