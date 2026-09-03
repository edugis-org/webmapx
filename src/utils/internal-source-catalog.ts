/**
 * What each computed layer is, in words — the reference the documentation renders.
 *
 * The generators in `internal-sources.ts` are the code; this is what a config
 * author needs to know before naming one: what it draws, which query parameters
 * it takes, and whether it follows the map's clock. It is deliberately separate
 * from the generator map, so the documentation build can read it without
 * importing the astronomy, the plate rotations and the 4 MB of data behind
 * them — the docs generator loads the config entry point, which has no DOM.
 *
 * `tests/internal-source-catalog.test.ts` asserts that this list and
 * `INTERNAL_SOURCES` name exactly the same generators, so a new computed layer
 * cannot ship undocumented and a removed one cannot linger in the reference.
 */

export interface InternalSourceParamDoc {
    /** Query-string key, as written in the url. */
    name: string;
    /** What it does, in one line. */
    summary: string;
    /** What happens when it is left out. */
    fallback?: string;
}

export interface InternalSourceDoc {
    /** The name after `internalfunc://`. */
    id: string;
    /** Short human name, for a heading. */
    label: string;
    /** The group it belongs to in the reference. */
    category: 'sun' | 'moon' | 'earth' | 'projection' | 'tides' | 'geodesy' | 'grids' | 'deep-time';
    /** What it draws, and what the shapes mean. */
    summary: string;
    /** The geometry a reader should expect to style. */
    geometry: string;
    /**
     * Whether the picture changes with the map's clock.
     *
     * `always` recomputes on every clock change; `never` is the same picture
     * whatever the moment. A url that pins its own `?at=` stops following the
     * clock whatever this says — that is what `followsMapClock` decides.
     */
    clock: 'always' | 'never';
    params: InternalSourceParamDoc[];
    /** A url worth copying into a config. */
    example: string;
}

const AT: InternalSourceParamDoc = {
    name: 'at',
    summary: 'An ISO instant to pin this layer to, so a time slider leaves it alone.',
    fallback: 'the map’s clock',
};

