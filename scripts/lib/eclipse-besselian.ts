/**
 * Besselian-element solar eclipse geometry.
 *
 * Elements for the total solar eclipse of 2026 August 12 are taken verbatim
 * from NASA/GSFC (Espenak), "Five Millennium Canon of Solar Eclipses":
 * https://eclipse.gsfc.nasa.gov/SEsearch/SEdata.php?Ecl=20260812
 *
 * All angles in this module are radians unless a name says `Deg`.
 */

export interface BesselianElements {
  /** Reference hour t0, in TDT decimal hours on the eclipse date. */
  t0: number;
  /** ISO date (UTC) of the eclipse day. */
  date: string;
  /** Polynomial coefficients, index = power of t (hours from t0). */
  x: number[];
  y: number[];
  /** Declination of the shadow axis, degrees. */
  d: number[];
  l1: number[];
  l2: number[];
  /** Hour angle of the shadow axis, degrees. */
  mu: number[];
  tanF1: number;
  tanF2: number;
  /** TDT - UT1, seconds. */
  deltaT: number;
}

export const SE_2026_AUG_12: BesselianElements = {
  t0: 18.0,
  date: '2026-08-12',
  x: [0.4755140, 0.5189249, -0.0000773, -0.0000080],
  y: [0.7711830, -0.2301680, -0.0001246, 0.0000038],
  d: [14.7966700, -0.0120650, -0.0000030, 0.0],
  l1: [0.5379550, 0.0000939, -0.0000121, 0.0],
  l2: [-0.0081420, 0.0000935, -0.0000121, 0.0],
  mu: [88.747787, 15.003090, 0.0, 0.0],
  tanF1: 0.0046141,
  tanF2: 0.0045911,
  deltaT: 75.4,
};

/** Earth flattening constants (IAU 1976 / WGS-ish, as used by Espenak). */
const FLATTENING_RATIO = 0.99664719; // b/a
const E2 = 1 - FLATTENING_RATIO * FLATTENING_RATIO;

const DEG = Math.PI / 180;

function poly(coeffs: number[], t: number): number {
  let value = 0;
  for (let i = coeffs.length - 1; i >= 0; i -= 1) value = value * t + coeffs[i];
  return value;
}

export interface ShadowState {
  /** Hours from t0. */
  t: number;
  x: number;
  y: number;
  /** radians */
  d: number;
  l1: number;
  l2: number;
  /** radians */
  mu: number;
}

export function shadowState(el: BesselianElements, t: number): ShadowState {
  return {
    t,
    x: poly(el.x, t),
    y: poly(el.y, t),
    d: poly(el.d, t) * DEG,
    l1: poly(el.l1, t),
    l2: poly(el.l2, t),
    mu: poly(el.mu, t) * DEG,
  };
}

function normalizeLon(lonDeg: number): number {
  let lon = lonDeg;
  while (lon > 180) lon -= 360;
  while (lon <= -180) lon += 360;
  return lon;
}

export interface LocalCircumstances {
  /** Eclipse magnitude: fraction of the solar *diameter* covered. */
  magnitude: number;
  /** Obscuration: fraction of the solar *disc area* covered. */
  obscuration: number;
  /** True when the shadow axis point is on the visible hemisphere. */
  sunUp: boolean;
}

/**
 * Local circumstances for one observer at one instant.
 *
 * Standard Besselian reduction (Explanatory Supplement / Espenak's
 * "Eclipse Predictions" appendix): rotate the observer into the fundamental
 * plane, measure the distance `m` from the shadow axis and compare it with the
 * penumbral and umbral cone radii at the observer's zeta.
 */
