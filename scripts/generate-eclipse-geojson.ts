/**
 * Generate GeoJSON for the total solar eclipse of 2026 August 12:
 *
 *   - eclipse-2026-centerline.geojson   central line + greatest-eclipse point
 *   - eclipse-2026-totality.geojson     path of totality (umbral footprint)
 *   - eclipse-2026-partial.geojson      obscuration isolines, 10% steps
 *   - eclipse-2026.geojson              all of the above in one collection
 *
 * Everything is computed from NASA's Besselian elements; no network access.
 *
 * Usage: npx tsx / node scripts/run-ts.mjs scripts/generate-eclipse-geojson.ts [--out DIR]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  SE_2026_AUG_12 as EL,
  centralLinePoint,
  greatestEclipseTime,
  maxEclipseAt,
  tToUtcIso,
  sweepUmbralEdges,
  umbralOutline,
} from './lib/eclipse-besselian.js';
import { isolines, type Grid, type Ring } from './lib/marching-squares.js';

type Feature = {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: unknown;
};

const OUT_DIR = (() => {
  const i = process.argv.indexOf('--out');
  return resolve(i === -1 ? 'public/data/eclipse-2026' : process.argv[i + 1]);
})();

/** Obscuration levels for the partial-eclipse contours. */
const PARTIAL_LEVELS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

function buildGrid(
  lonMin: number,
  lonMax: number,
  latMin: number,
  latMax: number,
  step: number,
  pick: (m: { magnitude: number; obscuration: number }) => number,
): Grid {
  const width = Math.round((lonMax - lonMin) / step) + 1;
  const height = Math.round((latMax - latMin) / step) + 1;
  const values = new Float64Array(width * height);
  for (let r = 0; r < height; r += 1) {
    const lat = latMin + r * step;
    for (let c = 0; c < width; c += 1) {
      const lon = lonMin + c * step;
      values[r * width + c] = pick(maxEclipseAt(EL, lat, lon));
    }
    if (r % 50 === 0) process.stderr.write(`  row ${r}/${height}\r`);
  }
  process.stderr.write('\n');
  return { values, width, height, lon0: lonMin, lat0: latMin, dLon: step, dLat: step };
}

/** Great-circle-free rough length of a polyline, in degrees. */
function pathLength(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return total;
}

/**
 * Close a contour that runs off both antimeridian edges.
 *
 * Such a curve is a closed loop on the sphere that encircles a pole; in
 * EPSG:4326 it can only be turned into a polygon by walking along the top (or
 * bottom) edge of the map. Which pole is inside is decided by sampling.
 */
function closeOverPole(points: [number, number][], level: number): [number, number][] | null {
  const first = points[0];
  const last = points[points.length - 1];
  // The endpoint can sit up to one cell short of the edge, so snap rather than
  // test for an exact +/-180.
  const edgeTolerance = 0.5;
  const onEdge = (lon: number) => Math.abs(Math.abs(lon) - 180) < edgeTolerance;
  if (!onEdge(first[0]) || !onEdge(last[0]) || Math.sign(first[0]) === Math.sign(last[0])) {
    return null;
  }
  const northInside = maxEclipseAt(EL, 89.5, 0).obscuration >= level;
  const poleLat = northInside ? 90 : -90;
  const ordered = first[0] < 0 ? [...points] : [...points].reverse();
  ordered[0] = [-180, ordered[0][1]];
  ordered[ordered.length - 1] = [180, ordered[ordered.length - 1][1]];
  const ring: [number, number][] = [...ordered, [180, poleLat], [-180, poleLat]];
  ring.push(ring[0]);
  return ring;
}

