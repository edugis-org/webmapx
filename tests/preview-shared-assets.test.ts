import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { MIN_SHARED_BYTES, rewriteReferences, shareLargeBinaries, sharedName } from '../scripts/lib/preview-shared-assets';

test('rewriteReferences rewrites the two forms Vite emits, and nothing else', () => {
    const source = [
        'a=new URL(`gdal-X.wasm`,self.location.href).href;',
        'b=(new URL(`./gdal-X.wasm`, self.location.href).href);',
        "c=new URL('gdal-X.wasm', import.meta.url);",
        'd=new URL(`gdal-X.wasm`, document.baseURI);',
        'e="gdal-X.wasm";',
    ].join('\n');
    const { text, count } = rewriteReferences(source, 'gdal-X.wasm', '../../_shared/h.wasm');
    assert.equal(count, 3);
    assert.match(text, /a=new URL\(`\.\.\/\.\.\/_shared\/h\.wasm`,self\.location\.href\)/);
    assert.match(text, /b=\(new URL\(`\.\.\/\.\.\/_shared\/h\.wasm`, self\.location\.href\)/);
    assert.match(text, /c=new URL\('\.\.\/\.\.\/_shared\/h\.wasm', import\.meta\.url\)/);
    assert.match(text, /d=new URL\(`gdal-X\.wasm`, document\.baseURI\)/);
    assert.match(text, /e="gdal-X\.wasm"/);
});

test('sharedName depends on content only, keeping .wasm and folding the rest into .bin', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    assert.equal(sharedName(bytes, 'a.data'), sharedName(bytes, 'b-inlined-1.bin'));
    assert.match(sharedName(bytes, 'x.wasm'), /^[0-9a-f]{20}\.wasm$/);
    assert.notEqual(sharedName(bytes, 'x.wasm'), sharedName(new Uint8Array([3, 2, 1]), 'x.wasm'));
});

function preview(): { root: string; dir: string; shared: string } {
    const root = mkdtempSync(path.join(tmpdir(), 'preview-share-'));
    const dir = path.join(root, 'branch');
    mkdirSync(path.join(dir, 'assets'), { recursive: true });
    mkdirSync(path.join(dir, 'dist-lib', 'assets'), { recursive: true });
    return { root, dir, shared: path.join(root, '_shared') };
}

test('shareLargeBinaries stores identical copies once and points both workers at it', () => {
    const { dir, shared } = preview();
    const big = Buffer.alloc(MIN_SHARED_BYTES, 7);
    writeFileSync(path.join(dir, 'assets', 'gdal-A.wasm'), big);
    writeFileSync(path.join(dir, 'assets', 'worker-A.js'), 'x=new URL(`gdal-A.wasm`,self.location.href)');
    writeFileSync(path.join(dir, 'dist-lib', 'assets', 'w-inlined-0.wasm'), big);
    writeFileSync(path.join(dir, 'dist-lib', 'assets', 'w.js'), 'x=(new URL(`./w-inlined-0.wasm`, self.location.href))');

    const { shared: moved, kept } = shareLargeBinaries(dir, shared);
    const name = sharedName(big, 'x.wasm');
    assert.deepEqual(moved, { [name]: MIN_SHARED_BYTES });
    assert.deepEqual(kept, []);
    assert.ok(existsSync(path.join(shared, name)));
    assert.ok(!existsSync(path.join(dir, 'assets', 'gdal-A.wasm')));
    assert.equal(readFileSync(path.join(dir, 'assets', 'worker-A.js'), 'utf8'),
        `x=new URL(\`../../_shared/${name}\`,self.location.href)`);
    assert.equal(readFileSync(path.join(dir, 'dist-lib', 'assets', 'w.js'), 'utf8'),
        `x=(new URL(\`../../../_shared/${name}\`, self.location.href))`);
});

test('shareLargeBinaries leaves a file alone when anything else mentions it', () => {
    const { dir, shared } = preview();
    writeFileSync(path.join(dir, 'assets', 'big.wasm'), Buffer.alloc(MIN_SHARED_BYTES, 1));
    writeFileSync(path.join(dir, 'assets', 'w.js'), 'x=new URL(`big.wasm`,import.meta.url)');
    writeFileSync(path.join(dir, 'index.html'), '<link rel="preload" href="assets/big.wasm">');
    writeFileSync(path.join(dir, 'assets', 'small.wasm'), Buffer.alloc(16));
    writeFileSync(path.join(dir, 'assets', 'unnamed.bin'), Buffer.alloc(MIN_SHARED_BYTES, 2));

    const { shared: moved, kept } = shareLargeBinaries(dir, shared);
    assert.deepEqual(moved, {});
    assert.deepEqual(kept.map((k) => k.file).sort(), ['assets/big.wasm', 'assets/unnamed.bin']);
    assert.equal(readFileSync(path.join(dir, 'assets', 'w.js'), 'utf8'), 'x=new URL(`big.wasm`,import.meta.url)');
    assert.ok(existsSync(path.join(dir, 'assets', 'big.wasm')));
});
