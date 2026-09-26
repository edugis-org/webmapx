/**
 * The colouring of a flood-level layer at a given sea level.
 *
 * The layer's polygons each carry the sea level at which they connect to the
 * ocean (`flood_level`, from the coastal zones ETL). Its geometry never
 * changes; a sea level is only a colouring of it:
 *
 *   flood_level <= level            water
 *   level < flood_level <= today    sea floor that is dry at this level
 *   otherwise                       transparent: the basemap shows what is
 *                                   there today, land or lake
 *
 * The layer is drawn as one sublayer per class, each with a *constant* fill
 * colour. Moving the level then changes the colour of the few classes that
 * cross it, which MapLibre applies as a uniform. A single data-driven
 * expression over the attribute would be re-evaluated for every feature in
 * every loaded tile on each move: measured at about ten times the repaint
 * cost of a 1 m step here, which is what playback does many times a second.
 */
export interface SeaLevelStyleOptions {
    /** Attribute holding the sea level (m) at which a polygon floods. */
    attribute: string;
    /** The level that counts as today's sea: `flood_level <= today` is sea now. */
    today: number;
    water: string;
    land: string;
}

export const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/**
 * The class levels of the coastal zones ETL: `min`, `max` and the multiples
 * of 5 m between them, with 1 m steps from -1 to +10 m around today's
 * coastline.
 */
export function defaultZoneLevels(min: number, max: number): number[] {
    const levels = new Set<number>([min, max]);
    for (let v = Math.ceil(min / 5) * 5; v <= max; v += 5) levels.add(v);
    for (let v = Math.max(min, -1); v <= Math.min(max, 10); v += 1) levels.add(v);
    return [...levels].sort((a, b) => a - b);
}

/** What a class is at a sea level: sea, sea floor left dry, or as it is today. */
export type ClassRole = 'sea' | 'dry' | 'today';

/** Legend wording per role; the class sublayers are titled by what they show now. */
export const ROLE_TITLES: Readonly<Record<ClassRole, string>> = {
    sea: 'Sea',
    dry: 'Dry sea floor',
    today: 'As today',
};

/** Role of the class whose polygons flood at `classLevel`, at sea level `level`. */
export function classRole(classLevel: number, level: number, today: number): ClassRole {
    if (classLevel <= level) return 'sea';
    if (classLevel <= today) return 'dry';
    return 'today';
}

export function roleColor(role: ClassRole, options: SeaLevelStyleOptions): string {
    return role === 'sea' ? options.water : role === 'dry' ? options.land : TRANSPARENT;
}

/** Colour of the class whose polygons flood at `classLevel`, at sea level `level`. */
export function classColor(classLevel: number, level: number, options: SeaLevelStyleOptions): string {
    return roleColor(classRole(classLevel, level, options.today), options);
}

/** Id of the sublayer drawing one class. */
export function classSubLayerId(layerId: string, classLevel: number): string {
    return `${layerId}-${classLevel}`;
}

/**
 * One fill sublayer per class, cloned from `base` (which carries the source).
 *
 * Each class covers the flood levels above the previous class up to its own,
 * so a polygon between two listed levels is still drawn — by the higher one,
 * the level at which all of it is under water. The lowest class takes
 * everything at or below it.
 */
export function classSubLayers(
    layerId: string,
    base: Record<string, unknown>,
    levels: number[],
    level: number,
    options: SeaLevelStyleOptions,
): Array<Record<string, unknown>> {
    const value = ['get', options.attribute];
    return levels.map((classLevel, i) => {
        const role = classRole(classLevel, level, options.today);
        return {
            ...base,
            id: classSubLayerId(layerId, classLevel),
            type: 'fill',
            filter: i === 0
                ? ['<=', value, classLevel]
                : ['all', ['>', value, levels[i - 1]], ['<=', value, classLevel]],
            paint: { 'fill-color': roleColor(role, options), 'fill-antialias': false },
            metadata: { title: ROLE_TITLES[role] },
        };
    });
}
