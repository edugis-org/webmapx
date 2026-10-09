import test from 'node:test';
import assert from 'node:assert/strict';

// ── Re-implement the helpers under test so we can test them without a DOM. ──
// (They are not exported; we inline equivalent logic and test the public
//  buildLayoutFromConfig behaviour via a fake DOM stub.)

// ---------------------------------------------------------------------------
// Minimal DOM stubs (no jsdom dependency)
// ---------------------------------------------------------------------------

interface FakeEl {
  tag: string;
  attrs: Record<string, string>;
  props: Record<string, unknown>;
  children: FakeEl[];
  text?: string;
  /** Custom properties set through style.setProperty. */
  styleProps: Record<string, string>;
}

function makeFakeDocument() {
  function createElement(tag: string): FakeEl & HTMLElement {
    const el: FakeEl = { tag, attrs: {}, props: {}, children: [], text: undefined, styleProps: {} };
    return new Proxy(el, {
      get(t, p) {
        if (p === 'setAttribute')   return (k: string, v: string) => { t.attrs[k] = v; };
        if (p === 'getAttribute')   return (k: string) => t.attrs[k] ?? null;
        if (p === 'appendChild')    return (c: FakeEl) => { t.children.push(c); return c; };
        if (p === 'insertBefore')   return (c: FakeEl) => { t.children.unshift(c); return c; };
        if (p === 'style')          return new Proxy({}, {
          set: () => true,
          get: (_s, sp) => sp === 'setProperty'
            ? (k: string, v: string) => { t.styleProps[k] = v; }
            : undefined,
        });
        if (p === 'textContent')    return { set(v: string) { t.text = v; } };
        if (typeof p === 'string') {
          if (p in t.props) return t.props[p];
          return t[p as keyof FakeEl];
        }
      },
      set(t, p, v) {
        if (p === 'textContent') { t.text = String(v); return true; }
        t.props[p as string] = v;
        return true;
      },
    }) as unknown as FakeEl & HTMLElement;
  }

  return { createElement } as unknown as Document;
}

// Patch global document before importing the module under test
const fakeDoc = makeFakeDocument();
(globalThis as Record<string, unknown>)['document'] = fakeDoc;

// Now import the module. It uses document only inside functions (not at module scope).
const { buildLayoutFromConfig } = await import('../src/utils/dynamic-layout.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLayout(): FakeEl & HTMLElement {
  return (fakeDoc as unknown as Document).createElement('webmapx-layout') as unknown as FakeEl & HTMLElement;
}

function findByTag(el: FakeEl, tag: string): FakeEl[] {
  const results: FakeEl[] = [];
  function walk(node: FakeEl) {
    if (node.tag === tag) results.push(node);
    node.children.forEach(walk);
  }
  walk(el);
  return results;
}

// ---------------------------------------------------------------------------
// Tests: resolveToolbarItemMetadata (tested via buildLayoutFromConfig output)
// ---------------------------------------------------------------------------

test('toolbar button gets default label and icon for known tool type', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'search-tool', type: 'search', enabled: true }],
    },
  });

  const buttons = findByTag(layout, 'sl-button');
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].attrs['data-tooltip'], 'Search');
  const srSpan = buttons[0].children.find(c => c.tag === 'span');
  assert.equal(srSpan?.text, 'Search');

  const icons = findByTag(layout, 'sl-icon');
  assert.equal(icons.length, 1);
  assert.equal(icons[0].attrs['name'], 'search');
});

test('explicit label in config overrides default', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'measure-tool', type: 'measure', label: 'Afstand meten', enabled: true }],
    },
  });

  const buttons = findByTag(layout, 'sl-button');
  const srSpan = buttons[0].children.find(c => c.tag === 'span');
  assert.equal(srSpan?.text, 'Afstand meten');
});

test('explicit icon in config overrides default', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'search-tool', type: 'search', icon: 'binoculars', enabled: true }],
    },
  });

  const icons = findByTag(layout, 'sl-icon');
  assert.equal(icons[0].attrs['name'], 'binoculars');
});

test('object icon config applied to sl-icon element', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'custom', type: 'search', icon: { name: 'star', library: 'custom-lib' }, enabled: true }],
    },
  });

  const icons = findByTag(layout, 'sl-icon');
  assert.equal(icons[0].attrs['name'], 'star');
  assert.equal(icons[0].attrs['library'], 'custom-lib');
});