function ringsToFeature(
  allRings: Ring[],
  properties: Record<string, unknown>,
  level?: number,
): Feature | null {
  // Contour cells straddling the sunrise/sunset terminator leave sub-cell
  // slivers behind; they are numerical dust, not geography.
  const rings = allRings.filter((r) => pathLength(r.points) > 0.5);

  const closed = rings.filter((r) => r.closed).map((r) => r.points);
  const open = rings.filter((r) => !r.closed).map((r) => r.points);

  if (level !== undefined) {
    for (let i = open.length - 1; i >= 0; i -= 1) {
      const ring = closeOverPole(open[i], level);
      if (ring) {
        closed.push(ring);
        open.splice(i, 1);
      }
    }
  }

  if (closed.length && !open.length) {
    return {
      type: 'Feature',
      properties,
      geometry:
        closed.length === 1
          ? { type: 'Polygon', coordinates: [closed[0]] }
          : { type: 'MultiPolygon', coordinates: closed.map((ring) => [ring]) },
    };
  }
  const lines = [...closed, ...open];
  if (!lines.length) return null;
  return {
    type: 'Feature',
    properties: { ...properties, note: 'open contour (clipped by grid edge or pole)' },
    geometry:
      lines.length === 1
        ? { type: 'LineString', coordinates: lines[0] }
        : { type: 'MultiLineString', coordinates: lines },
  };
}

function buildCenterLine(): { features: Feature[]; bbox: [number, number, number, number] } {
  const points: { lon: number; lat: number; t: number; duration: number; alt: number }[] = [];
  const stepMinutes = 0.5;
  for (let t = -3; t <= 3; t += stepMinutes / 60) {
    const p = centralLinePoint(EL, t);
    if (p) points.push({ lon: p.lon, lat: p.lat, t, duration: p.durationSeconds, alt: p.sunAltitude });
  }
  if (!points.length) throw new Error('no central line found');

  // Split at antimeridian crossings so the line does not wrap the globe.
  const parts: [number, number][][] = [[]];
  let prevLon = points[0].lon;
  for (const p of points) {
    if (Math.abs(p.lon - prevLon) > 180) parts.push([]);
    parts[parts.length - 1].push([p.lon, p.lat]);
    prevLon = p.lon;
  }

  const tGreatest = greatestEclipseTime(EL);
  const greatestPoint = centralLinePoint(EL, tGreatest);
  if (!greatestPoint) throw new Error('greatest eclipse point off the Earth');
  const greatest = {
    lon: greatestPoint.lon,
    lat: greatestPoint.lat,
    t: tGreatest,
    duration: greatestPoint.durationSeconds,
    alt: greatestPoint.sunAltitude,
  };
  const first = points[0];
  const last = points[points.length - 1];

  const lons = points.map((p) => p.lon);
  const lats = points.map((p) => p.lat);

  return {
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
    features: [
      {
        type: 'Feature',
        properties: {
          kind: 'centerline',
          title: 'Central line of the total solar eclipse of 2026 Aug 12',
          startUtc: tToUtcIso(EL, first.t),
          endUtc: tToUtcIso(EL, last.t),
          maxDurationSeconds: Number(
            points.reduce((a, b) => (b.duration > a.duration ? b : a)).duration.toFixed(1),
          ),
        },
        geometry:
          parts.length === 1
            ? { type: 'LineString', coordinates: parts[0] }
            : { type: 'MultiLineString', coordinates: parts.filter((p) => p.length > 1) },
      },
      {
        type: 'Feature',
        properties: {
          kind: 'greatest-eclipse',
          title: 'Greatest eclipse',
          timeUtc: tToUtcIso(EL, greatest.t),
          durationSeconds: Number(greatest.duration.toFixed(1)),
          sunAltitudeDeg: Number(greatest.alt.toFixed(1)),
        },
        geometry: { type: 'Point', coordinates: [greatest.lon, greatest.lat] },
      },
    ],
  };
}

/**
 * Path of totality as a polygon band between the northern and southern umbral
 * limits, sampled along the eclipse. Built analytically rather than by
 * contouring a grid: the band is thin (~250 km) and a grid fine enough to
 * resolve it costs far more than it is worth.
 *
 * Longitudes are unwrapped while sampling, then the band is cut at each
 * antimeridian crossing so the result is a valid MultiPolygon.
 */
/**
 * Convex cap from A to B over the points lying off one side of the chord AB.
 *
 * Used for the two ends of the path of totality. There the umbra is clipped by
 * the Earth's limb, so the per-step "widest point across the track" hops
 * between the ends of the clipped arc and the edge loci come out as a sawtooth;
 * the outer hull of everything the shadow touches in that interval is both
 * smooth and the shape actually wanted.
 */
