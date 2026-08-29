/**
 * Cartogram tool — the geoprocessing panel with one operation pinned.
 *
 * A cartogram earns its own place in the toolbar: it is a thing a teacher asks
 * for by name ("show me population as area"), not a step in a GIS workflow, and
 * hunting for it in a grid of fourteen operations is the wrong first experience.
 *
 * It is a subclass rather than a second component because every part below the
 * title is already built and tested here: picking a layer and its sub-layer,
 * listing the numeric attributes, the shared GDAL worker, the elapsed-time
 * feedback, cancelling, the warnings about viewport-limited input, and adding
 * the result as a layer. A parallel implementation would drift from this one
 * within a release.
 *
 * The maths lives in `utils/cartogram.ts`; the operation (inputs, parameters,
 * diagram) is a registry entry in `utils/geoprocessing-operations.ts`.
 *
 * Registration: one entry in tool-registry.ts (id 'cartogram'), plus its loader
 * in tool-loader.ts.
 */

import { customElement } from 'lit/decorators.js';
import { WebmapxGeoprocessingTool } from './webmapx-geoprocessing-tool';

@customElement('webmapx-cartogram-tool')
export class WebmapxCartogramTool extends WebmapxGeoprocessingTool {
    readonly toolId = 'cartogram';

    constructor() {
        super();
        this.pinnedOperation = 'cartogram';
    }
}
