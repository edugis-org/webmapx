/**
 * The reference and the code name the same computed layers.
 *
 * `INTERNAL_SOURCES` is what a config can actually run; `INTERNAL_SOURCE_DOCS`
 * is what the documentation says exists. They are separate on purpose — the
 * docs build reads the catalog through the config entry point, which must not
 * drag in the astronomy or the plate data — and separate lists drift, so this
 * is what stops a new computed layer shipping undocumented, or a removed one
 * lingering in the reference as an offer the code will not honour.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { INTERNAL_SOURCES } from '../src/utils/internal-sources';
import { INTERNAL_SOURCE_CATEGORIES, INTERNAL_SOURCE_DOCS } from '../src/utils/internal-source-catalog';

test('every computed layer is documented, and every documented one exists', () => {
    const implemented = Object.keys(INTERNAL_SOURCES).sort();
    const documented = INTERNAL_SOURCE_DOCS.map(doc => doc.id).sort();
    assert.deepEqual(documented, implemented);
});

test('each entry says enough to be worth reading', () => {
    for (const doc of INTERNAL_SOURCE_DOCS) {
        assert.ok(doc.label.length > 0, `${doc.id} has no label`);
        assert.ok(doc.summary.length > 20, `${doc.id} has no real summary`);
        assert.ok(doc.geometry.length > 0, `${doc.id} does not say what it draws`);
        assert.ok(
            doc.example.startsWith(`internalfunc://${doc.id}`),
            `${doc.id}'s example url names a different generator: ${doc.example}`,
        );
        const names = doc.params.map(p => p.name);
        assert.deepEqual(names, [...new Set(names)], `${doc.id} lists a parameter twice`);
    }
});

/**
 * The attributes are the part a reader cannot check for themselves: most of
 * these layers keep their answer in a property rather than in the shape, so a
 * documented name that no longer exists sends someone hunting for a number the
 * feature does not carry. Running the generator is the only way to know.
 *
 * The two deep-time layers are left out: they fetch a rotation model over the
 * network, which a unit test has no business doing — `tests/spherical-geojson`
 * and the deep-time UI test cover that side.
 */
test('documented attributes are the attributes the generators actually write', () => {
    const at = new Date('2026-03-21T12:00:00Z');
    for (const doc of INTERNAL_SOURCE_DOCS) {
        if (doc.category === 'deep-time') continue;
        const produced = new Set<string>();
        const collect = (query: string) => {
            const fc = INTERNAL_SOURCES[doc.id]({ at, query: new URLSearchParams(query) } as never);
            for (const feature of fc.features) {
                for (const key of Object.keys(feature.properties ?? {})) produced.add(key);
            }
        };
        collect('');
        // A layer with an `observer` param — moon-phase, at present — writes a
        // second set of attributes only once one is given, and the no-observer
        // run above never sees them. Run it a second time with one, or the
        // check only ever covers half the layer's actual output.
        if (doc.params.some(p => p.name === 'observer')) collect('observer=5,52');

        const documented = new Set(doc.attributes.map(a => a.name));
        for (const key of produced) {
            assert.ok(documented.has(key), `${doc.id} returns an undocumented attribute: ${key}`);
        }
        // The other direction catches a rename: a documented attribute nothing
        // writes is a reader looking for a value that will never be there.
        for (const name of documented) {
            assert.ok(produced.has(name), `${doc.id} documents an attribute it never writes: ${name}`);
        }
    }
});

test('documented geometry kinds are the kinds the generators return', () => {
    const at = new Date('2026-03-21T12:00:00Z');
    const kindOf = (type: string) =>
        type.includes('Point') ? 'point' : type.includes('LineString') ? 'line' : 'polygon';
    for (const doc of INTERNAL_SOURCE_DOCS) {
        if (doc.category === 'deep-time') continue;
        const fc = INTERNAL_SOURCES[doc.id]({ at, query: new URLSearchParams() } as never);
        const produced = new Set(fc.features.map(f => kindOf(f.geometry?.type ?? '')));
        assert.deepEqual(
            [...produced].sort(),
            [...doc.geometryKinds].sort(),
            `${doc.id} draws ${[...produced].join('+')}, documented as ${doc.geometryKinds.join('+')}`,
        );
    }
});

test('every entry belongs to a listed category', () => {
    const known = new Set(INTERNAL_SOURCE_CATEGORIES.map(c => c.id));
    for (const doc of INTERNAL_SOURCE_DOCS) {
        assert.ok(known.has(doc.category), `${doc.id} is in unlisted category ${doc.category}`);
    }
    // And no category is left with nothing in it, which would render an empty heading.
    for (const category of INTERNAL_SOURCE_CATEGORIES) {
        assert.ok(
            INTERNAL_SOURCE_DOCS.some(doc => doc.category === category.id),
            `category ${category.id} has no layers`,
        );
    }
});
