import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState';

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

    static styles = css`
        :host {
            display: block;
            pointer-events: none;
        }
        .spinner-container {
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        }
        .spinner-container.visible {
            opacity: 1;
        }
        sl-spinner {
            font-size: 1.5rem;
            --track-width: 3px;
            --indicator-color: var(--sl-color-primary-600);
            --track-color: var(--sl-color-neutral-200);
        }
    `;

    protected onStateChanged(state: IAppState): void {
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
