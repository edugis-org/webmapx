import test from 'node:test';
import assert from 'node:assert/strict';

import {
    branchSlug,
    renderIndex,
    totalBytes,
    withPreview,
    withoutPreview,
    type PreviewEntry,
} from '../scripts/lib/preview-site';

test('branchSlug turns a branch name into one URL folder', () => {
    assert.equal(branchSlug('main'), 'main');
    assert.equal(branchSlug('feat/New_Legend'), 'feat-new-legend');
    assert.equal(branchSlug('fix//layer--tree..order'), 'fix-layer-tree-order');
    assert.equal(branchSlug('-_leading/and/trailing_-'), 'leading-and-trailing');
    assert.equal(branchSlug('ëxtra/ünicode'), 'xtra-nicode');
    assert.equal(branchSlug('///'), '');
});

test('branchSlug caps the length without leaving a trailing hyphen', () => {
    const slug = branchSlug(`${'a'.repeat(59)}/b`);
    assert.equal(slug, 'a'.repeat(59));
    assert.ok(branchSlug('x'.repeat(200)).length <= 60);
});

const entry = (slug: string, bytes = 100, deployed = '2026-10-04T12:00:00.000Z'): PreviewEntry =>
    ({ slug, branch: slug, sha: 'abcdef1234567', deployed, bytes });

test('a redeploy replaces the earlier entry for the same folder', () => {
    const once = withPreview([entry('main'), entry('feat-x', 5)], entry('feat-x', 7));
    assert.deepEqual(once.map((e) => [e.slug, e.bytes]), [['feat-x', 7], ['main', 100]]);
    assert.equal(totalBytes(once), 107);
    assert.deepEqual(withoutPreview(once, 'feat-x').map((e) => e.slug), ['main']);
});

test('the index lists main first and escapes branch names', () => {
    const html = renderIndex([
        entry('zeta', 1, '2026-10-05T00:00:00.000Z'),
        { ...entry('main'), branch: 'main' },
        { ...entry('evil'), branch: '<script>x</script>' },
    ], 'https://github.com/edugis-org/webmapx');
    assert.ok(html.indexOf('href="./main/"') < html.indexOf('href="./zeta/"'));
    assert.ok(!html.includes('<script>x'));
    assert.ok(html.includes('&#60;script&#62;x'));
});