export const INTERNAL_SOURCE_DOCS: InternalSourceDoc[] = [
    {
        id: 'day-night',
        label: 'Day and night',
        category: 'sun',
        summary: 'The bands of daylight, the three twilights and night, as they stand at the moment shown. The terminator is the edge between the first two.',
        geometry: 'Polygons, one band per light level',
        clock: 'always',
        params: [AT],
        example: 'internalfunc://day-night?refresh=auto',
    },
    {
        id: 'sun-position',
        label: 'Sun position',
        category: 'sun',
        summary: 'The subsolar point: the one place on Earth with the sun straight overhead.',
        geometry: 'A single point',
        clock: 'always',
        params: [AT],
        example: 'internalfunc://sun-position?refresh=auto',
    },
    {
        id: 'sun-path',
        label: 'Sun path',
        category: 'sun',
        summary: 'The track the subsolar point takes, a line per day — the figure that makes the sun’s yearly north–south swing one picture instead of a moving dot.',
        geometry: 'Lines, one per day drawn',
        clock: 'never',
        params: [
            { name: 'year', summary: 'Draw a whole calendar year.', fallback: 'the half-cycle around the current moment' },
            { name: 'step', summary: 'Degrees between points along each line.' },
            { name: 'span', summary: '`year` for the full year; otherwise solstice to solstice.' },
            AT,
        ],
        example: 'internalfunc://sun-path?year=2026&step=2',
    },
    {
        id: 'day-length',
        label: 'Day length',
        category: 'sun',
        summary: 'Where the day is a given number of hours long today — the polar-night and midnight-sun lines are the 0 and 24 hour cases.',
        geometry: 'Lines, one per hour value',
        clock: 'always',
        params: [
            { name: 'hours', summary: 'Comma-separated hour values to draw.', fallback: 'a standard spread' },
            AT,
        ],
        example: 'internalfunc://day-length?hours=0,6,12,18,24',
    },
    {
        id: 'solar-time',
        label: 'Solar time',
        category: 'sun',
        summary: 'The meridians where the sun stands at each whole hour of local solar time — noon is the one under the sun.',
        geometry: 'Lines, one per hour',
        clock: 'always',
        params: [AT],
        example: 'internalfunc://solar-time?refresh=auto',
    },
    {
        id: 'analemma',
        label: 'Analemma',
        category: 'sun',
        summary: 'The figure-of-eight the sun traces when seen at the same clock time all year — the shape that shows a clock and the sun keep different time.',
        geometry: 'A line, with points for the days',
        clock: 'never',
        params: [
            { name: 'year', summary: 'Which year to trace.', fallback: 'the year of the current moment' },
            { name: 'hour', summary: 'The UTC hour to sample each day at.' },
            AT,
        ],
        example: 'internalfunc://analemma?year=2026&hour=12',
    },
    {
        id: 'graticule',
        label: 'Graticule',
        category: 'earth',
        summary: 'Meridians and parallels: the grid a projection is drawn against, and the quickest way to see what a projection does to it.',
        geometry: 'Lines',
        clock: 'never',
        params: [{ name: 'spacing', summary: 'Degrees between lines.', fallback: '10' }],
        example: 'internalfunc://graticule?spacing=15',
    },
    {
        id: 'reference-circles',
        label: 'Reference circles',
        category: 'earth',
        summary: 'Equator, tropics and polar circles. The tropics and polar circles move with the Earth’s tilt, so they are computed for the moment shown rather than fixed at 23.5°.',
        geometry: 'Lines',
        clock: 'always',
        params: [AT],
        example: 'internalfunc://reference-circles',
    },
    {
        id: 'tissot',
        label: 'Tissot’s indicatrix',
        category: 'projection',
        summary: 'Circles of equal ground radius, placed on a grid. Every one is a circle on the globe, so whatever the projection does to them is what it does to shape and area everywhere.',
        geometry: 'Polygons',
        clock: 'never',
        params: [
            { name: 'spacing', summary: 'Degrees between circles.' },
            { name: 'radius', summary: 'Ground radius of each circle, in kilometres.' },
        ],
        example: 'internalfunc://tissot?spacing=30&radius=500',
    },
    {
        id: 'equilibrium-tide',
        label: 'Equilibrium tide',
        category: 'tides',
        summary: 'The shape the ocean would take if water could keep up with the moon and the sun — two bulges, one under the moon and one opposite. It is the *forcing*, not a tide table: real tides lag it by hours and are shaped by coastlines.',
        geometry: 'Lines at each level, and points at the extremes',
        clock: 'always',
        params: [
            { name: 'levels', summary: 'Comma-separated metre levels to contour.' },
            { name: 'step', summary: 'Degrees between sample points.' },
            { name: 'extremes', summary: '`no` to leave out the high and low points.' },
            AT,
        ],
        example: 'internalfunc://equilibrium-tide?levels=-0.2,0,0.3&refresh=auto',
    },
    {
        id: 'moon-position',
        label: 'Moon position',
        category: 'moon',
        summary: 'The sublunar point: where the moon stands directly overhead.',
        geometry: 'A single point',
        clock: 'always',
        params: [AT],
        example: 'internalfunc://moon-position?refresh=auto',
    },
    {
        id: 'moon-phase',
        label: 'Moon phase',
        category: 'moon',
        summary: 'The moon drawn as a disc at the point it stands over, with its lit part shaded and turned so the light faces the sun.',
        geometry: 'Polygons — the disc and its lit part',
        clock: 'always',
        params: [
            { name: 'radius', summary: 'Radius of the disc, in degrees.' },
            { name: 'observer', summary: 'A `lon,lat` to draw the phase as seen from there — `{click}` follows the last click.', fallback: 'drawn as seen from the sublunar point' },
            AT,
        ],
        example: 'internalfunc://moon-phase?radius=7&observer={click}',
    },
    {
        id: 'moon-visibility',
        label: 'Moon visibility',
        category: 'moon',
        summary: 'The half of the world with the moon above the horizon at this moment.',
        geometry: 'A polygon',
        clock: 'always',
        params: [AT],
        example: 'internalfunc://moon-visibility?refresh=auto',
    },
    {
        id: 'moon-in-sky',
        label: 'Moon in the sky',
        category: 'moon',
        summary: 'The same moon at a row of latitudes, each disc turned the way an observer standing there sees it — which is how the crescent comes to lie on its back at the equator and stand upright in the north.',
        geometry: 'Polygons, one moon per latitude',
        clock: 'always',
        params: [
            { name: 'lon', summary: 'Meridian to place the row on.', fallback: 'the meridian where the sun has just set' },
            { name: 'from', summary: 'Southernmost latitude.' },
            { name: 'to', summary: 'Northernmost latitude.' },
            { name: 'step', summary: 'Degrees of latitude between discs.' },
            { name: 'radius', summary: 'Radius of each disc, in degrees.' },
            AT,
        ],
        example: 'internalfunc://moon-in-sky?lon=5&from=-60&to=60&step=15',
    },
    {
        id: 'moon-path',
        label: 'Moon path',
        category: 'moon',
        summary: 'The track of the sublunar point over a month, which turns the moon’s north–south swing into one picture.',
        geometry: 'Lines',
        clock: 'always',
        params: [
            { name: 'days', summary: 'How many days to trace.', fallback: 'one orbit, 27.32 days' },
            { name: 'step', summary: 'Hours between points.' },
            AT,
        ],
        example: 'internalfunc://moon-path?days=27.32&step=1',
    },
    {
        id: 'range-rings',
        label: 'Range rings',
        category: 'geodesy',
        summary: 'Circles of equal ground distance around a place — true circles on the globe, so a projection bends them exactly as much as it distorts.',
        geometry: 'Polygons',
        clock: 'never',
        params: [
            { name: 'at', summary: 'Centre, as `lon,lat`.', fallback: '5,52' },
            { name: 'radii', summary: 'Comma-separated radii in kilometres.' },
        ],
        example: 'internalfunc://range-rings?at=4.9,52.4&radii=500,1000,2000',
    },
    {
        id: 'great-circle',
        label: 'Great circle',
        category: 'geodesy',
        summary: 'The shortest path between two places on the globe — the line that looks bent on a Mercator map and is not.',
        geometry: 'A line',
        clock: 'never',
        params: [
            { name: 'from', summary: 'Start, as `lon,lat`.', fallback: '4.9,52.4' },
            { name: 'to', summary: 'End, as `lon,lat`.', fallback: '139.7,35.7' },
        ],
        example: 'internalfunc://great-circle?from=4.9,52.4&to=139.7,35.7',
    },
    {
        id: 'antipode',
        label: 'Antipode',
        category: 'geodesy',
        summary: 'The point on the exact other side of the Earth from a place.',
        geometry: 'A single point',
        clock: 'never',
        params: [{ name: 'at', summary: 'The place, as `lon,lat`.', fallback: '5,52' }],
        example: 'internalfunc://antipode?at=5,52',
    },
    {
        id: 'utm-zones',
        label: 'UTM zones',
        category: 'grids',
        summary: 'The 60 UTM zones, including the widened and split ones off Norway and Svalbard that the rule alone does not give you.',
        geometry: 'Polygons',
        clock: 'never',
        params: [],
        example: 'internalfunc://utm-zones',
    },
    {
        id: 'paleo-coastlines',
        label: 'Palaeo coastlines',
        category: 'deep-time',
        summary: 'Today’s coastlines carried back to a chosen age on the plates they ride. Rigid rotation: crust since shortened or stretched is not shown, so continents meet later here than the rocks say.',
        geometry: 'Polygons',
        clock: 'always',
        params: [
            { name: 'data', summary: 'Directory of the rotation model, resolved against the config.' },
            { name: 'ma', summary: 'Millions of years ago — `{ma}` follows the map’s clock.' },
        ],
        example: 'internalfunc://paleo-coastlines?data=data/paleo/merdith2021&ma={ma}',
    },
    {
        id: 'paleo-plates',
        label: 'Palaeo plate boundaries',
        category: 'deep-time',
        summary: 'Plate boundaries and deforming networks at a chosen age. Snapshots rather than a reconstruction: boundaries are born, die and change in number, so there is nothing to interpolate between two ages.',
        geometry: 'Lines and polygons',
        clock: 'always',
        params: [
            { name: 'data', summary: 'Directory of the plate snapshots, resolved against the config.' },
            { name: 'ma', summary: 'Millions of years ago — `{ma}` follows the map’s clock.' },
        ],
        example: 'internalfunc://paleo-plates?data=data/paleo/muller2019/plates&ma={ma}',
    },
];

export const INTERNAL_SOURCE_CATEGORIES: Array<{ id: InternalSourceDoc['category']; label: string; blurb: string }> = [
    { id: 'sun', label: 'Sun', blurb: 'Where the sun is, and what that does to the day.' },
    { id: 'moon', label: 'Moon', blurb: 'Where the moon is, how much of it is lit, and who can see it.' },
    { id: 'tides', label: 'Tides', blurb: 'The pull that raises the ocean, not the tide a harbour measures.' },
    { id: 'earth', label: 'Lines on the Earth', blurb: 'The grid and the circles a map is drawn against.' },
    { id: 'projection', label: 'What a projection does', blurb: 'Shapes whose true size is known, so the distortion becomes visible.' },
    { id: 'geodesy', label: 'Distance and direction', blurb: 'Spherical geometry about a place: how far, which way, and what is opposite.' },
    { id: 'grids', label: 'Grids defined by rules', blurb: 'Zone systems that are a definition rather than a survey.' },
    { id: 'deep-time', label: 'Deep time', blurb: 'The world at an age, reconstructed from plate motions.' },
];
