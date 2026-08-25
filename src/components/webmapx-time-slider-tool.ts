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
    /** Ticks once a second while live, so the disabled sliders show time passing. */
    @state() private liveTick = Date.now();
    @state() private speedIndex = 2;
    @state() private playing = false;

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
        input[type="range"] { width: 100%; box-sizing: border-box; }
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
        .controls select { flex: 1; min-width: 0; }
        .hint {
            margin-top: 0.75rem;
            font-size: 0.8125rem;
            color: var(--color-text-secondary, #5a6773);
        }
        :host([disabled-controls]) .row,
        .disabled { color: var(--color-text-muted, #6b7681); }
    `;

    protected onMapAttached(): void {
        this.readTime(this.adapter?.store.getState().mapTime);
    }

    protected onStateChanged(state: IMapState): void {
        this.readTime(state.mapTime);
    }

    private readTime(mapTime: MapTimeState | undefined): void {
        this.mapTime = mapTime ?? { mode: 'live' };
        if (this.mapTime.mode === 'pinned') this.stopLiveTicking();
        else this.startLiveTicking();
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.origin = Date.now();
        if (isLive(this.mapTime)) this.startLiveTicking();
    }

    disconnectedCallback(): void {
        // The clock stays where the user put it — only this window on it closes.
        this.stopLiveTicking();
        this.stopPlaying();
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
        this.stopPlaying();
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

    private togglePlay(): void {
        if (this.playing) this.stopPlaying();
        else this.startPlaying();
    }

    /**
     * Advances the pinned moment for as long as play is on.
     *
     * Either way round, a step is an ordinary pin — playing goes down the same
     * path as dragging the slider, so the map has one reason to redraw rather
     * than two, and no second animation loop can race the refresh loop that
     * keeps a live map current.
     */
    private startPlaying(): void {
        if (this.mapTime.mode !== 'pinned') return;
        const speed = SPEEDS[this.speedIndex];
        this.playing = true;
        this.playLastFrame = Date.now();
        if (speed.discrete) this.startDiscretePlay(speed);
        else this.startSmoothPlay();
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
    private startSmoothPlay(): void {
        if (typeof requestAnimationFrame !== 'function') {
            // No frames to hang it on (a test, a headless run): fall back to the
            // discrete cadence rather than not playing at all.
            this.startDiscretePlay(SPEEDS[this.speedIndex]);
            return;
        }
        const frame = () => {
            if (!this.playing) return;
            const wall = Date.now();
            const elapsed = wall - this.playLastFrame;
            this.playLastFrame = wall;
            if (!this.advance((elapsed / 1000) * SPEEDS[this.speedIndex].perSecond)) return;
            this.playFrame = requestAnimationFrame(frame);
        };
        this.playFrame = requestAnimationFrame(frame);
    }

    /** Moves the pinned moment on, and stops at the end of the slider. */
    private advance(byMs: number): boolean {
        if (this.mapTime.mode !== 'pinned') {
            this.stopPlaying();
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
        const wasPlaying = this.playing;
        if (wasPlaying) this.stopPlaying();
        this.speedIndex = index;
        if (wasPlaying) this.startPlaying();
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
