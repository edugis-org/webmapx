import { h as e } from "./decorators-d8E4nZJy.js";
//#region src/components/internal/control-surface-styles.ts
var t = e`
  sl-button::part(base),
  sl-select::part(combobox),
  sl-input::part(base),
  button.webmapx-control {
    background-image: var(--webmapx-control-bg-image, none);
  }

  /* Not on a focused field: Shoelace draws a field's focus ring as a
     box-shadow, and this rule — "none" in every style that sets no control
     shadow — switched the ring off in exactly the tools that import this
     sheet, while every other tool's fields kept it. */
  sl-button::part(base),
  sl-select:not(:focus-within)::part(combobox),
  sl-input:not(:focus-within)::part(base),
  button.webmapx-control {
    box-shadow: var(--webmapx-control-shadow, none);
  }

  button.webmapx-control {
    border-radius: var(--webmapx-radius-sm, 4px);
  }
`;
//#endregion
export { t };