export function localCircumstances(
  s: ShadowState,
  latDeg: number,
  lonDeg: number,
  el: BesselianElements,
): LocalCircumstances {
  const lat = latDeg * DEG;
  const u = Math.atan(FLATTENING_RATIO * Math.tan(lat));
  const rhoSinPhi = FLATTENING_RATIO * Math.sin(u);
  const rhoCosPhi = Math.cos(u);

  const h = s.mu + lonDeg * DEG; // local hour angle of the shadow axis
  const xi = rhoCosPhi * Math.sin(h);
  const eta = rhoSinPhi * Math.cos(s.d) - rhoCosPhi * Math.cos(h) * Math.sin(s.d);
  const zeta = rhoSinPhi * Math.sin(s.d) + rhoCosPhi * Math.cos(h) * Math.cos(s.d);

  if (zeta <= 0) return { magnitude: 0, obscuration: 0, sunUp: false };

  const du = s.x - xi;
  const dv = s.y - eta;
  const m = Math.hypot(du, dv);

  const l1 = s.l1 - zeta * el.tanF1;
  const l2 = s.l2 - zeta * el.tanF2;

  const magnitude = (l1 - m) / (l1 + l2);
  if (magnitude <= 0) return { magnitude: 0, obscuration: 0, sunUp: true };

  // Sun and Moon apparent radii in fundamental-plane units follow from the two
  // cone radii: magnitude is 0 at m = l1 and 1 at m = -l2.
  const rSun = (l1 + l2) / 2;
  const rMoon = (l1 - l2) / 2;
  return {
    magnitude,
    obscuration: discOverlapFraction(rSun, rMoon, m),
    sunUp: true,
  };
}

/** Fraction of the disc of radius `rSun` covered by a disc of radius `rMoon` at separation `d`. */
function discOverlapFraction(rSun: number, rMoon: number, d: number): number {
  if (d >= rSun + rMoon) return 0;
  if (d <= Math.abs(rMoon - rSun)) return rMoon >= rSun ? 1 : (rMoon * rMoon) / (rSun * rSun);
  const a1 = Math.acos((d * d + rSun * rSun - rMoon * rMoon) / (2 * d * rSun));
  const a2 = Math.acos((d * d + rMoon * rMoon - rSun * rSun) / (2 * d * rMoon));
  const area =
    rSun * rSun * (a1 - Math.sin(2 * a1) / 2) + rMoon * rMoon * (a2 - Math.sin(2 * a2) / 2);
  return area / (Math.PI * rSun * rSun);
}

export interface MaxEclipse {
  magnitude: number;
  obscuration: number;
  /** Hours from t0 at which the maximum occurs. */
  t: number;
}

/**
 * Maximum obscuration seen from one location over the whole eclipse.
 *
 * Coarse scan then a dense local rescan; the coarse step must stay well below
 * the partial phase duration (hours) so no location's peak is missed.
 */
export function maxEclipseAt(
  el: BesselianElements,
  latDeg: number,
  lonDeg: number,
  tStart = -4,
  tEnd = 4,
  coarseStep = 1 / 12, // 5 minutes
): MaxEclipse {
  let bestT = tStart;
  let best = -1;
  for (let t = tStart; t <= tEnd; t += coarseStep) {
    const c = localCircumstances(shadowState(el, t), latDeg, lonDeg, el);
    if (c.obscuration > best) {
      best = c.obscuration;
      bestT = t;
    }
  }
  if (best <= 0) return { magnitude: 0, obscuration: 0, t: bestT };

  // Dense local scan rather than a golden-section search: near the sunrise /
  // sunset terminator the obscuration seen by an observer is discontinuous in
  // t (the Sun drops below the horizon mid-eclipse), so the function is not
  // unimodal and a bracketing search converges on noise.
  const refineSteps = 120;
  const refineStep = (2 * coarseStep) / refineSteps;
  let tMax = bestT;
  for (let i = 0; i <= refineSteps; i += 1) {
    const t = bestT - coarseStep + i * refineStep;
    const c = localCircumstances(shadowState(el, t), latDeg, lonDeg, el);
    if (c.obscuration > best) {
      best = c.obscuration;
      tMax = t;
    }
  }
  const peak = localCircumstances(shadowState(el, tMax), latDeg, lonDeg, el);
  return { magnitude: peak.magnitude, obscuration: peak.obscuration, t: tMax };
}

/**
 * Surface point whose projection onto the fundamental plane is (xi, eta).
 *
 * Returns null when the point falls off the Earth's disc. The ellipsoid is
 * handled by working in the y/rho1-scaled frame, as in the standard reduction.
 */
