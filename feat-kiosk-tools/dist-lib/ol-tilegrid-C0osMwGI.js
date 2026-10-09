import { t as e } from "./lib-CStxbLgN.js";
import { createFromCapabilitiesMatrixSet as t } from "ol/tilegrid/WMTS";
import { get as n } from "ol/proj";
import { fromEPSGCode as r, register as i } from "ol/proj/proj4";
//#region node_modules/@camptocamp/ogc-client/dist/wmts/ol-tilegrid.js
i(e);
async function a(e, i) {
	let a = n(e.crs);
	if (a ||= await r(e.crs), !a) throw Error(`[ogc-client] could not create OpenLayers tile grid, the following projection is unknown: ${e.crs}`);
	return t({
		SupportedCRS: a,
		TileMatrix: e.tileMatrices.map((e) => ({
			Identifier: e.identifier,
			ScaleDenominator: e.scaleDenominator,
			TopLeftCorner: e.topLeft,
			TileWidth: e.tileWidth,
			TileHeight: e.tileHeight,
			MatrixWidth: e.matrixWidth,
			MatrixHeight: e.matrixHeight
		}))
	}, null, i.map((e) => ({ TileMatrix: e.tileMatrix })));
}
//#endregion
export { a as buildOpenLayersTileGrid };