test('button falls back to text content when no icon resolves', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      // 'custom-unknown' has no default metadata and no explicit icon
      items: [{ id: 'my-tool', type: 'custom-unknown', label: 'My Tool', enabled: true }],
    },
  });

  const buttons = findByTag(layout, 'sl-button');
  assert.equal(buttons[0].text, 'My Tool');
  const icons = findByTag(layout, 'sl-icon');
  assert.equal(icons.length, 0);
});

test('buildLayoutFromConfig does not mutate the original config object', () => {
  const tools = {
    legend: {
      enabled: true,
      position: 'top-right',
    },
  };
  const originalLabel = (tools.legend as Record<string, unknown>).label;
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, tools);
  assert.equal((tools.legend as Record<string, unknown>).label, originalLabel,
    'label must not be written back onto the original config object');
});

test('same-origin src icon is applied to sl-icon', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'custom', type: 'search', icon: { src: '/icons/my-tool.svg' }, enabled: true }],
    },
  });

  const icons = findByTag(layout, 'sl-icon');
  assert.equal(icons[0].attrs['src'], '/icons/my-tool.svg');
});

test('cross-origin src icon is blocked and logs a warning', () => {
  const layout = makeLayout();
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  try {
    buildLayoutFromConfig(layout as unknown as HTMLElement, {
      mainToolbar: {
        enabled: true,
        type: 'toolbar',
        position: 'top-left',
        items: [{ id: 'evil', type: 'search', icon: { src: 'https://evil.example.com/xss.svg' }, enabled: true }],
      },
    });
  } finally {
    console.warn = origWarn;
  }

  assert.ok(warnings.some(w => w.includes('cross-origin') && w.includes('evil.example.com')),
    'expected cross-origin warning');
  // Button should fall back to text (no valid src and no name)
  const buttons = findByTag(layout, 'sl-button');
  assert.equal(buttons[0].text, 'Search');
});

test('icon property set on tool element for pre-upgrade consumption', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'search-tool', type: 'search', enabled: true }],
    },
  });

  // Find the tool element (webmapx-search-tool) inside the panel
  const toolEls = findByTag(layout, 'webmapx-search-tool');
  assert.equal(toolEls.length, 1);
  assert.equal(toolEls[0].attrs['label'], 'Search');
  // Raw ToolIconConfig value — string shorthand preserved as-is
  assert.equal(toolEls[0].props['icon'], 'search');
});

// ── Buffer / Routing / Isochrone layout registration ──────────────────────────

test('buffer tool resolves to webmapx-buffer-tool element', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'buffer-tool', type: 'buffer', enabled: true }],
    },
  });

  const toolEls = findByTag(layout, 'webmapx-buffer-tool');
  assert.equal(toolEls.length, 1);
  assert.equal(toolEls[0].attrs['label'], 'Buffer');
});

test('geoprocessing tool resolves to webmapx-geoprocessing-tool element', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'analysis', type: 'geoprocessing', enabled: true }],
    },
  });

  const toolEls = findByTag(layout, 'webmapx-geoprocessing-tool');
  assert.equal(toolEls.length, 1);
  assert.equal(toolEls[0].attrs['label'], 'Analysis');
});

test('buffer tool uses src icon (not named icon)', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'buffer-tool', type: 'buffer', enabled: true }],
    },
  });

  const icons = findByTag(layout, 'sl-icon');
  // toolbar button icon: must use src, not name
  const buttonIcon = icons.find(i => i.attrs['src']?.includes('buffer.svg') || i.attrs['src']?.startsWith('data:image/svg'));
  assert.ok(buttonIcon, 'sl-icon with buffer.svg src present');
  assert.equal(buttonIcon!.attrs['name'], undefined, 'no name attribute on src icon');
});

test('routing tool resolves to webmapx-routing-tool element with default label', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'routing-tool', type: 'routing', enabled: true }],
    },
  });

  const toolEls = findByTag(layout, 'webmapx-routing-tool');
  assert.equal(toolEls.length, 1);
  assert.equal(toolEls[0].attrs['label'], 'Routing');

  const icons = findByTag(layout, 'sl-icon');
  assert.equal(icons[0].attrs['name'], 'signpost-split');
});

test('isochrone tool resolves to webmapx-isochrone-tool element with default label', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [{ id: 'isochrone-tool', type: 'isochrone', enabled: true }],
    },
  });

  const toolEls = findByTag(layout, 'webmapx-isochrone-tool');
  assert.equal(toolEls.length, 1);
  assert.equal(toolEls[0].attrs['label'], 'Isochrone');

  const icons = findByTag(layout, 'sl-icon');
  assert.equal(icons[0].attrs['name'], 'broadcast');
});

