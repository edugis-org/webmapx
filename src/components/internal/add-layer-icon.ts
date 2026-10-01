import { html, css } from 'lit';

/**
 * The "add as map layer" icon: a layer stack with a plus badge. One shape for
 * every tool that turns a result into a legend layer (search, measure), so the
 * same action looks the same wherever it is offered.
 *
 * `addLayerToggleStyles` styles it as the round `.layer-toggle` button both
 * tools put next to the thing it adds, including the added state
 * (`data-added="true"`: green check instead of plus). One stylesheet, so the
 * button cannot drift apart between tools.
 */
export const addLayerIcon = html`
    <svg class="add-layer-icon" viewBox="0 0 22 22" aria-hidden="true">
      <path class="stack-top" d="M8 2.4 L13.6 5.6 L8 8.8 L2.4 5.6 Z"/>
      <path class="stack-mid" d="M3 8.2 L8 11 L13 8.2"/>
      <path class="stack-bot" d="M3 10.6 L8 13.4 L13 10.6"/>
      <circle class="badge-circle" cx="15.6" cy="15.6" r="6"/>
      <path class="badge-plus" d="M15.6 12.1V19.1M12.1 15.6H19.1"/>
      <path class="badge-check" d="M12.3 15.8 L14.5 18 L19 12.9"/>
    </svg>
`;

export const addLayerToggleStyles = css`
    .add-layer-icon { overflow: visible; }
    .add-layer-icon .stack-top {
      fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linejoin: round; opacity: .85;
    }
    .add-layer-icon .stack-mid, .add-layer-icon .stack-bot {
      fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; opacity: .6;
    }
    .add-layer-icon .badge-circle {
      fill: var(--color-primary, #2b6c8f); stroke: var(--color-surface, #fff); stroke-width: 1.5;
    }
    .add-layer-icon .badge-plus { stroke: var(--color-on-primary, #fff); stroke-width: 2.3; stroke-linecap: round; }
    .add-layer-icon .badge-check {
      display: none;
      stroke: var(--color-on-primary, #fff); stroke-width: 2.3; stroke-linecap: round; stroke-linejoin: round; fill: none;
    }

    /* The stack sits small and muted, upper-left — it identifies "a map
       layer" but is deliberately not the thing the eye lands on. The badge
       is the whole point: a big, high-contrast plus that reads as "add"
       before the layer glyph even registers. It is a switch: once added the
       badge becomes a green check and the same button removes the layer
       again, so the row keeps the control rather than sending the user to
       the layer overview to undo what they did here. State is carried by
       shape as well as colour (plus vs check), not colour alone. */
    .layer-toggle {
      flex: 0 0 auto;
      width: 2.05rem;
      height: 2.05rem;
      border-radius: 50%;
      border: none;
      background: transparent;
      padding: 0;
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--color-text-muted, #6b7681);
    }
    .layer-toggle:hover {
      background: var(--color-background-hover, rgba(22, 32, 42, 0.06));
      color: var(--color-primary, #2b6c8f);
    }
    .layer-toggle:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }
    .layer-toggle svg { width: 1.5rem; height: 1.5rem; }
    .layer-toggle:hover .badge-circle { fill: var(--color-primary-hover, #21566f); }
    .layer-toggle[data-added="true"] { color: var(--color-primary, #2b6c8f); }
    .layer-toggle[data-added="true"] .stack-top {
      fill: var(--color-primary, #2b6c8f); stroke: var(--color-primary, #2b6c8f); opacity: 1;
    }
    .layer-toggle[data-added="true"] .stack-mid, .layer-toggle[data-added="true"] .stack-bot { opacity: .85; }
    .layer-toggle[data-added="true"] .badge-circle { fill: var(--color-success, #1c7c4a); }
    .layer-toggle[data-added="true"]:hover .badge-circle { filter: brightness(0.92); }
    .layer-toggle[data-added="true"] .badge-plus { display: none; }
    .layer-toggle[data-added="true"] .badge-check { display: inline; }
    /* Nothing to add yet (a measurement still without a segment) */
    .layer-toggle:disabled { cursor: default; opacity: .4; background: transparent; }
    .layer-toggle:disabled .badge-circle { fill: var(--color-primary, #2b6c8f); }
`;