function hullCap(
  points: [number, number][],
  a: [number, number],
  b: [number, number],
  interior: [number, number],
): [number, number][] {
  const cosLat = Math.cos((a[1] * Math.PI) / 180) || 1e-6;
  const local = (p: [number, number]): [number, number] => [(p[0] - a[0]) * cosLat, p[1] - a[1]];
  const [bx, by] = local(b);
  const chord = Math.hypot(bx, by);
  if (chord === 0) return [];
  // Chord frame: u along a->b, v across it.
  const project = (p: [number, number]) => {
    const [x, y] = local(p);
    return { u: (x * bx + y * by) / chord, v: (bx * y - by * x) / chord };
  };

  // Which side of the chord the cap lies on is fixed by the band, not by the
  // tail points: most of the tail sits *behind* the chord, so averaging their
  // offsets picks the wrong side.
  const outward = project(interior).v > 0 ? -1 : 1;

  const candidates = points
    .map((p) => ({ p, ...project(p) }))
    .filter((q) => q.v * outward > 0)
    .concat([
      { p: a, u: 0, v: 0 },
      { p: b, u: chord, v: 0 },
    ])
    .sort((x, y) => x.u - y.u);

  // Monotone chain along the chord, keeping the outermost boundary.
  const hull: typeof candidates = [];
  for (const q of candidates) {
    while (hull.length >= 2) {
      const r = hull[hull.length - 2];
      const s = hull[hull.length - 1];
      const turn = (s.u - r.u) * (q.v - r.v) - (s.v - r.v) * (q.u - r.u);
      if (turn * outward < 0) break;
      hull.pop();
    }
    hull.push(q);
  }
  return hull.filter((q) => q.p !== a && q.p !== b).map((q) => q.p);
}

function buildTotalityPath(): Feature | null {
  const north: [number, number][] = [];
  const south: [number, number][] = [];
  let prevNorthLon: number | null = null;
  let prevSouthLon: number | null = null;

  const unwrap = (lon: number, prev: number | null): number => {
    if (prev === null) return lon;
    let out = lon;
    while (out - prev > 180) out -= 360;
    while (prev - out > 180) out += 360;
    return out;
  };

  const allEdges = sweepUmbralEdges(EL);
  // The band proper is only defined while the whole shadow lands on the Earth;
  // the intervals either side of that belong to the caps.
  const edges = allEdges.filter((e) => e.axisOnEarth && e.outlineComplete);
  if (edges.length < 2) return null;

  for (const edge of edges) {
    const nLon = unwrap(edge.left.lon, prevNorthLon);
    const sLon = unwrap(edge.right.lon, prevSouthLon);
    prevNorthLon = nLon;
    prevSouthLon = sLon;
    north.push([nLon, edge.left.lat]);
    south.push([sLon, edge.right.lat]);
  }

  // Both ends are capped by the shadow's own outline, clipped by the Earth's
  // limb. Without that the ring closes with a straight line between the two
  // limits and the path ends in a spurious wedge.
  // Sampled on their own time grid rather than reused from the sweep: the
  // sweep drops steps whose clipped outline is too small to give edges, and
  // those last seconds are still a good 100 km of ground.
  const tailPoints = (
    endpointTime: number,
    direction: 1 | -1,
    referenceLon: number,
  ): [number, number][] => {
    const step = (direction * 6) / 3600;
    const out: [number, number][] = [];
    for (let t = endpointTime; Math.abs(t - endpointTime) < 0.5; t += step) {
      const outline = umbralOutline(EL, t, 120);
      if (!outline.length) break;
      for (const p of outline) out.push([unwrap(p.lon, referenceLon), p.lat]);
    }
    return out;
  };

  const midpoint = (i: number): [number, number] => [
    (north[i][0] + south[i][0]) / 2,
    (north[i][1] + south[i][1]) / 2,
  ];
  const last = north.length - 1;
  const startCap = hullCap(
    tailPoints(edges[0].t, -1, north[0][0]),
    north[0],
    south[0],
    midpoint(Math.min(20, last)),
  );
  const endCap = hullCap(
    tailPoints(edges[edges.length - 1].t, 1, north[last][0]),
    north[last],
    south[last],
    midpoint(Math.max(0, last - 20)),
  );

  // Cut into pieces that each stay inside one 360-degree longitude window.
  const windowOf = (lon: number) => Math.floor((lon + 180) / 360);
  const pieces: { north: [number, number][]; south: [number, number][] }[] = [];
  let current = { north: [] as [number, number][], south: [] as [number, number][] };
  let currentWindow: number | null = null;
  for (let i = 0; i < north.length; i += 1) {
    const w = windowOf(north[i][0]);
    if (currentWindow !== null && w !== currentWindow) {
      pieces.push(current);
      current = { north: [], south: [] };
    }
    currentWindow = w;
    current.north.push(north[i]);
    current.south.push(south[i]);
  }
  pieces.push(current);

  // The caps belong to the two open ends of the whole path, not to the seams
  // introduced by the antimeridian cut.
  pieces[0].south.unshift(...startCap);
  pieces[pieces.length - 1].north.push(...endCap);

  const rings = pieces
    .filter((p) => p.north.length > 1)
    .map((p) => {
      const shift = -360 * windowOf(p.north[0][0]);
      const wrap = ([lon, lat]: [number, number]): [number, number] => [
        Math.max(-180, Math.min(180, lon + shift)),
        lat,
      ];
      const ring = [...p.north.map(wrap), ...p.south.map(wrap).reverse()];
      ring.push(ring[0]);
      return [ring];
    });
  if (!rings.length) return null;

  return {
    type: 'Feature',
    properties: {
      kind: 'totality',
      obscuration: 1,
      title: 'Path of totality (umbral footprint)',
    },
    geometry:
      rings.length === 1
        ? { type: 'Polygon', coordinates: rings[0] }
        : { type: 'MultiPolygon', coordinates: rings },
  };
}

