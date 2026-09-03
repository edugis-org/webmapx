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

/** One property a generator writes onto every feature it returns. */
export interface InternalSourceAttributeDoc {
    /** Property name, as it arrives in `feature.properties`. */
    name: string;
    /** What it holds, in one line. */
    summary: string;
    /** Unit or shape of the value, where a number alone would be ambiguous. */
    unit?: string;
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
     * The geometry types actually returned, so a demo can style what is there
     * rather than everything, and a reader knows which paint applies.
     */
    geometryKinds: Array<'point' | 'line' | 'polygon'>;
    /**
     * What each feature carries. This is where most of these layers keep their
     * answer — the shape only says where it applies, and the number that makes
     * it interesting (the hours of daylight, the EPSG code, the distance) is a
     * property, readable with the info tool.
     */
    attributes: InternalSourceAttributeDoc[];
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
        geometryKinds: ['polygon'],
        attributes: [
            { name: 'id', summary: 'Which band this is: `sunset`, `civil`, `nautical`, `astronomical` or `night`.' },
            { name: 'description', summary: 'The band\u2019s name, ready to show.' },
            { name: 'from', summary: 'Sun altitude at the band\u2019s bright edge.', unit: 'degrees' },
            { name: 'to', summary: 'Sun altitude at its dark edge.', unit: 'degrees' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
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
        geometryKinds: ['point'],
        attributes: [
            { name: 'description', summary: 'What the point is.' },
            { name: 'declination', summary: 'How far the sun stands north or south of the equator today.', unit: 'degrees' },
            { name: 'equationOfTime', summary: 'How far a sundial runs ahead of or behind the clock.', unit: 'minutes' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
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
        geometryKinds: ['line'],
        attributes: [
            { name: 'date', summary: 'The day this line is the sun\u2019s track for.', unit: 'YYYY-MM-DD' },
            { name: 'month', summary: 'Its month, for colouring by season.', unit: '1\u201312' },
            { name: 'declination', summary: 'The sun\u2019s declination that day.', unit: 'degrees' },
            { name: 'solstice', summary: '`june` or `december` on the two extreme days, otherwise absent.' },
        ],
        params: [
            { name: 'span', summary: 'How wide a window to draw: `day` (just today), `half-year` (91 days either side of `at`), `solstice-to-solstice` (the half-cycle `at` sits in — snaps to the nearest solstices), or `year` (the calendar year `at` falls in).', fallback: 'solstice-to-solstice' },
            { name: 'step', summary: 'Degrees between points along each line.' },
            { name: 'year', summary: 'Replaces `at`’s year (as 1 July), independent of `span` — pair with `span=year` for the whole calendar year.' },
            AT,
        ],
        example: 'internalfunc://sun-path',
    },
    {
        id: 'day-length',
        label: 'Day length',
        category: 'sun',
        summary: 'Where the day is a given number of hours long today — the polar-night and midnight-sun lines are the 0 and 24 hour cases.',
        geometry: 'Lines, one per hour value',
        clock: 'always',
        geometryKinds: ['line'],
        attributes: [
            { name: 'hours', summary: 'How long the day is anywhere on this line.', unit: 'hours' },
            { name: 'description', summary: 'The same, in words.' },
            { name: 'date', summary: 'The day it applies to \u2014 these lines move all year.', unit: 'YYYY-MM-DD' },
        ],
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
        geometryKinds: ['line'],
        attributes: [
            { name: 'solarHour', summary: 'The local solar hour along this meridian.', unit: '0\u201323' },
            { name: 'noon', summary: 'True for the meridian directly under the sun.' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
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
        geometryKinds: ['line', 'point'],
        attributes: [
            { name: 'description', summary: 'What this point is: the sun\u2019s place at that clock time on that date.' },
            { name: 'date', summary: 'The day.', unit: 'YYYY-MM-DD' },
            { name: 'dayOfYear', summary: 'Its number in the year, for animating along the figure.', unit: '1\u2013366' },
            { name: 'year', summary: 'The year traced.' },
            { name: 'hourUtc', summary: 'The clock hour the sun was sampled at.', unit: 'UTC hour' },
            { name: 'longitude', summary: 'Where the sun stood.', unit: 'degrees' },
            { name: 'latitude', summary: 'Where the sun stood.', unit: 'degrees' },
            { name: 'equationOfTimeMinutes', summary: 'The east\u2013west half of the figure, which is what the equation of time measures.', unit: 'minutes' },
            { name: 'today', summary: 'True on the day the map is showing.' },
        ],
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
        geometryKinds: ['line'],
        attributes: [
            { name: 'kind', summary: '`meridian` or `parallel`.' },
            { name: 'degrees', summary: 'Its longitude or latitude.', unit: 'degrees' },
            { name: 'label', summary: 'Ready to draw: `180\u00b0 W`, `45\u00b0 N`.' },
        ],
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
        geometryKinds: ['line'],
        attributes: [
            { name: 'id', summary: '`equator`, `tropic-cancer`, `tropic-capricorn`, `arctic` or `antarctic`.' },
            { name: 'description', summary: 'Its name.' },
            { name: 'latitude', summary: 'Where it lies today \u2014 the tropics and polar circles move with the tilt.', unit: 'degrees' },
            { name: 'axialTilt', summary: 'The Earth\u2019s tilt on this date, which is what puts them there.', unit: 'degrees' },
            { name: 'date', summary: 'The date that tilt is for.', unit: 'YYYY-MM-DD' },
        ],
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
        geometryKinds: ['polygon'],
        attributes: [
            { name: 'centre', summary: 'Where the circle sits.', unit: '[lon, lat]' },
            { name: 'radiusKm', summary: 'Its true radius on the ground \u2014 every circle has the same one.', unit: 'km' },
            { name: 'description', summary: 'Radius and position in words.' },
        ],
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
        geometryKinds: ['line', 'point'],
        attributes: [
            { name: 'id', summary: '`low`, `high`, or the level for a contour.' },
            { name: 'description', summary: 'The level in words.' },
            { name: 'metres', summary: 'The height of this contour above mean level.', unit: 'm' },
            { name: 'springFactor', summary: 'How close this moment is to spring tide: 1 at full alignment.', unit: '0\u20131' },
            { name: 'phase', summary: 'The moon\u2019s phase now.', unit: '0\u20131' },
            { name: 'phaseName', summary: 'That phase in words.' },
            { name: 'lunarAmplitude', summary: 'The moon\u2019s share of the bulge.', unit: 'm' },
            { name: 'solarAmplitude', summary: 'The sun\u2019s share, about half the moon\u2019s.', unit: 'm' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
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
        geometryKinds: ['point'],
        attributes: [
            { name: 'description', summary: 'What the point is.' },
            { name: 'phase', summary: 'Where the moon is in its cycle.', unit: '0\u20131' },
            { name: 'phaseName', summary: 'That phase in words.' },
            { name: 'illumination', summary: 'How much of the disc is lit.', unit: '0\u20131' },
            { name: 'distanceKm', summary: 'How far away the moon is now \u2014 it varies by some 40 000 km.', unit: 'km' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
        params: [AT],
        example: 'internalfunc://moon-position?refresh=auto',
    },
    {
        id: 'moon-phase',
        label: 'Moon phase',
        category: 'moon',
        summary: 'The moon drawn as a disc, its lit part shaded and turned to face the sun. Without an observer the turn follows the ground bearing to the sun — a fact about geometry, the same everywhere. With one, it is a *view*: the same moon tilts to whatever that place\u2019s horizon does to it, so the identical crescent stands upright for one observer and lies nearly on its back for another at the same moment. Demoed with `observer={click}`, so clicking the map moves the observer and visibly rotates the crescent \u2014 that is the tilt changing, not the moon.',
        geometry: 'Polygons \u2014 the disc and its lit part, plus the observer\u2019s horizon and position once an observer is given',
        clock: 'always',
        geometryKinds: ['polygon'],
        attributes: [
            { name: 'id', summary: '`disc` for the whole moon, `lit` for the sunlit part \u2014 or `horizon`/`observer` for the two extra shapes an observer adds.' },
            { name: 'description', summary: 'What the shape is.' },
            { name: 'phase', summary: 'Where the moon is in its cycle \u2014 the same for every shape, since it is a fact about the moon, not about who is looking.', unit: '0\u20131' },
            { name: 'phaseName', summary: 'That phase in words.' },
            { name: 'illumination', summary: 'How much of the disc is lit.', unit: '0\u20131' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
            { name: 'observerLon', summary: 'The observer\u2019s longitude \u2014 only present once one is given.', unit: 'degrees' },
            { name: 'observerLat', summary: 'The observer\u2019s latitude \u2014 only present once one is given.', unit: 'degrees' },
            { name: 'tilt', summary: 'How far the lit side is turned from straight up, as that observer sees it \u2014 the number that changes when you click elsewhere. Only present with an observer.', unit: 'degrees' },
            { name: 'altitude', summary: 'How high the moon stands above that observer\u2019s horizon. Only present with an observer.', unit: 'degrees' },
            { name: 'sunAltitude', summary: 'How high the sun stands there, which is what daylight and belowHorizon are read from. Only present with an observer.', unit: 'degrees' },
            { name: 'belowHorizon', summary: 'True if the moon is under that observer\u2019s feet \u2014 the disc is still drawn, but nobody there can see it. Only present with an observer.' },
            { name: 'daylight', summary: 'True where the sun is up for that observer. Only present with an observer.' },
            { name: 'nearZenith', summary: 'True where the moon stands almost directly overhead, where a tilt stops meaning much. Only present with an observer.' },
        ],
        params: [
            { name: 'radius', summary: 'Radius of the disc, in degrees.' },
            { name: 'observer', summary: 'A `lon,lat` to draw the phase as seen from there, tilted to that place\u2019s horizon \u2014 `{click}` follows the last place clicked on the map, with any tool active, so this layer needs no tool of its own.', fallback: 'drawn by the ground bearing to the sun, the same from anywhere' },
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
        geometryKinds: ['polygon'],
        attributes: [
            { name: 'description', summary: 'What the band is.' },
            { name: 'phaseName', summary: 'The phase those people can see.' },
            { name: 'illumination', summary: 'How much of it is lit.', unit: '0\u20131' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
        params: [AT],
        example: 'internalfunc://moon-visibility?refresh=auto',
    },
    {
        id: 'moon-in-sky',
        label: 'Moon in the sky',
        category: 'moon',
        summary: 'The same moon at a row of latitudes on one meridian, each disc turned the way an observer standing there sees it — which is how the crescent comes to lie on its back at the equator and stand upright in the north. A row is drawn only where the moon is above that observer’s horizon: pin `lon` to a fixed meridian and the moon can be below the horizon at every one of the sampled latitudes at once — measured, for one full day at a fixed meridian, empty for 29% of the hours — which reads as nothing rendering rather than as night. Left unpinned, the meridian is chosen fresh each moment for where the moon has the best chance of being seen, which is what the demo does.',
        geometry: 'Polygons, one moon per latitude',
        clock: 'always',
        geometryKinds: ['polygon', 'line'],
        attributes: [
            { name: 'latitude', summary: 'The latitude this moon is drawn for.', unit: 'degrees' },
            { name: 'longitude', summary: 'The meridian the row stands on.', unit: 'degrees' },
            { name: 'tilt', summary: 'How far the lit side is turned from up, as seen from there \u2014 the reason the crescent lies on its back at the equator.', unit: 'degrees' },
            { name: 'altitude', summary: 'How high the moon stands above the horizon there.', unit: 'degrees' },
            { name: 'sunAltitude', summary: 'How high the sun stands, which decides whether the moon is visible.', unit: 'degrees' },
            { name: 'daylight', summary: 'True where the sun is up.' },
            { name: 'nearZenith', summary: 'True where the moon is nearly overhead, where "turned" stops meaning much.' },
            { name: 'illumination', summary: 'How much of the disc is lit.', unit: '0\u20131' },
            { name: 'phaseName', summary: 'The phase in words.' },
            { name: 'id', summary: '`disc`, `lit` or the horizon marker.' },
            { name: 'description', summary: 'What the shape is.' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
        params: [
            { name: 'lon', summary: 'Meridian to place the row on. Pinning it can leave the moon below the horizon at every sampled latitude at once, for hours at a time — the layer is not empty, that meridian just has no view of the moon right then.', fallback: 'chosen fresh each moment for the best chance of a visible moon somewhere on it' },
            { name: 'from', summary: 'Southernmost latitude.' },
            { name: 'to', summary: 'Northernmost latitude.' },
            { name: 'step', summary: 'Degrees of latitude between discs.' },
            { name: 'radius', summary: 'Radius of each disc, in degrees.' },
            AT,
        ],
        example: 'internalfunc://moon-in-sky?from=-60&to=60&step=15',
    },
    {
        id: 'moon-path',
        label: 'Moon path',
        category: 'moon',
        summary: 'The track of the sublunar point over a month, which turns the moon’s north–south swing into one picture.',
        geometry: 'Lines',
        clock: 'always',
        geometryKinds: ['line'],
        attributes: [
            { name: 'description', summary: 'What the track is.' },
            { name: 'days', summary: 'How many days it covers.', unit: 'days' },
            { name: 'northernmost', summary: 'The furthest north the moon gets in this stretch.', unit: 'degrees' },
            { name: 'southernmost', summary: 'The furthest south.', unit: 'degrees' },
            { name: 'timestamp', summary: 'The moment the layer was computed for.', unit: 'ISO 8601' },
        ],
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
        geometryKinds: ['line'],
        attributes: [
            { name: 'radiusKm', summary: 'How far from the centre this ring is.', unit: 'km' },
            { name: 'centre', summary: 'The place the rings are drawn about.', unit: '[lon, lat]' },
            { name: 'description', summary: 'The radius in words.' },
        ],
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
        geometryKinds: ['line'],
        attributes: [
            { name: 'description', summary: 'What the line is.' },
            { name: 'distanceKm', summary: 'The distance along it \u2014 the number the picture cannot show.', unit: 'km' },
            { name: 'from', summary: 'Start.', unit: '[lon, lat]' },
            { name: 'to', summary: 'End.', unit: '[lon, lat]' },
        ],
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
        geometryKinds: ['point'],
        attributes: [
            { name: 'description', summary: '`Here` or the antipode.' },
            { name: 'role', summary: '`origin` or `antipode`, for styling the pair differently.' },
        ],
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
        geometryKinds: ['polygon'],
        attributes: [
            { name: 'designation', summary: 'Zone and latitude band, as a grid reference gives it: `31U`.' },
            { name: 'zone', summary: 'The zone number.', unit: '1\u201360' },
            { name: 'band', summary: 'The latitude band letter.', unit: 'C\u2013X' },
            { name: 'epsg', summary: 'The EPSG code to project this zone in \u2014 the practical answer, invisible on the map.' },
            { name: 'centralMeridian', summary: 'The meridian the zone is measured from.', unit: 'degrees' },
            { name: 'exception', summary: 'Names the widened or split zones off Norway and Svalbard; null elsewhere.' },
        ],
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
        geometryKinds: ['polygon'],
        attributes: [
            { name: 'plateId', summary: 'Which plate this piece rides on, in the model\u2019s numbering.' },
            { name: 'continent', summary: 'The continent it belongs to today.' },
            { name: 'fromAge', summary: 'The oldest age the model reconstructs this piece for.', unit: 'Ma' },
            { name: 'ma', summary: 'The age it is drawn at.', unit: 'Ma' },
        ],
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
        geometryKinds: ['polygon'],
        attributes: [
            { name: 'ma', summary: 'The age this snapshot is for.', unit: 'Ma' },
            { name: 'type', summary: 'The GPlates feature type, e.g. a topological closed plate boundary.' },
            { name: 'name', summary: 'The plate or network\u2019s name.' },
            { name: 'pid', summary: 'Its plate id in the model.' },
            { name: 'deforming', summary: 'True for a deforming network \u2014 crust being squeezed rather than a rigid plate.' },
        ],
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
