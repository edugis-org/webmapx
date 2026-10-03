import { css } from 'lit';

/**
 * The heading of one section inside a tool panel — "Map engine", "From URL",
 * "Combine two layers" — for tools whose panel has more than one part.
 *
 * Small, uppercase and in the secondary colour, so it reads as a divider
 * rather than as a title: the panel title is 16px and dark, the description
 * under it 14px bold, and a section heading must not be mistaken for either.
 * One stylesheet for every tool, so the tools cannot drift apart again (they
 * had 14px, 12px, two letter-spacings and a Shoelace size variable).
 *
 * A section is a `<section class="panel-section">` starting with its
 * heading, and **a divider means exactly one thing: a new section starts
 * here**. It is drawn between two consecutive sections, never above the
 * first, so no tool has to say which section comes first; it has the
 * header line's colour and fixed spacing either side. No other lines inside
 * a panel — a line that separates nothing makes the reader look for what it
 * separates. (The header line, a tab strip's underline and a sum line above
 * a total are not dividers in this sense.)
 */
export const sectionHeadingStyles = css`
    .panel-section + .panel-section {
        margin-top: var(--webmapx-space-md, 0.75rem);
        padding-top: var(--webmapx-space-md, 0.75rem);
        border-top: 1px solid var(--color-border-light, #e2e7ec);
    }

    .section-heading {
        font-size: var(--webmapx-font-size-sm, 0.75rem);
        font-weight: 600;
        line-height: 1.4;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #5a6773);
    }
`;
