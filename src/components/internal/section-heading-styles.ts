import { css } from 'lit';

/**
 * The heading of one section inside a tool panel — "Map engine", "From URL",
 * "Combine two layers" — for tools whose panel has more than one part.
 *
 * Small, uppercase and in the secondary colour, so it reads as a divider
 * rather than as a title: the panel title is 16px and dark, the description
 * under it 14px bold, and a section heading must not be mistaken for either.
 * One stylesheet for every tool, so the tools cannot drift apart again (they
 * had 14px, 12px, two letter-spacings and a Shoelace size variable). Only
 * the typography lives here; spacing around the heading stays with the tool,
 * since that depends on what the section contains.
 */
export const sectionHeadingStyles = css`
    .section-heading {
        font-size: var(--webmapx-font-size-sm, 0.75rem);
        font-weight: 600;
        line-height: 1.4;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #5a6773);
    }
`;
