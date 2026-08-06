import { css } from 'lit';

/**
 * The one recipe every floating piece of webmapx chrome uses — tool panels,
 * the toolbar rail, map control clusters, the scale bar, dialogs.
 *
 * Before this existed each of those drew its own box: different border,
 * different radius, different shadow, so the chrome read as several unrelated
 * widgets sitting on a map rather than one product. Composing a single
 * fragment also means a [data-style] preset retunes all of them at once —
 * that is what makes `atlas` translucent and `console` flat without either
 * style needing to know which components exist.
 *
 * Every value is a token with a literal fallback, so a component still
 * renders correctly when webmapx-style-core.css is not loaded.
 *
 * Two variants, because some components own their outer box via `:host`
 * and others draw a box inside their shadow root:
 *
 *   surfaceHostStyles  -> applies to :host
 *   surfaceStyles      -> applies to .webmapx-surface
 */

const RECIPE = css`
  background: rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1));
  -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
  backdrop-filter: var(--webmapx-surface-blur, none);
  border: var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec));
  border-radius: var(--webmapx-surface-radius, var(--webmapx-radius-md, 6px));
  box-shadow: var(--webmapx-surface-shadow, 0 4px 12px rgba(16, 24, 40, 0.12));
  color: var(--color-text-primary, #16202a);
`;

export const surfaceHostStyles = css`
  :host {
    ${RECIPE}
  }
`;

export const surfaceStyles = css`
  .webmapx-surface {
    ${RECIPE}
  }
`;

/**
 * Icon-button treatment shared by the toolbar rail and the map control
 * clusters, so a zoom button and a tool button feel like the same control.
 * Hit size follows the density axis: 40px under `atlas`, 30px under
 * `console` — the 40px default is the pointer-target minimum, which the
 * previous ~28px buttons did not meet.
 */
export const surfaceButtonStyles = css`
  .webmapx-surface-button {
    width: var(--webmapx-hit-size, 36px);
    height: var(--webmapx-hit-size, 36px);
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text-secondary, #5a6773);
    border-radius: var(--webmapx-radius-sm, 4px);
    cursor: pointer;
    transition:
      background-color 130ms ease,
      color 130ms ease;
  }

  .webmapx-surface-button:hover {
    background: var(--color-background-hover, rgba(22, 32, 42, 0.06));
    color: var(--color-text-primary, #16202a);
  }

  .webmapx-surface-button[aria-pressed='true'],
  .webmapx-surface-button.active {
    background: var(--color-primary, #2b6c8f);
    color: var(--color-on-primary, #fff);
  }

  .webmapx-surface-button:focus-visible {
    outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
    outline-offset: calc(-1 * var(--webmapx-focus-offset, 2px));
  }

  .webmapx-surface-button:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;
