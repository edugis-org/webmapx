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
