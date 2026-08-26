import { html, css, svg, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState, MapTimeState } from '../store/IMapState';
import { isLive } from '../utils/map-clock';
import {
    MINUTES_PER_DAY,
    MS_PER_MINUTE,
    dayOffset,
    formatMinute,
    formatUtcDate,
    instantAt,
    minuteOfUtcDay,
    shiftYears,
} from '../utils/time-slider-math';

/**
 * When the map is.
 *
 * Several layers are a function of the moment rather than a document on a
 * server — where night falls, where the sun and moon stand, which latitudes get
 * twelve hours of daylight. Until this tool they always meant *now*, which
 * answers "what is happening" and cannot answer "what changes over a day" or
 * "why is a Norwegian summer like that", the two questions the layers exist for.
 *
 * There is one switch, and it is called Now.
 *
 *   on    The map runs with the clock. This is what every map did before, and
 *         what it goes back to. Now is not a moment you can hold — it moves —
 *         so it is a state, not a position on a slider.
 *   off   The map is frozen at whatever moment it was, and the sliders do
 *         something. The instant it is frozen at is already the past; calling
 *         that "now" would be a small lie in every reading of the map.
 *
 * The clock itself lives in the map's store (`mapTime`), not in this component,
 * so a chosen moment survives closing the panel, and two maps on one page can
 * stand at two different moments. This tool is a window onto that value.
 *
 * Playing is deliberately the slider's job rather than the clock's: pressing
 * play advances the slider, and every step is an ordinary change of the pinned
 * moment. That keeps one path through the code — the map moves because the
 * slider moved — instead of a second animation loop racing the refresh loop
 * that keeps a live map current.
 */

/** How far either side of today the date slider reaches. */
const DATE_RANGE_DAYS = 183;
/**
 * How far the year picker reaches either way.
 *
 * The sliders cover a year between them, which is the right grain for a day and
 * a season but no use for anything that plays out over longer — the moon's
 * north-south swing runs on an 18.6-year cycle, so 2024 and 2034 look quite
 * different. Twenty years covers one of those, which is the point of having it.
 */
const YEAR_RANGE = 10;

/**
 * How fast play moves the map, and whether it does so smoothly.
 *
 * Smooth is the default and the better picture: the moment advances with the
 * frames, so the terminator slides and the sun tracks. What breaks it is step
 * size, not frame rate — at a day per second every frame is a different date,
 * each one recomputing every computed source, and sixty unrelated days a
 * second read as a flicker rather than as a sequence. Nothing renders that
 * away, because the picture genuinely changes that much between frames.
 *
 * So only the day step is discrete: one clean day a second, which reads as
 * "this day, then the next" — what a season is watched for. The rest run as
 * fast as the machine manages.
 */
const DISCRETE_STEP_MS = 1000;

interface Speed {
    label: string;
    /** Map time per real second. */
    perSecond: number;
    /** One whole step a second instead of a smooth advance. */
    discrete?: boolean;
}

const SPEEDS: Speed[] = [
    { label: '1 minute', perSecond: MS_PER_MINUTE },
    { label: '10 minutes', perSecond: 10 * MS_PER_MINUTE },
    { label: '1 hour', perSecond: 60 * MS_PER_MINUTE },
    { label: '1 day', perSecond: MINUTES_PER_DAY * MS_PER_MINUTE, discrete: true },
];

/**
 * The listed speed a raw rate is, or the nearest one below it.
 *
 * A speed arriving from the store (a permalink, another window on the same map)
 * need not be one of the four in the menu, and the only thing the loop actually
 * needs from the list is the *cadence*: whether to step whole days or run with
 * the frames. Falls back to the slowest entry, which is smooth — an unlisted
 * rate is far likelier to be a fine one than a day at a time.
 */
function speedFor(perSecond: number): Speed {
    const exact = SPEEDS.find(s => s.perSecond === perSecond);
    if (exact) return exact;
    return { label: `${perSecond} ms`, perSecond, discrete: perSecond >= SPEEDS[3].perSecond };
}

/** The menu entry closest to a rate, so a restored speed shows in the control. */
function speedIndexFor(perSecond: number): number {
    let best = 0;
    for (let i = 1; i < SPEEDS.length; i++) {
        if (Math.abs(SPEEDS[i].perSecond - perSecond) < Math.abs(SPEEDS[best].perSecond - perSecond)) best = i;
    }
    return best;
}