export function surfacePointFromFundamental(
  el: BesselianElements,
  t: number,
  xi: number,
  eta: number,
  clampToLimb = false,
): { lon: number; lat: number; zeta: number } | null {
  const s = shadowState(el, t);
  const rho1 = Math.sqrt(1 - E2 * Math.cos(s.d) ** 2);
  const sinD1 = Math.sin(s.d) / rho1;
  const cosD1 = (Math.sqrt(1 - E2) * Math.cos(s.d)) / rho1;

  let xiUsed = xi;
  let eta1 = eta / rho1;
  let zetaSq = 1 - xiUsed * xiUsed - eta1 * eta1;
  if (zetaSq <= 0) {
    // Off the Earth's disc. Callers that need a continuous reference point
    // (the shadow axis after it has left the Earth) can pull it back onto the
    // limb in the same direction instead of losing it altogether.
    if (!clampToLimb) return null;
    const scale = 1 / Math.hypot(xiUsed, eta1);
    xiUsed *= scale;
    eta1 *= scale;
    zetaSq = 0;
  }
  const zeta1 = Math.sqrt(zetaSq);

  const lat1 = Math.asin(Math.max(-1, Math.min(1, eta1 * cosD1 + zeta1 * sinD1)));
  const latDeg = Math.atan(Math.tan(lat1) / Math.sqrt(1 - E2)) / DEG;

  const cosLat1 = Math.cos(lat1);
  const hourAngle = Math.atan2(xiUsed / cosLat1, (zeta1 * cosD1 - eta1 * sinD1) / cosLat1);
  const lonDeg = normalizeLon((hourAngle - s.mu) / DEG);

  const rho2 = Math.sqrt(1 - E2 * Math.sin(s.d) ** 2);
  const sinD1MinusD2 = (E2 * Math.sin(s.d) * Math.cos(s.d)) / (rho1 * rho2);
  return { lon: lonDeg, lat: latDeg, zeta: rho2 * (zeta1 * cosD1 - eta1 * sinD1MinusD2) };
}

/** Umbral cone radius at the surface point under (xi, eta), or null if off-disc. */
export function umbralRadiusAt(
  el: BesselianElements,
  t: number,
  xi: number,
  eta: number,
): number | null {
  const p = surfacePointFromFundamental(el, t, xi, eta);
  if (!p) return null;
  return shadowState(el, t).l2 - p.zeta * el.tanF2;
}

export interface GeoPoint {
  lon: number;
  lat: number;
}

export interface OutlinePoint extends GeoPoint {
  /** Height of the observer above the fundamental plane; 0 exactly on the limb. */
  zeta: number;
}

/**
 * Outline of the umbral shadow on the Earth's surface at time t.
 *
 * The umbra is a disc of radius |l2'| about (x, y) in the fundamental plane.
 * l2' depends on zeta, so each sampled edge point iterates its own radius.
 * Points that fall off the Earth's disc are dropped, so near the start and end
 * of the eclipse this returns a partial outline. Each point carries its zeta,
 * which is what tells a caller whether it is a real shadow edge or just where
 * the Earth's limb cut the shadow off.
 */
export function umbralOutline(el: BesselianElements, t: number, samples = 360): OutlinePoint[] {
  const s = shadowState(el, t);
  const out: OutlinePoint[] = [];
  for (let i = 0; i < samples; i += 1) {
    const theta = (2 * Math.PI * i) / samples;
    let r = Math.abs(s.l2);
    let point: OutlinePoint | null = null;
    for (let k = 0; k < 6; k += 1) {
      const p = surfacePointFromFundamental(
        el,
        t,
        s.x + Math.cos(theta) * r,
        s.y + Math.sin(theta) * r,
      );
      if (!p) {
        point = null;
        break;
      }
      point = { lon: p.lon, lat: p.lat, zeta: p.zeta };
      r = Math.abs(s.l2 - p.zeta * el.tanF2);
    }
    if (point) out.push(point);
  }
  return out;
}

