import { shapefileToGeoJSON } from '../utils/shapefile';

export interface ShapefileWorkerRequest {
  shpBuffer: ArrayBuffer;
  dbfBuffer: ArrayBuffer | null;
  prjText: string | null;
}

export interface ShapefileWorkerResponse {
  success: boolean;
  data?: GeoJSON.FeatureCollection;
  error?: string;
}

self.onmessage = (e: MessageEvent<ShapefileWorkerRequest>) => {
  const { shpBuffer, dbfBuffer, prjText } = e.data;
  try {
    const data = shapefileToGeoJSON(shpBuffer, dbfBuffer, prjText);
    (self as unknown as Worker).postMessage({ success: true, data } satisfies ShapefileWorkerResponse);
  } catch (error) {
    (self as unknown as Worker).postMessage({ success: false, error: String(error) } satisfies ShapefileWorkerResponse);
  }
};
