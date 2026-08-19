/**
 * `go-cart-wasm` ships no types. Only the two pieces the cartogram uses are
 * declared: the initialiser (which optionally takes Emscripten's `locateFile`,
 * needed because the bundler renames the .wasm file) and `makeCartogram`.
 */
declare module 'go-cart-wasm' {
    interface GoCart {
        makeCartogram(
            input: GeoJSON.FeatureCollection,
            fieldName: string,
        ): GeoJSON.FeatureCollection;
    }

    export default function initGoCart(config?: {
        locateFile?: (path: string) => string;
    }): Promise<GoCart>;
}
