/**
 * The arithmetic under a time slider: a moment split into a date and a time of
 * day, and put back together again.
 *
 * All of it is UTC, and that is the point rather than a shortcut. The computed
 * layers are calculated in UTC, and a local day is where a time control quietly
 * breaks: across a daylight-saving boundary one local day is 23 or 25 hours
 * long, so a slider measured in local days skips an hour in spring and offers
 * the same hour twice in autumn. Local time is for reading, never for counting.
 *
 * Kept apart from the component so it can be tested without a DOM, and so a
 * second view on the same clock cannot invent its own version of the sums.
 */
export const MINUTES_PER_DAY = 24 * 60;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** UTC midnight of the day an instant falls in. */
export function startOfUtcDay(at: number): number {
    return Math.floor(at / MS_PER_DAY) * MS_PER_DAY;
}

/** Whole days from one instant's UTC day to another's, signed. */
export function dayOffset(from: number, to: number): number {
    return Math.round((startOfUtcDay(to) - startOfUtcDay(from)) / MS_PER_DAY);
}

/** Minutes past UTC midnight. */
export function minuteOfUtcDay(at: number): number {
    return Math.floor((at - startOfUtcDay(at)) / MS_PER_MINUTE);
}

/** The instant `days` from `origin`'s day, at `minute` past UTC midnight. */
export function instantAt(origin: number, days: number, minute: number): number {
    return startOfUtcDay(origin) + days * MS_PER_DAY + minute * MS_PER_MINUTE;
}

/** `2026-06-21` — the date, in the same UTC the computations use. */
export function formatUtcDate(at: number): string {
    return new Date(at).toISOString().slice(0, 10);
}

/** `12:00` — minutes past UTC midnight as a clock reading. */
export function formatMinute(minute: number): string {
    const wrapped = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const hours = String(Math.floor(wrapped / 60)).padStart(2, '0');
    return `${hours}:${String(wrapped % 60).padStart(2, '0')}`;
}


/**
 * The same date and time, a whole number of years away.
 *
 * Kept in calendar years rather than in days because that is what holds a
 * season still: 2 February 18:20 is the same point in the year whichever year
 * it is, while any fixed number of days drifts against the calendar.
 *
 * 29 February has no counterpart in a common year and lands on 1 March, which
 * is the ordinary consequence of asking for a date that does not exist.
 */
export function shiftYears(at: number, years: number): number {
    const date = new Date(at);
    date.setUTCFullYear(date.getUTCFullYear() + years);
    return date.getTime();
}
