import { p as e } from "./decorators-d8E4nZJy.js";
import "./tooltip-ARL5tKAI.js";
import "./icon-button-DxwGf0BN.js";
//#region src/components/internal/info-toggle.ts
function t(t, n) {
	return e`
        <sl-tooltip class="info-toggle" hoist placement="top-end" trigger="hover focus click">
            <div slot="content" class="info-toggle-text">${n}</div>
            <sl-icon-button name="info-circle" label=${`About ${t}`}></sl-icon-button>
        </sl-tooltip>
    `;
}
function n(e) {
	return !!e?.querySelector("sl-tooltip.info-toggle[open]");
}
//#endregion
export { t as n, n as t };
