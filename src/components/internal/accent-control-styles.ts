import { css } from 'lit';

/**
 * Lets a style colour a tool's selected controls in the tool's own accent —
 * the classroom style, where a panel continues the coloured button that
 * opened it (the 3D panel's 60° in purple, True area's Geodesic in cyan).
 *
 * The fill needs nothing here: the style remaps Shoelace's
 * `--sl-color-primary-500/600/700` on the tool element, and Shoelace's own
 * rules — hover, focus and active states included — pick that up by
 * inheritance. What a remap cannot fix is the *text* those rules pair with
 * it, so this sheet sets colour and nothing else:
 *
 *  - On a fill, Shoelace writes white (`--sl-color-neutral-0`), unreadable
 *    on cyan or yellow. `--webmapx-on-accent` gives the dark tile ink.
 *  - A text button uses the primary colour *as* text, and yellow text on a
 *    white panel is unreadable. `--webmapx-accent-text` returns it to body
 *    text. Its states are restated because a ::part rule from outside
 *    outranks Shoelace's inner :hover/:active; the fallbacks are Shoelace's
 *    own values, so a style that sets neither token renders exactly as before
 *    (bar a focused text button, which keeps its resting shade).
 *
 * A background is never set here, so no Shoelace state is overridden.
 */
export const accentControlStyles = css`
  sl-button[variant='primary']::part(base),
  sl-radio-button[checked]::part(button),
  sl-checkbox::part(checked-icon),
  sl-checkbox::part(indeterminate-icon) {
    color: var(--webmapx-on-accent, var(--sl-color-neutral-0));
  }

  sl-button[variant='text']::part(base) {
    color: var(--webmapx-accent-text, var(--sl-color-primary-600));
  }

  sl-button[variant='text']:hover::part(base) {
    color: var(--webmapx-accent-text, var(--sl-color-primary-500));
  }

  sl-button[variant='text']:active::part(base) {
    color: var(--webmapx-accent-text, var(--sl-color-primary-700));
  }
`;
