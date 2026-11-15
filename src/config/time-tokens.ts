/**
 * Time placeholders in a source url, for tile services that address their data
 * by moment instead of serving "now" at a fixed address.
 *
 *   {utcdatehour}   the hour as yyyyMMddHH in UTC, e.g. 2026110211
 *
 * Filled in from the map's clock when a layer is added, so a map pinned to a
 * moment asks for that moment. A live map keeps the hour it was added at: tiles
 * are addressed by it, and replacing a raster source's url on every hour would
 * make the layer flash for a change nobody asked to see.
 */
import { mapStringsDeep } from './apikeys';

const pad = (value: number): string => String(value).padStart(2, '0');

export function substituteTimeTokens(text: string, at: Date): string {
  if (!text.includes('{utcdatehour}')) return text;
  const stamp = `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}${pad(at.getUTCHours())}`;
  return text.replace(/\{utcdatehour\}/g, stamp);
}

/** `substituteTimeTokens` on every string in a layer or source. */
export function substituteTimeTokensDeep<T>(obj: T, at: Date): T {
  return mapStringsDeep(obj, (text) => substituteTimeTokens(text, at));
}
