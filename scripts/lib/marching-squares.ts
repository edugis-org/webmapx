/**
 * Minimal marching-squares isoline extraction on a regular lon/lat grid.
 *
 * Emits linearly-interpolated segments per cell, then chains them into
 * polylines. Rings that close on themselves are reported as closed.
 */

export interface Grid {
  /** values[row * width + col], row 0 = lat0. */
  values: Float64Array;
  width: number;
  height: number;
  lon0: number;
  lat0: number;
  dLon: number;
  dLat: number;
}

export type Ring = { points: [number, number][]; closed: boolean };

function interp(v0: number, v1: number, level: number): number {
  const denom = v1 - v0;
  if (denom === 0) return 0.5;
  return (level - v0) / denom;
}

export function isolines(grid: Grid, level: number): Ring[] {
  const { values, width, height, lon0, lat0, dLon, dLat } = grid;
  const segments: [[number, number], [number, number]][] = [];

  const at = (r: number, c: number) => values[r * width + c];
  const lonOf = (c: number) => lon0 + c * dLon;
  const latOf = (r: number) => lat0 + r * dLat;

  for (let r = 0; r < height - 1; r += 1) {
    for (let c = 0; c < width - 1; c += 1) {
      // Corners: bottom-left, bottom-right, top-right, top-left.
      const v0 = at(r, c);
      const v1 = at(r, c + 1);
      const v2 = at(r + 1, c + 1);
      const v3 = at(r + 1, c);
      let index = 0;
      if (v0 >= level) index |= 1;
      if (v1 >= level) index |= 2;
      if (v2 >= level) index |= 4;
      if (v3 >= level) index |= 8;
      if (index === 0 || index === 15) continue;

      const bottom = (): [number, number] => [lonOf(c) + interp(v0, v1, level) * dLon, latOf(r)];
      const right = (): [number, number] => [
        lonOf(c + 1),
        latOf(r) + interp(v1, v2, level) * dLat,
      ];
      const top = (): [number, number] => [
        lonOf(c) + interp(v3, v2, level) * dLon,
        latOf(r + 1),
      ];
      const left = (): [number, number] => [lonOf(c), latOf(r) + interp(v0, v3, level) * dLat];

      const push = (a: [number, number], b: [number, number]) => segments.push([a, b]);

      switch (index) {
        case 1:
        case 14:
          push(left(), bottom());
          break;
        case 2:
        case 13:
          push(bottom(), right());
          break;
        case 3:
        case 12:
          push(left(), right());
          break;
        case 4:
        case 11:
          push(right(), top());
          break;
        case 5:
          push(left(), top());
          push(bottom(), right());
          break;
        case 6:
        case 9:
          push(bottom(), top());
          break;
        case 7:
        case 8:
          push(left(), top());
          break;
        case 10:
          push(left(), bottom());
          push(right(), top());
          break;
        default:
          break;
      }
    }
  }

  return chain(segments, Math.min(Math.abs(dLon), Math.abs(dLat)) / 4);
}

/** Join loose segments end-to-end into polylines. */
function chain(segments: [[number, number], [number, number]][], tol: number): Ring[] {
  const key = (p: [number, number]) => `${Math.round(p[0] / tol)}:${Math.round(p[1] / tol)}`;
  const buckets = new Map<string, number[]>();
  segments.forEach((seg, i) => {
    for (const p of seg) {
      const k = key(p);
      const list = buckets.get(k);
      if (list) list.push(i);
      else buckets.set(k, [i]);
    }
  });

  const used = new Array<boolean>(segments.length).fill(false);
  const rings: Ring[] = [];

  const takeNeighbour = (p: [number, number]): number => {
    const list = buckets.get(key(p));
    if (!list) return -1;
    for (const i of list) if (!used[i]) return i;
    return -1;
  };

  for (let start = 0; start < segments.length; start += 1) {
    if (used[start]) continue;
    used[start] = true;
    const points: [number, number][] = [segments[start][0], segments[start][1]];

    // Extend forward, then backward.
    for (let dir = 0; dir < 2; dir += 1) {
      for (;;) {
        const end = dir === 0 ? points[points.length - 1] : points[0];
        const next = takeNeighbour(end);
        if (next === -1) break;
        used[next] = true;
        const [a, b] = segments[next];
        const other = key(a) === key(end) ? b : a;
        if (dir === 0) points.push(other);
        else points.unshift(other);
      }
    }

    const closed = key(points[0]) === key(points[points.length - 1]) && points.length > 3;
    if (closed) points[points.length - 1] = points[0];
    if (points.length >= 2) rings.push({ points, closed });
  }

  return rings;
}
