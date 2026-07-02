import { css } from 'lit';

/**
 * Style-preset hooks for Shoelace controls rendered inside a component's
 * shadow root. Document-level CSS (webmapx-style-core.css) cannot reach
 * into shadow roots, but custom properties inherit through them — so
 * components compose this fragment into `static styles` to pick up the
 * control tokens set by the active [data-style] preset. All declarations
 * are no-ops (`none`) when the tokens are unset.
 */
export const controlSurfaceStyles = css`
  sl-button::part(base),
  sl-select::part(combobox),
  sl-input::part(base),
  button.webmapx-control {
    background-image: var(--webmapx-control-bg-image, none);
    box-shadow: var(--webmapx-control-shadow, none);
  }

  button.webmapx-control {
    border-radius: var(--webmapx-radius-sm, 4px);
  }
`;
