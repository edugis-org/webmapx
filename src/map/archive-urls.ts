/**
 * `pmtiles://` and `cog://` urls, the way the libraries that define them write them.
 *
 * Both wrap the address of one file that is read with HTTP range requests:
 * `pmtiles://https://host/zones.pmtiles`, `cog://https://host/dem.tif`. A
 * COG url may carry its rendering in the fragment, as maplibre-cog-protocol
 * reads it — `#color:<scheme>,<min>,<max>[,<modifiers>]` or `#dem` — so one
 * config means the same thing on every engine that can draw it.
 */

export type ArchiveProtocol = 'pmtiles' | 'cog';

/** `pmtiles` or `cog` when the url is addressed through one, otherwise null. */
export function archiveProtocolOf(url: unknown): ArchiveProtocol | null {
    if (typeof url !== 'string') return null;
    const match = /^(pmtiles|cog):\/\//.exec(url);
    return match ? match[1] as ArchiveProtocol : null;
}

/** The file's own address: protocol and fragment removed. */
export function archiveFileUrl(url: string): string {
    const inner = url.replace(/^(pmtiles|cog):\/\//, '');
    const hash = inner.indexOf('#');
    return hash >= 0 ? inner.slice(0, hash) : inner;
}

export interface CogColorRamp {
    scheme: string;
    min: number;
    max: number;
    continuous: boolean;
    reverse: boolean;
}

/** `#color:BrewerSpectral9,0,100,c-` → the ramp it names; null without a valid one. */
export function cogColorRamp(url: string): CogColorRamp | null {
    const match = /#color:([^,]+),([^,]+),([^,]+)(?:,([c-]*))?$/.exec(url);
    if (!match) return null;
    const min = Number(match[2]);
    const max = Number(match[3]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    const modifiers = match[4] ?? '';
    return { scheme: match[1], min, max, continuous: modifiers.includes('c'), reverse: modifiers.includes('-') };
}
