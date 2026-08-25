/**
 * The moment a map draws its computed layers for.
 *
 * Some layers are a function of time rather than a document on a server: where
 * night falls, where the sun stands, which latitudes get twelve hours of
 * daylight. Until now those always meant *now*, because the only clock in the
 * system was `new Date()` inside the generator that made the data.
 *
 * That is the one thing this module changes: the clock becomes a value a map
 * holds, so a time slider can move it, and so two maps on one page can stand at
 * two different moments without knowing about each other.
 *
 * There are exactly two states, and the second one does not tick:
 *
 *   live     what every map did before — the wall clock, and `?refresh=auto`
 *            sources keep themselves current against it.
 *   pinned   one instant, frozen. The refresh loop stops, `refresh=auto` is
 *            ignored, and the data moves only when `at` is set to something
 *            else. Playing an animation is therefore the slider's job, not the
 *            clock's: each step is an ordinary change of `at`.
 */
import type { MapTimeState } from '../store/IMapState';

/** The default for a map that has never been told otherwise. */
export const LIVE_TIME: MapTimeState = { mode: 'live' };

/**
 * The moment `state` stands for.
 *
 * A pinned time with an unusable `at` (NaN, or a number no Date can hold) falls
 * back to the wall clock rather than producing an Invalid Date: every generator
 * downstream would then quietly return an empty collection, which looks like a
 * broken layer rather than a broken clock.
 */
export function timeOf(state: MapTimeState | undefined): Date {
    if (state?.mode !== 'pinned') return new Date();
    const at = new Date(state.at);
    return Number.isNaN(at.getTime()) ? new Date() : at;
}

/** True when computed sources should keep themselves current on their own. */
export function isLive(state: MapTimeState | undefined): boolean {
    return state?.mode !== 'pinned';
}

/**
 * Whether two clock states would draw the same picture.
 *
 * Used to decide if a store update is worth recomputing every computed source
 * for; `live` never equals `live` here on purpose — a live map is moving, so
 * "unchanged" is not a claim this can make about it.
 */
export function isSamePinnedTime(a: MapTimeState | undefined, b: MapTimeState | undefined): boolean {
    return a?.mode === 'pinned' && b?.mode === 'pinned' && a.at === b.at;
}
