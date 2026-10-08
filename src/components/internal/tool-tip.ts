import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * A tool's next step, shown on the map under the tool panel ("Click the map
 * to set the start point.").
 *
 * People act first and read later, and when they act they look at the map,
 * not the panel — so the one sentence that says what to do next sits there,
 * attached to the panel it belongs to, and the panel itself keeps only its
 * controls. Explanations of a field and empty states ("Add a layer with
 * countries or areas to the map first.") stay in the panel.
 *
 * A tool states its tip through the `toolTip` getter on `WebmapxBaseTool`;
 * this controller notices when that text changes and tells the panel, which
 * reads the active tool's tip and draws it. The panel pulls rather than being
 * told the text, so a tip is never left over from a tool that is not open,
 * and a container (toolbox, menu) can answer with its open sub-tool's tip.
 */
export const TOOL_TIP_CHANGE_EVENT = 'webmapx-tool-tip-change';

export interface ToolTipSource {
    readonly toolTip: string;
}

export class ToolTipNotifier implements ReactiveController {
    private last = '';

    constructor(private readonly host: ReactiveControllerHost & HTMLElement & ToolTipSource) {
        host.addController(this);
    }

    hostConnected(): void {
        // A tool can be re-attached with a different tip than it had; let the panel re-read.
        this.last = '';
    }

    hostUpdated(): void {
        const tip = this.host.toolTip;
        if (tip === this.last) return;
        this.last = tip;
        this.host.dispatchEvent(new CustomEvent(TOOL_TIP_CHANGE_EVENT, { bubbles: true, composed: true }));
    }
}