test('all three new tools respect enabled:false', () => {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: {
      enabled: true,
      type: 'toolbar',
      position: 'top-left',
      items: [
        { id: 'routing-tool',   type: 'routing',   enabled: false },
        { id: 'isochrone-tool', type: 'isochrone', enabled: false },
        { id: 'buffer-tool',    type: 'buffer',    enabled: false },
      ],
    },
  });

  assert.equal(findByTag(layout, 'webmapx-routing-tool').length,   0);
  assert.equal(findByTag(layout, 'webmapx-isochrone-tool').length, 0);
  assert.equal(findByTag(layout, 'webmapx-buffer-tool').length,    0);
});

// ---------------------------------------------------------------------------
// Tests: tool accents
// ---------------------------------------------------------------------------

function buildToolbar(items: Record<string, unknown>[], extra: Record<string, unknown> = {}) {
  const layout = makeLayout();
  buildLayoutFromConfig(layout as unknown as HTMLElement, {
    mainToolbar: { enabled: true, type: 'toolbar', position: 'top-left', items, ...extra },
  });
  return layout;
}

test('toolbar buttons get accents by position, not by tool', () => {
  // The same tool in a different position gets a different colour: the
  // default must vary down any toolbar, whichever tools a config picks.
  const a = buildToolbar([{ type: 'search' }, { type: 'measure' }, { type: 'info' }]);
  const b = buildToolbar([{ type: 'info' }, { type: 'search' }]);
  const accentsA = findByTag(a, 'sl-button').map(btn => btn.styleProps['--webmapx-tool-accent']);
  const accentsB = findByTag(b, 'sl-button').map(btn => btn.styleProps['--webmapx-tool-accent']);
  assert.deepEqual(accentsA, [
    'var(--webmapx-tool-palette-cyan)',
    'var(--webmapx-tool-palette-green)',
    'var(--webmapx-tool-palette-yellow)',
  ]);
  assert.equal(accentsB[0], 'var(--webmapx-tool-palette-cyan)');
});

test('spacers do not take a colour from the sequence', () => {
  const layout = buildToolbar([{ type: 'search' }, { type: 'spacer' }, { type: 'info' }]);
  const accents = findByTag(layout, 'sl-button').map(btn => btn.styleProps['--webmapx-tool-accent']);
  assert.deepEqual(accents, ['var(--webmapx-tool-palette-cyan)', 'var(--webmapx-tool-palette-green)']);
});

test('item color overrides the positional accent, as a palette name or a CSS colour', () => {
  const layout = buildToolbar([
    { type: 'search', color: 'Purple' },
    { type: 'info', color: '#123456' },
    { type: 'measure' },
  ]);
  const accents = findByTag(layout, 'sl-button').map(btn => btn.styleProps['--webmapx-tool-accent']);
  assert.deepEqual(accents, [
    'var(--webmapx-tool-palette-purple)',
    '#123456',
    // Overrides do not consume palette entries: the first default is still cyan.
    'var(--webmapx-tool-palette-cyan)',
  ]);
});

test('a default accent never repeats the colour directly above it', () => {
  const layout = buildToolbar([{ type: 'search', color: 'cyan' }, { type: 'info' }]);
  const accents = findByTag(layout, 'sl-button').map(btn => btn.styleProps['--webmapx-tool-accent']);
  assert.deepEqual(accents, ['var(--webmapx-tool-palette-cyan)', 'var(--webmapx-tool-palette-green)']);
});

test('the tool element carries its button accent, for the panel header', () => {
  const layout = buildToolbar([{ type: 'search' }, { type: 'info' }]);
  const info = findByTag(layout, 'webmapx-info-tool')[0];
  assert.equal(info?.styleProps['--webmapx-tool-accent'], 'var(--webmapx-tool-palette-green)');
});

test('labels: true shows names on the rail instead of in tooltips', () => {
  const layout = buildToolbar([{ type: 'search' }], { labels: true });
  const toolbar = findByTag(layout, 'webmapx-toolbar')[0];
  assert.equal(toolbar.attrs['labels'], '');
  const button = findByTag(layout, 'sl-button')[0];
  assert.equal(button.attrs['data-tooltip'], undefined);
  const label = button.children.find(c => c.tag === 'span');
  assert.equal(label?.text, 'Search');
  assert.equal(label?.props['className'], 'webmapx-toolbar-label');
});
