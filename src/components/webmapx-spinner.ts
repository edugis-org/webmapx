import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { WebmapxBaseTool } from './webmapx-base-tool';
import { IMapState } from '../store/IMapState';

/**
 * A spinner overlay that shows when the map is busy loading tiles or rendering.
 *
 * Place this component inside a `<webmapx-map>` element. It will automatically
 * show when the map is loading and hide when idle.
 *
 * @example
 * ```html
 * <webmapx-map>
 *   <div slot="map-view"></div>
 *   <webmapx-spinner></webmapx-spinner>
 * </webmapx-map>
 * ```
 */
@customElement('webmapx-spinner')
export class WebmapxSpinner extends WebmapxBaseTool {
    @state() private busy = false;

    /** Render at a smaller size, suitable for inline use next to text. */
    @property({ type: Boolean, reflect: true }) small = false;

    /** Render in black/white instead of the themed primary color. */
    @property({ type: Boolean, reflect: true }) nocolor = false;

    static styles = css`
        :host {
            display: block;
            --webmapx-pointer-events: none;
            pointer-events: none;
        }
        .spinner-container {
            z-index: 1000;
            opacity: 0;
            transition: opacity var(--webmapx-motion-base, 200ms) ease-in-out;
        }
        .spinner-container.visible {
            opacity: 1;
        }
        sl-spinner {
            font-size: 1.5rem;
            --track-width: 3px;
            --indicator-color: var(--sl-color-primary-600);
            --track-color: var(--color-border-light, #e2e7ec);
        }
        :host([small]) sl-spinner {
            font-size: 1em;
            --track-width: 2px;
        }
        :host([nocolor]) sl-spinner {
            --indicator-color: var(--color-text-primary, #16202a);
            --track-color: var(--color-border, #d5dce3);
        }
    `;

    /**
     * Busy, except while the map's clock is playing.
     *
     * The engines report busy on `dataloading` and clear it on `idle`. An
     * animation never reaches idle — every frame pins a new moment, every
     * computed source is rebuilt, and the map is drawing again before it can
     * settle — so whatever was loading when play started latches the spinner on
     * for as long as play lasts, which reads as a map stuck loading rather than
     * a map running.
     *
     * Suppressing it here rather than at the engines keeps `mapBusy` an honest
     * report of what the engine said, and follows the same reasoning as
     * `BaseAdapter.silenceComputedSource`: a redraw that fetches nothing is not
     * a wait anyone is having, and a spinner that is always on is worse than no
     * spinner. Tiles genuinely loading mid-animation go unreported for the
     * duration; the moving picture already shows the map is working.
     */
    protected onStateChanged(state: IMapState): void {
        this.busy = state.mapBusy && !state.mapTimePlay;
    }

    render() {
        return html`
            <div class="spinner-container ${this.busy ? 'visible' : ''}">
                <sl-spinner></sl-spinner>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-spinner': WebmapxSpinner;
    }
}
