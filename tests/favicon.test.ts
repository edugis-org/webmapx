import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as path from 'node:path';

// Guards against the recurring favicon regression: a page referencing
// ./favicon.ico (or another stale name) while the real file is public/favicon.png.
// Checks, per HTML page: an icon link exists, its extension and MIME type match,
// the referenced file resolves to an existing file under public/ (Vite serves
// public/ at the site root), and that file really is a PNG.

const repoRoot = process.cwd();
const htmlFiles = ['index.html', 'testpages/preview.html', 'testpages/setup.html'];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function extractIconLink(html: string): { href: string; type?: string } | null {
  const linkTag = html.match(/<link\b[^>]*\brel=["']icon["'][^>]*>/i)?.[0];
  if (!linkTag) return null;
  const href = linkTag.match(/\bhref=["']([^"']+)["']/i)?.[1];
  const type = linkTag.match(/\btype=["']([^"']+)["']/i)?.[1];
  return href ? { href, type } : null;
}

/** Resolves a relative href from an HTML file to the URL path Vite would serve. */
function toServedPath(htmlFile: string, href: string): string {
  const htmlDir = path.posix.dirname(htmlFile);
  return path.posix.normalize(path.posix.join(htmlDir, href));
}

for (const htmlFile of htmlFiles) {
  test(`favicon: ${htmlFile} links an existing PNG favicon correctly`, () => {
    const htmlPath = path.join(repoRoot, htmlFile);
    assert.ok(existsSync(htmlPath), `${htmlFile} not found`);

    const icon = extractIconLink(readFileSync(htmlPath, 'utf8'));
    assert.ok(icon, `${htmlFile} has no <link rel="icon"> tag`);

    // Right extension: file on disk is a PNG, so the href must say .png.
    assert.match(icon.href, /\.png$/, `${htmlFile} icon href "${icon.href}" must end in .png`);

    // MIME type (when declared) must match the extension.
    if (icon.type !== undefined) {
      assert.equal(icon.type, 'image/png', `${htmlFile} icon type "${icon.type}" must be image/png`);
    }

    // The served URL must escape neither the site root nor public/.
    const servedPath = toServedPath(htmlFile, icon.href);
    assert.ok(!servedPath.startsWith('..'), `${htmlFile} icon href "${icon.href}" resolves outside the site root`);

    // Vite serves public/ at the root — the file must exist there.
    const filePath = path.join(repoRoot, 'public', servedPath);
    assert.ok(existsSync(filePath), `favicon file missing: public/${servedPath} (referenced from ${htmlFile})`);

    // Content check: the bytes must actually be PNG (the original bug was a
    // PNG file shipped with an .ico name, and vice versa).
    const header = readFileSync(filePath).subarray(0, PNG_SIGNATURE.length);
    assert.ok(header.equals(PNG_SIGNATURE), `public/${servedPath} is not a real PNG file`);
  });
}
