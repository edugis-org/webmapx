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

    protected onStateChanged(state: IMapState): void {
        this.busy = state.mapBusy;
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
