/**
 * A sea level curve: global mean sea level through time, read from a config
 * asset so the reconstruction can be swapped without touching code.
 *
 *   {
 *     "name": "...", "attribution": "...", "note": "...",
 *     "points": [[26, -130], [21, -134], ..., [0, 0]]   // [age in ka BP, metres]
 *   }
 *
 * Levels are relative to present sea level. Between points the curve is
 * linear, which is also how the reconstructions it comes from are drawn.
 */
export interface SeaLevelCurve {
    name: string;
    attribution?: string;
    note?: string;
    /** [age ka BP, level m], sorted from oldest to youngest. */
    points: Array<[number, number]>;
}

/** Reads a curve document; null when it has fewer than two usable points. */
export function parseSeaLevelCurve(raw: unknown): SeaLevelCurve | null {
    if (!raw || typeof raw !== 'object') return null;
    const doc = raw as Record<string, unknown>;
    const points = (Array.isArray(doc.points) ? doc.points : [])
        .filter((p): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .map(([age, level]) => [age, level] as [number, number])
        .sort((a, b) => b[0] - a[0]);
    if (points.length < 2) return null;
    return {
        name: typeof doc.name === 'string' ? doc.name : 'Sea level',
        ...(typeof doc.attribution === 'string' ? { attribution: doc.attribution } : {}),
        ...(typeof doc.note === 'string' ? { note: doc.note } : {}),
        points,
    };
}

/** Oldest and youngest age the curve covers, in ka BP. */
export function curveSpan(curve: SeaLevelCurve): { oldest: number; youngest: number } {
    return { oldest: curve.points[0][0], youngest: curve.points[curve.points.length - 1][0] };
}

/** Sea level (m, relative to present) at `ageKa`, clamped to the curve's span. */
export function seaLevelAt(curve: SeaLevelCurve, ageKa: number): number {
    const pts = curve.points;
    if (ageKa >= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
        const [a1, l1] = pts[i];
        if (ageKa >= a1) {
            const [a0, l0] = pts[i - 1];
            return l0 + (l1 - l0) * (a0 - ageKa) / (a0 - a1);
        }
    }
    return pts[pts.length - 1][1];
}
