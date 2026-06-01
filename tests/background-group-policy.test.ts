import test from 'node:test';
import assert from 'node:assert/strict';

import {
  rememberSingleGroupInsertSlotForGroup,
  resolveSingleGroupInsertionOptionsForGroup,
} from '../src/components/internal/single-group-policy';
import { resolveLegendRoleForLayer } from '../src/components/internal/legend-role-policy';

test('single-group slot retention keeps replacement basemap before active overlay', () => {
  const slotMap = new Map<string, { beforeLayerId?: string; afterLayerId?: string }>();
  const roleMap = new Map<string, 'background' | 'overlay'>();

  rememberSingleGroupInsertSlotForGroup(
    'basemap',
    'osm',
    ['osm', 'india'],
    { osm: { legendRole: 'background' } },
    slotMap,
    roleMap,
  );

  const insertion = resolveSingleGroupInsertionOptionsForGroup(
    'basemap',
    ['india'],
    undefined,
    slotMap,
  );

  assert.deepEqual(insertion, { beforeLayerId: 'india' });
});

test('single-group replacement inherits legend background role', () => {
  const roleMap = new Map<string, 'background' | 'overlay'>([['basemap', 'background']]);
  const groupByLayerId = new Map<string, string>([['osm', 'basemap']]);

  const role = resolveLegendRoleForLayer(
    'google-satellite',
    null,
    'basemap',
    roleMap,
    'osm',
    groupByLayerId,
  );

  assert.equal(role, 'background');
});