/** ▶ and ❚❚, drawn rather than spelled: the two most universally read buttons there are. */
const PLAY_ICON = svg`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M4 2.5v11l9-5.5z" fill="currentColor"/>
</svg>`;
const PAUSE_ICON = svg`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <rect x="4" y="2.5" width="3" height="11" fill="currentColor"/>
    <rect x="9" y="2.5" width="3" height="11" fill="currentColor"/>
</svg>`;

@customElement('webmapx-time-slider-tool')
export class WebmapxTimeSliderTool extends WebmapxBaseTool {
    /** The map's clock, mirrored so the controls can render before a change. */
    @state() private mapTime: MapTimeState = { mode: 'live' };
    /**
     * The day the sliders are measured from — fixed when the panel opens rather
     * than tracking the real date, so the position under the thumb does not
     * drift while the tool is open.
     */
    @state() private origin = Date.now();
    /**
     * The year the picker is centred on, fixed while the panel is open.
     *
     * Separate from `origin`, which moves with every jump so the date slider
     * stays usable — a list that moved with it would slide under the selection.
     */
    @state() private anchorYear = new Date().getUTCFullYear();
    /** Ticks once a second while live, so the disabled sliders show time passing. */
    @state() private liveTick = Date.now();
    @state() private speedIndex = 2;
    @state() private playing = false;
    /** The store's play speed as this component last acted on it. */
    private playSpeedMs: number | null = null;

    private liveTimer: ReturnType<typeof setInterval> | null = null;
    private playTimer: ReturnType<typeof setInterval> | null = null;
    private playFrame: number | null = null;
    private playLastFrame = 0;