/** Round every coordinate to 4 decimals (~11 m) to keep the files small. */
function roundCoords(value: unknown): unknown {
  if (typeof value === 'number') return Number(value.toFixed(4));
  if (Array.isArray(value)) return value.map(roundCoords);
  return value;
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('central line…');
  const center = buildCenterLine();
  const [wMin, sMin, eMax, nMax] = center.bbox;

  void wMin;
  void sMin;
  void eMax;
  void nMax;

  console.log('path of totality…');
  const totality = buildTotalityPath();

  console.log('partial-eclipse contours (global grid)…');
  const coarse = buildGrid(-180, 180, -60, 90, 0.25, (m) => m.obscuration);
  const partial = PARTIAL_LEVELS.map((level) =>
    ringsToFeature(isolines(coarse, level), {
      kind: 'partial',
      obscuration: level,
      percent: Math.round(level * 100),
      title: `${Math.round(level * 100)}% of the solar disc obscured`,
    },
    level),
  ).filter((f): f is Feature => f !== null);

  const write = (name: string, rawFeatures: Feature[]) => {
    const features = rawFeatures.map((f) => ({
      ...f,
      geometry: {
        ...(f.geometry as { type: string; coordinates: unknown }),
        coordinates: roundCoords((f.geometry as { coordinates: unknown }).coordinates),
      },
    }));
    const path = join(OUT_DIR, name);
    writeFileSync(
      path,
      `${JSON.stringify(
        {
          type: 'FeatureCollection',
          properties: {
            eclipse: 'Total solar eclipse of 2026 August 12',
            source:
              'Besselian elements: NASA/GSFC, Fred Espenak — https://eclipse.gsfc.nasa.gov/SEsearch/SEdata.php?Ecl=20260812',
            deltaTSeconds: EL.deltaT,
          },
          features,
        },
        null,
        1,
      )}\n`,
    );
    console.log(`wrote ${path} (${features.length} features)`);
  };

  write('eclipse-2026-centerline.geojson', center.features);
  write('eclipse-2026-totality.geojson', totality ? [totality] : []);
  write('eclipse-2026-partial.geojson', partial);
  write('eclipse-2026.geojson', [
    ...(totality ? [totality] : []),
    ...partial,
    ...center.features,
  ]);
}

main();
