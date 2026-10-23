// src/utils/tool-accent.ts
//
// The colour a toolbar button carries, for styles that colour their tools
// (the `classroom` style draws each tool as a coloured tile).
//
// The default is assigned by *position*, not by tool. A fixed colour per tool
// looks fine on a full toolbar and goes wrong on every real config, which
// picks a handful of tools: four of the five could easily share one colour.
// Cycling the palette down the toolbar gives every config a varied rail, and
// `color` on a toolbar item overrides it — with a palette name, which follows
// the theme, or any CSS colour.

/** Palette order down a toolbar. Names are also what a config's `color` may say. */
export const TOOL_PALETTE = ['cyan', 'green', 'yellow', 'orange', 'purple', 'blue'] as const;
export type ToolPaletteName = typeof TOOL_PALETTE[number];

function paletteVar(name: ToolPaletteName): string {
  return `var(--webmapx-tool-palette-${name})`;
}

function isPaletteName(value: string): value is ToolPaletteName {
  return (TOOL_PALETTE as readonly string[]).includes(value);
}

/**
 * Turns a config `color` into a CSS value: a palette name becomes its token,
 * anything else is taken as a CSS colour when the browser accepts it.
 * Returns undefined for something unusable, so the caller falls back to the
 * positional default instead of drawing a transparent tile.
 */
export function resolveToolColor(color: unknown): string | undefined {
  if (typeof color !== 'string') return undefined;
  const value = color.trim();
  if (!value) return undefined;
  if (isPaletteName(value.toLowerCase())) return paletteVar(value.toLowerCase() as ToolPaletteName);
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && !CSS.supports('color', value)) {
    return undefined;
  }
  return value;
}

/**
 * Hands out accents down one toolbar. An explicit colour is used as given;
 * otherwise the next palette entry is taken, skipping one that would repeat
 * the colour of the button just above — so an override cannot accidentally
 * put two identical tiles next to each other.
 */
export class ToolAccentSequence {
  private next = 0;
  private previous: string | undefined;

  take(color: unknown): string {
    let accent = resolveToolColor(color);
    if (!accent) {
      accent = paletteVar(TOOL_PALETTE[this.next % TOOL_PALETTE.length]);
      this.next++;
      if (accent === this.previous) {
        accent = paletteVar(TOOL_PALETTE[this.next % TOOL_PALETTE.length]);
        this.next++;
      }
    }
    this.previous = accent;
    return accent;
  }
}