    static styles = css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .now {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
        }
        .now input { margin: 0; }
        .moment {
            font-variant-numeric: tabular-nums;
            margin-bottom: 0.75rem;
        }
        .moment .local {
            display: block;
            font-weight: 400;
            color: var(--color-text-secondary, #5a6773);
        }
        .row { margin-bottom: 0.75rem; }
        .row > label {
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }
        .row .value { font-variant-numeric: tabular-nums; }
        input[type="range"], select { width: 100%; box-sizing: border-box; }
        .controls { display: flex; align-items: center; gap: 0.5rem; }
        .controls .play {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 2rem;
            padding: 0.25rem 0.4rem;
            line-height: 0;
        }
        .controls .per { color: var(--color-text-secondary, #5a6773); white-space: nowrap; }
        .controls select { flex: 1; min-width: 0; width: auto; }
        .hint {
            margin-top: 0.75rem;
            font-size: 0.8125rem;
            color: var(--color-text-secondary, #5a6773);
        }
        :host([disabled-controls]) .row,
        .disabled { color: var(--color-text-muted, #6b7681); }
    `;

    protected onMapAttached(): void {
        const state = this.adapter?.store.getState();
        this.readTime(state?.mapTime, state?.mapTimePlay);
    }

    protected onStateChanged(state: IMapState): void {
        this.readTime(state.mapTime, state.mapTimePlay);
    }

    /**
     * Follows the map's clock, playback included.
     *
     * The store is the single source of truth for *whether* the moment is
     * moving: the buttons dispatch and this reacts, so a permalink that opens a
     * map already playing goes down exactly the same path as pressing play, and
     * there is no second copy of "am I playing" to fall out of step.
     */
    private readTime(mapTime: MapTimeState | undefined, play: number | null | undefined): void {
        this.mapTime = mapTime ?? { mode: 'live' };
        if (this.mapTime.mode === 'pinned') this.stopLiveTicking();
        else this.startLiveTicking();
        this.readPlay(this.mapTime.mode === 'pinned' ? play ?? null : null);
    }

    private readPlay(play: number | null): void {
        // Every step of playing dispatches a new `at`, which lands back here —
        // so an unchanged speed must do nothing at all, or the loop would tear
        // itself down and rebuild on every frame.
        if (play === this.playSpeedMs) return;
        this.playSpeedMs = play;
        this.stopPlaying();
        if (play === null || play <= 0) return;
        // A speed set from elsewhere (a permalink, a second panel) has to show
        // in the menu, or the control would disagree with what the map is doing.
        this.speedIndex = speedIndexFor(play);
        this.startPlaying(play);
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.origin = Date.now();
        this.anchorYear = new Date().getUTCFullYear();
        if (isLive(this.mapTime)) this.startLiveTicking();
    }

    disconnectedCallback(): void {
        // The clock stays where the user put it — only this window on it closes.
        // The store keeps the play speed, so `playSpeedMs` is cleared too:
        // otherwise a reconnected element would see the same value it last
        // acted on, take it for no change, and never restart the loop.
        this.stopLiveTicking();
        this.stopPlaying();
        this.playSpeedMs = null;
        super.disconnectedCallback();
    }

    /**
     * Keeps the disabled sliders showing the time going by.
     *
     * A frozen "now" under a switch labelled Now would be the one reading that
     * makes the control ambiguous, and this is the cheapest way to show that
     * now is a moving thing: one repaint a second, only while live and only
     * while the panel is open.
     */
    private startLiveTicking(): void {
        if (this.liveTimer !== null || typeof setInterval !== 'function') return;
        this.liveTimer = setInterval(() => { this.liveTick = Date.now(); }, 1000);
    }

    private stopLiveTicking(): void {
        if (this.liveTimer !== null) clearInterval(this.liveTimer);
        this.liveTimer = null;
    }

    /** The instant the controls are showing, live or pinned. */
    private get shownAt(): number {
        return this.mapTime.mode === 'pinned' ? this.mapTime.at : this.liveTick;
    }

    private setMapTime(next: MapTimeState): void {
        this.adapter?.store.dispatch({ mapTime: next }, 'UI');
    }

    private toggleNow(now: boolean): void {
        // Going live ends playback for good — the wall clock is already moving,
        // so there is nothing left for a speed to mean.
        this.setPlaySpeed(null);
        if (now) {
            this.setMapTime({ mode: 'live' });
            return;
        }
        // Freezing keeps the picture exactly as it is; only from the next tick
        // on is it a moment in the past rather than the present.
        this.origin = Date.now();
        this.setMapTime({ mode: 'pinned', at: Date.now() });
    }

    private pinTo(at: number): void {
        this.setMapTime({ mode: 'pinned', at });
    }

    /**
     * Jumps to the same date and time in another year.
     *
     * The date slider is measured from `origin`, so that moves with it —
     * otherwise picking a year ten back would leave the thumb pinned against an
     * end it can never come away from.
     */
    private setYear(year: number): void {
        const at = shiftYears(this.shownAt, year - new Date(this.shownAt).getUTCFullYear());
        this.origin = at;
        this.pinTo(at);
    }

    /** Asks the map to start or stop moving; the loop follows from the store. */
    private togglePlay(): void {
        this.setPlaySpeed(this.playing ? null : SPEEDS[this.speedIndex].perSecond);
    }

    private setPlaySpeed(perSecond: number | null): void {
        this.adapter?.store.dispatch({ mapTimePlay: perSecond }, 'UI');
    }

    /**
     * Advances the pinned moment for as long as play is on.
     *
     * Either way round, a step is an ordinary pin — playing goes down the same
     * path as dragging the slider, so the map has one reason to redraw rather
     * than two, and no second animation loop can race the refresh loop that
     * keeps a live map current.
     */
    private startPlaying(perSecond: number): void {
        if (this.mapTime.mode !== 'pinned') return;
        const speed = speedFor(perSecond);
        this.playing = true;
        this.playLastFrame = Date.now();
        if (speed.discrete) this.startDiscretePlay(speed);
        else this.startSmoothPlay(speed);
    }

    /** One whole step a second: a day at a time, legible instead of a flicker. */
    private startDiscretePlay(speed: Speed): void {
        if (typeof setInterval !== 'function') return;
        this.playTimer = setInterval(() => this.advance(speed.perSecond), DISCRETE_STEP_MS);
    }

    /**
     * As many steps a second as the machine manages.
     *
     * Driven by elapsed wall time rather than by a fixed amount per frame, so a
     * slow machine covers the same ground in the same time — it just does so in
     * fewer, larger steps — and an hour per second stays an hour per second on
     * every display refresh rate.
     */
    private startSmoothPlay(speed: Speed): void {
        if (typeof requestAnimationFrame !== 'function') {
            // No frames to hang it on (a test, a headless run): fall back to the
            // discrete cadence rather than not playing at all.
            this.startDiscretePlay(speed);
            return;
        }
        const frame = () => {
            if (!this.playing) return;
            const wall = Date.now();
            const elapsed = wall - this.playLastFrame;
            this.playLastFrame = wall;
            if (!this.advance((elapsed / 1000) * speed.perSecond)) return;
            this.playFrame = requestAnimationFrame(frame);
        };
        this.playFrame = requestAnimationFrame(frame);
    }

    /** Moves the pinned moment on, and stops at the end of the slider. */
    private advance(byMs: number): boolean {
        if (this.mapTime.mode !== 'pinned') {
            this.setPlaySpeed(null);
            return false;
        }
        let next = this.mapTime.at + byMs;
        // Running off the end wraps to the other, so the seasons come round
        // again and a loop never has to be restarted by hand. It wraps by a
        // *calendar* year rather than by the width of the slider: the same date
        // and time one year earlier is the same season and the same time of day,
        // where a fixed number of days is neither — 366 days would walk the
        // seasons forward by about three quarters of a day a lap, and 365 would
        // walk them back by a quarter.
        while (dayOffset(this.origin, next) > DATE_RANGE_DAYS) next = shiftYears(next, -1);
        while (dayOffset(this.origin, next) < -DATE_RANGE_DAYS) next = shiftYears(next, 1);
        this.pinTo(next);
        return true;
    }

    private stopPlaying(): void {
        this.playing = false;
        if (this.playTimer !== null) clearInterval(this.playTimer);
        this.playTimer = null;
        if (this.playFrame !== null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this.playFrame);
        }
        this.playFrame = null;
    }

    /** Switching speed mid-play swaps the cadence the new speed needs. */
    private setSpeed(index: number): void {
        this.speedIndex = index;
        if (this.playing) this.setPlaySpeed(SPEEDS[index].perSecond);
    }

    render(): TemplateResult {
        const live = isLive(this.mapTime);
        const at = this.shownAt;
        const days = dayOffset(this.origin, at);
        const minute = minuteOfUtcDay(at);
        const local = new Date(at).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        const shownYear = new Date(at).getUTCFullYear();
        // Centred on the year the panel opened at, and left there. Recentring on
        // the year *showing* moves the list under the selection: pick ten years
        // back and the list slides ten years with it, so the option now under
        // the cursor is twenty years back and the control disagrees with the map.
        const years: number[] = [];
        const from = Math.min(this.anchorYear - YEAR_RANGE, shownYear);
        const to = Math.max(this.anchorYear + YEAR_RANGE, shownYear);
        for (let year = from; year <= to; year++) years.push(year);

        return html`
            <div class="now">
                <input type="checkbox" id="time-now" .checked=${live}
                    @change=${(e: Event) => this.toggleNow((e.target as HTMLInputElement).checked)}>
                <label for="time-now">Now</label>
            </div>

            <div class="moment">
                ${formatUtcDate(at)} ${formatMinute(minute)} UTC
                <span class="local">${local} local</span>
            </div>

            <div class="row ${live ? 'disabled' : ''}">
                <label for="time-year">
                    <span>Year</span>
                </label>
                <select id="time-year" ?disabled=${live} .value=${String(shownYear)}
                    @change=${(e: Event) => this.setYear(Number((e.target as HTMLSelectElement).value))}>
                    ${years.map((year) => html`
                        <option value=${year} ?selected=${year === shownYear}>${year}</option>`)}
                </select>
            </div>

            <div class="row ${live ? 'disabled' : ''}">
                <label for="time-date">
                    <span>Date</span>
                    <span class="value">${formatUtcDate(at)}</span>
                </label>
                <input type="range" id="time-date"
                    min=${-DATE_RANGE_DAYS} max=${DATE_RANGE_DAYS} step="1"
                    .value=${String(days)} ?disabled=${live}
                    @input=${(e: Event) => this.pinTo(
                        instantAt(this.origin, Number((e.target as HTMLInputElement).value), minute),
                    )}>
            </div>

            <div class="row ${live ? 'disabled' : ''}">
                <label for="time-minute">
                    <span>Time of day (UTC)</span>
                    <span class="value">${formatMinute(minute)}</span>
                </label>
                <input type="range" id="time-minute"
                    min="0" max=${MINUTES_PER_DAY - 1} step="1"
                    .value=${String(minute)} ?disabled=${live}
                    @input=${(e: Event) => this.pinTo(
                        instantAt(this.origin, days, Number((e.target as HTMLInputElement).value)),
                    )}>
            </div>

            <div class="controls">
                <button type="button" class="play" ?disabled=${live}
                    aria-label=${this.playing ? 'Pause' : 'Play'}
                    title=${this.playing ? 'Pause' : 'Play'}
                    @click=${() => this.togglePlay()}>
                    ${this.playing ? PAUSE_ICON : PLAY_ICON}
                </button>
                <select aria-label="Step per second" ?disabled=${live}
                    @change=${(e: Event) => this.setSpeed(Number((e.target as HTMLSelectElement).value))}>
                    ${SPEEDS.map((speed, index) => html`
                        <option value=${index} ?selected=${index === this.speedIndex}>${speed.label}</option>`)}
                </select>
                <span class="per">per second</span>
            </div>

            <div class="hint">
                ${live
                    ? 'The map runs with the clock. Switch Now off to choose a moment.'
                    : 'Frozen. Switch Now on to run with the clock again.'}
            </div>
        `;
    }
}
