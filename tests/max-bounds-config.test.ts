import test from 'node:test';
import assert from 'node:assert/strict';

import { validateConfig } from '../src/config/validator';

function baseConfig(runtimeMap?: Record<string, unknown>, center: [number, number] = [5, 52]) {
  return {
    map: { type: 'maplibre', center, zoom: 6 },
    ...(runtimeMap ? { runtimeMap } : {}),
    layerData: { sources: [], layers: [] },
  };
}

function errorsFor(config: unknown): string[] {
  return validateConfig(config).errors.map((e) => `${e.path}: ${e.message}`);
}

function warningsFor(config: unknown): string[] {
  return validateConfig(config).warnings.map((w) => `${w.path}: ${w.message}`);
}

test('maxBounds: valid bbox passes without errors or warnings', () => {
  const result = validateConfig(baseConfig({ maxBounds: [3.2, 50.7, 7.3, 53.6] }));
  assert.equal(result.valid, true);
  assert.deepEqual(result.warnings.filter((w) => w.path.includes('maxBounds')), []);
});

test('maxBounds: rejects non-array and wrong length', () => {
  assert.ok(errorsFor(baseConfig({ maxBounds: 'europe' })).some((e) => e.includes('maxBounds')));
  assert.ok(errorsFor(baseConfig({ maxBounds: [3.2, 50.7, 7.3] })).some((e) => e.includes('maxBounds')));
  assert.ok(errorsFor(baseConfig({ maxBounds: [3.2, 50.7, 7.3, 'x'] })).some((e) => e.includes('maxBounds')));
});

test('maxBounds: rejects west >= east (antimeridian crossing unsupported)', () => {
  const errors = errorsFor(baseConfig({ maxBounds: [170, 50, -170, 60] }));
  assert.ok(errors.some((e) => e.includes('west must be less than east')));
});

test('maxBounds: rejects south >= north and out-of-range latitudes', () => {
  assert.ok(errorsFor(baseConfig({ maxBounds: [3, 55, 7, 50] })).some((e) => e.includes('south must be less than north')));
  assert.ok(errorsFor(baseConfig({ maxBounds: [3, -95, 7, 50] })).some((e) => e.includes('latitudes')));
});

test('maxBounds: warns when map.center lies outside the bounds', () => {
  const warnings = warningsFor(baseConfig({ maxBounds: [3.2, 50.7, 7.3, 53.6] }, [30, 30]));
  assert.ok(warnings.some((w) => w.includes('outside "runtimeMap.maxBounds"')));
});