export interface UmbralEdges {
  t: number;
  left: GeoPoint;
  right: GeoPoint;
  /** True while the shadow axis itself still meets the Earth. */
  axisOnEarth: boolean;
  /**
   * True when the whole umbral outline lands on the Earth. Once the limb clips
   * it, the widest-across-track point sits on the clip itself and jumps from
   * step to step, so these steps must not be used as band edges.
   */
  outlineComplete: boolean;
}

/**
 * Reference point for the shadow at time t: the axis intersection while there
 * is one, and the point on the limb the axis is heading for once there is not.
 * Continuous across that transition, which is what the sweep frame needs.
 */
function shadowReferencePoint(el: BesselianElements, t: number): GeoPoint {
  const s = shadowState(el, t);
  const p = surfacePointFromFundamental(el, t, s.x, s.y, true);
  // clampToLimb never returns null.
  return { lon: p!.lon, lat: p!.lat };
}

/**
 * Sweep the two limits of the path of totality over the whole eclipse.
 *
 * At each step the umbral outline is measured across the shadow's direction of
 * travel and the two extreme points are kept; their loci are the northern and
 * southern limits of the path. Two details matter:
 *
 *   - The cross-track extremes must be found on the *ground*, not on the
 *     fundamental-plane normal: at low Sun the disc projects to a hugely
 *     stretched ellipse whose widest points are nowhere near that normal, and
 *     this eclipse makes landfall at sunset.
 *   - Near the start and end the shadow axis misses the Earth while the umbra
 *     still touches it (that tail is worth ~100 km of Spanish coast). The frame
 *     therefore rides `shadowReferencePoint`, which follows the axis onto the
 *     limb, rather than stopping at the last central-line point or improvising
 *     an origin from the clipped outline - an origin taken from the outline
 *     jitters from step to step and shreds the tail of the path into spikes.
 *
 * The sides are labelled by the sign of the cross-track offset and never
 * swapped, otherwise the band folds into a bowtie where the heading turns.
 */
export function sweepUmbralEdges(
  el: BesselianElements,
  tStart = -3.5,
  tEnd = 3.5,
  stepHours = 6 / 3600,
): UmbralEdges[] {
  const edges: UmbralEdges[] = [];

  const samples = 360;
  for (let t = tStart; t <= tEnd; t += stepHours) {
    const outline = umbralOutline(el, t, samples);
    if (outline.length < 3) continue;

    const origin = shadowReferencePoint(el, t);
    const ahead = shadowReferencePoint(el, t + stepHours);

    const cosLat = Math.cos(origin.lat * DEG) || 1e-6;
    const delta = (lon: number) => {
      let d = lon - origin.lon;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    };

    const heading = { x: delta(ahead.lon) * cosLat, y: ahead.lat - origin.lat };
    const norm = Math.hypot(heading.x, heading.y);
    if (norm === 0) continue;

    // Only genuine shadow edges make good band limits. A point sitting on the
    // Earth's limb is just where the outline was cut off, and using those makes
    // the limits hop back and forth from step to step.
    const edgePoints = outline.filter((p) => p.zeta > 1e-3);
    if (edgePoints.length < 2) continue;

    let left: { p: GeoPoint; offset: number } | null = null;
    let right: { p: GeoPoint; offset: number } | null = null;
    for (const p of edgePoints) {
      const offset = (heading.x * (p.lat - origin.lat) - heading.y * delta(p.lon) * cosLat) / norm;
      if (!left || offset > left.offset) left = { p, offset };
      if (!right || offset < right.offset) right = { p, offset };
    }
    if (!left || !right) continue;

    edges.push({
      t,
      left: left.p,
      right: right.p,
      axisOnEarth: centralLinePoint(el, t) !== null,
      outlineComplete: outline.length === samples,
    });
  }

  return edges;
}

export interface CentralPoint {
  lon: number;
  lat: number;
  /** Hours from t0. */
  t: number;
  /** Duration of totality on the central line, seconds. */
  durationSeconds: number;
  /** Sun altitude at the central point, degrees. */
  sunAltitude: number;
}

/**
 * Point where the shadow axis meets the ellipsoid, i.e. one point of the
 * central line. Returns null when the axis misses the Earth.
 */
export function centralLinePoint(el: BesselianElements, t: number): CentralPoint | null {
  const s = shadowState(el, t);
  const rho1 = Math.sqrt(1 - E2 * Math.cos(s.d) ** 2);
  const sinD1 = Math.sin(s.d) / rho1;
  const cosD1 = (Math.sqrt(1 - E2) * Math.cos(s.d)) / rho1;

  const xi = s.x;
  const eta1 = s.y / rho1;
  const zetaSq = 1 - xi * xi - eta1 * eta1;
  if (zetaSq <= 0) return null;
  const zeta1 = Math.sqrt(zetaSq);

  const sinLat1 = eta1 * cosD1 + zeta1 * sinD1;
  const lat1 = Math.asin(sinLat1);
  const latDeg = Math.atan(Math.tan(lat1) / Math.sqrt(1 - E2)) / DEG;

  const cosLat1 = Math.cos(lat1);
  const sinH = xi / cosLat1;
  const cosH = (zeta1 * cosD1 - eta1 * sinD1) / cosLat1;
  const hourAngle = Math.atan2(sinH, cosH);
  const lonDeg = normalizeLon((hourAngle - s.mu) / DEG);

  // True zeta of the surface point (rho2 / d2 auxiliaries, Espenak eq. for
  // the central line): needed because the cone radii shrink with zeta.
  const rho2 = Math.sqrt(1 - E2 * Math.sin(s.d) ** 2);
  const sinD1MinusD2 = (E2 * Math.sin(s.d) * Math.cos(s.d)) / (rho1 * rho2);
  const zeta = rho2 * (zeta1 * cosD1 - eta1 * sinD1MinusD2);

  const l2 = s.l2 - zeta * el.tanF2;

  // Shadow velocity in the fundamental plane, minus the observer's own motion
  // carried by the Earth's rotation; totality lasts while the umbral disc of
  // radius |l2| sweeps past.
  const dt = 1 / 3600;
  const sNext = shadowState(el, t + dt);
  const xRate = (sNext.x - s.x) / dt;
  const yRate = (sNext.y - s.y) / dt;
  const muRate = el.mu[1] * DEG; // rad/hour
  const dRate = el.d[1] * DEG; // rad/hour
  const xiRate = muRate * (zeta * Math.cos(s.d) - s.y * Math.sin(s.d));
  const etaRate = muRate * xi * Math.sin(s.d) + dRate * zeta;
  const nRel = Math.hypot(xRate - xiRate, yRate - etaRate);
  const durationHours = nRel > 0 ? (2 * Math.abs(l2)) / nRel : 0;

  return {
    lon: lonDeg,
    lat: latDeg,
    t,
    durationSeconds: durationHours * 3600,
    sunAltitude: Math.asin(Math.max(-1, Math.min(1, zeta))) / DEG,
  };
}

/**
 * Instant of greatest eclipse: the shadow axis passes closest to the Earth's
 * centre, i.e. sqrt(x^2 + y^2) is minimal. Golden-section on a coarse bracket.
 */
export function greatestEclipseTime(el: BesselianElements): number {
  const axisDistance = (t: number) => {
    const s = shadowState(el, t);
    return Math.hypot(s.x, s.y);
  };
  let bestT = -4;
  let best = Infinity;
  for (let t = -4; t <= 4; t += 1 / 60) {
    const v = axisDistance(t);
    if (v < best) {
      best = v;
      bestT = t;
    }
  }
  let lo = bestT - 1 / 60;
  let hi = bestT + 1 / 60;
  for (let i = 0; i < 60; i += 1) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (axisDistance(m1) < axisDistance(m2)) hi = m2;
    else lo = m1;
  }
  return (lo + hi) / 2;
}

/** Convert hours-from-t0 into a UTC ISO timestamp. */
export function tToUtcIso(el: BesselianElements, t: number): string {
  const hoursTdt = el.t0 + t;
  const ms = Date.parse(`${el.date}T00:00:00Z`) + (hoursTdt * 3600 - el.deltaT) * 1000;
  return new Date(Math.round(ms / 1000) * 1000).toISOString();
}
