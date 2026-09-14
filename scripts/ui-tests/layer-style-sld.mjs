/**
 * UI Test: styling a WMS with a style of our own
 *
 * A WMS draws its own pictures, but some services will draw them the way the
 * client asks (`SLD_BODY`). Whether *this* service will is measured rather than
 * declared — the capabilities flag is worthless in practice — so this test is
 * about the whole chain working against a real service: probe, read the columns
 * from the sibling WFS, classify sampled values, and get the resulting document
 * into the urls the engine is actually requesting.
 *
 * The service is PDOK's BAG (the fixture's `pdok-bag-raster`), which honours
 * SLD and publishes a WFS. It is remote, so a step that cannot reach it is
 * skipped rather than failed — but a service that answers and is then styled
 * wrongly is a failure.
 */
import { appUrl } from './lib/fixture-config.mjs';
import { installDeepQuery } from './lib/deep-query.mjs';

const LAYER_ID = 'pdok-bag-raster';
// Amsterdam at building zoom: BAG draws nothing at country scale, and a blank
// sample is exactly what the probe must not mistake for "SLD ignored".
const VIEW = { center: [4.893, 52.372], zoom: 16 };

export const engines = ['maplibre', 'openlayers'];

function fail(message) {
  throw new Error(message);
}

/**
 * Waits for a condition instead of for a duration.
 *
 * Every wait here is on a third-party service — a probe, a capabilities read, a
 * GetFeature — so a fixed sleep has to be as long as the worst answer and costs
 * that much even when the answer was instant. Polling turns a 30-second suite
 * into a few seconds on a warm service and still tolerates a slow one.
 */
async function installWaitFor(page) {
  await page.evaluate(() => {
    window.__wmxWaitFor = async (check, timeout = 25000, step = 200) => {
      const until = Date.now() + timeout;
      for (;;) {
        const value = check();
        if (value) return value;
        if (Date.now() > until) return null;
        await new Promise((resolve) => setTimeout(resolve, step));
      }
    };
  });
}

/**
 * The sequence a user actually performs: open the panel before the layer draws
 * anything, then zoom in and open it again. The probe's answer in the first
 * case is about the *moment*, and remembering it left the layer unstyleable for
 * the rest of the session — reported from the app, not caught here, which is
 * why it is now a step of its own.
 */
async function checkStaleProbeIsNotRemembered({ page, step }) {
  await step('a look taken before the layer drew anything is not the final answer', async () => {
    const result = await page.evaluate(async ([id]) => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map.getAdapterAsync();
      // Zoomed out past BAG's own minimum scale: the service draws nothing.
      adapter.setViewport([4.893, 52.372], 7, { animate: false });
      await map.addLayerRequest({ layerId: id });
      const legend = document.querySelector('webmapx-layer-overview');
      await legend.handleShowLayerStyle(id, id);
      const settled = async () => window.__wmxWaitFor(() => {
        const p = window.__wmxDeepQuery('webmapx-layer-styler');
        return p && p.sldProbe !== null && !p.sldProbing;
      }, 30000);
      await settled();
      const first = window.__wmxDeepQuery('webmapx-layer-styler').sldProbe;

      window.__wmxDeepQuery('webmapx-layer-styler').close();
      // Zoom 15.07 on purpose: the map draws BAG here, but a probe that asks
      // for a fixed 256-pixel image is coarser than the map's own tiles and the
      // service suppresses buildings at that scale — reported from the app as
      // "this layer draws nothing where the map is looking".
      adapter.setViewport([4.893, 52.372], 15.07, { animate: false });
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await legend.handleShowLayerStyle(id, id);
      await settled();
      const second = window.__wmxDeepQuery('webmapx-layer-styler').sldProbe;
      window.__wmxDeepQuery('webmapx-layer-styler').close();
      return { first, second };
    }, [LAYER_ID]);
    if (result.first?.supported) {
      console.log('      (the service drew something even zoomed out; nothing stale to check)');
      return 'ok';
    }
    if (!result.second?.supported) {
      fail(`zoomed in, the probe still says ${result.second?.reason ?? 'nothing'} — a momentary answer was remembered`);
    }
    return 'ok';
  });
}

export async function run({ page, engine, baseUrl }) {
  console.log(`  Running WMS SLD styling test for engine: ${engine}`);

  await page.goto(appUrl(baseUrl, { styler: 'next' }), { waitUntil: 'domcontentloaded' });
  await installDeepQuery(page);
  await installWaitFor(page);
  await page.waitForFunction(async () => {
    const map = document.querySelector('webmapx-map');
    if (!map || typeof map.getAdapterAsync !== 'function') return false;
    return Boolean(await map.getAdapterAsync());
  }, undefined, { timeout: 45_000 });

  const step = async (label, fn) => {
    const outcome = await fn();
    console.log(`    ${outcome === 'skip' ? 'SKIP' : '✓'} ${label}`);
    return outcome;
  };

  await checkStaleProbeIsNotRemembered({ page, step });

  const open = await step('the panel probes the service and offers to draw it', async () => {
    const result = await page.evaluate(async ([id, view]) => {
      const map = document.querySelector('webmapx-map');
      const adapter = await map.getAdapterAsync();
      adapter.setViewport(view.center, view.zoom, { animate: false });
      const added = await map.addLayerRequest({ layerId: id });
      if (!added && !adapter.store.getState().mapLayers[id]) return { error: `${id} was not added` };
      // The layer must be drawing before the probe looks: the probe samples
      // where the map is looking.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const legend = document.querySelector('webmapx-layer-overview');
      await legend.handleShowLayerStyle(id, id);
      // Probe (two GetMaps) plus the sibling WFS capabilities and schema: wait
      // for the branch to have answered, not for a guess at how long it takes.
      // The panel's own answer, not a shape on screen: "the probe has not run
      // yet" and "the probe said no" look identical in the markup, and waiting
      // on the markup passes instantly against a panel that has not started.
      await window.__wmxWaitFor(() => {
        const panel = window.__wmxDeepQuery('webmapx-layer-styler');
        return panel && panel.sldProbe !== null && !panel.sldProbing;
      }, 30000);
      // The columns arrive after the probe, from the sibling WFS.
      await window.__wmxWaitFor(() => {
        const panel = window.__wmxDeepQuery('webmapx-layer-styler');
        return !panel?.sldProbe?.supported || panel.sldAttributes !== null;
      }, 25000);
      await window.__wmxDeepQuery('webmapx-layer-styler')?.updateComplete;
      const panel = window.__wmxDeepQuery('webmapx-layer-styler');
      const root = panel?.shadowRoot;
      return {
        headings: [...(root?.querySelectorAll('.raster strong') ?? [])].map((h) => h.textContent.trim()),
        drivers: [...(root?.querySelectorAll('#sld-driver option') ?? [])]
          .map((o) => ({ label: o.textContent.trim(), disabled: o.disabled })),
        attributes: [...(root?.querySelectorAll('#sld-attribute option') ?? [])].map((o) => o.value).filter(Boolean),
      };
    }, [LAYER_ID, VIEW]);
    if (result.error) fail(result.error);
    if (!result.headings.includes('Or draw it yourself')) {
      console.log(`      (headings: ${result.headings.join(', ')})`);
      return 'skip';
    }
    if (result.drivers.length !== 2) fail(`expected one colour and by attribute, got ${JSON.stringify(result.drivers)}`);
    // The sibling WFS is what makes by-attribute possible; without it the
    // option stays disabled and only one colour is offered.
    if (result.drivers[1].disabled) fail('by-attribute was not offered: the sibling WFS did not answer');
    return 'ok';
  });

  if (open === 'skip') {
    console.log('    SKIP: the service did not answer the probe; nothing further to check');
    return;
  }

  await step('one colour reaches the urls the engine requests', async () => {
    const applied = await page.evaluate(async ([id]) => {
      const adapterBefore = await document.querySelector('webmapx-map').getAdapterAsync();
      const entryBefore = adapterBefore.store.getState().mapLayers[id];
      const before = JSON.stringify(adapterBefore.getSourceTiles(entryBefore?.sourceId) ?? '');
      const panel = window.__wmxDeepQuery('webmapx-layer-styler');
      const root = panel.shadowRoot;
      // The colour is webmapx's own picker (the palette every other swatch in
      // the styler uses), not an `<input type="color">`: clicking proves it
      // opens, and the value is then set the way the picker's own callback
      // sets it, since driving Pickr's internals from here would test Pickr.
      const colour = root.querySelector('#sld-color');
      if (!colour || colour.tagName !== 'BUTTON') throw new Error('the colour control is not the shared picker button');
      colour.click();
      panel.setDraft({ color: '#ff00ff' });
      await panel.updateComplete;
      [...root.querySelectorAll('sl-button')].find((b) => b.textContent.includes('Draw it')).click();
      const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
      const entry = adapter.store.getState().mapLayers[id];
      const after = await window.__wmxWaitFor(() => {
        const urls = JSON.stringify(adapter.getSourceTiles(entry?.sourceId) ?? '');
        return /SLD_BODY/i.test(urls) ? urls : null;
      }, 10000);
      return { before, after: after ?? JSON.stringify(adapter.getSourceTiles(entry?.sourceId) ?? '') };
    }, [LAYER_ID]);
    if (!/SLD_BODY/i.test(applied.after)) fail('no SLD_BODY in the live source urls');
    if (!/ff00ff/i.test(decodeURIComponent(applied.after))) fail('the chosen colour is not in the document sent');
    // A placeholder the engine put there must survive the rewrite, or the layer
    // stops asking for the right place entirely. OpenLayers assembles its WMS
    // request from params instead and has none, which is not a loss.
    const placeholder = /\{bbox-epsg-3857\}|\{z\}/;
    if (placeholder.test(applied.before) && !placeholder.test(applied.after)) {
      fail(`the tile placeholders were lost: ${applied.after.slice(0, 200)}`);
    }
    return 'ok';
  });

  await step('classifying by an attribute sends rules built from real values', async () => {
    const applied = await page.evaluate(async ([id]) => {
      // A fresh panel, and ids read fresh with it: chaining steps inside one
      // panel session couples them to each other's in-flight work, which is not
      // how the panel is used and hides what it is really doing.
      const map = document.querySelector('webmapx-map');
      const adapter = await map.getAdapterAsync();
      const legend = document.querySelector('webmapx-layer-overview');
      window.__wmxDeepQuery('webmapx-layer-styler')?.close();
      await legend.handleShowLayerStyle(id, id);
      const panel = window.__wmxDeepQuery('webmapx-layer-styler');
      const root = panel.shadowRoot;
      await window.__wmxWaitFor(() => panel.sldProbe !== null && !panel.sldProbing, 30000);
      if (!panel.sldProbe?.supported) return { skipped: 'the service did not offer its own styling' };

      const driver = root.querySelector('#sld-driver');
      driver.value = 'attribute';
      driver.dispatchEvent(new Event('change', { bubbles: true }));
      // One render is not always enough on a slow runner: wait for the select.
      await window.__wmxWaitFor(() => root.querySelector('#sld-attribute'), 10000);
      const attribute = root.querySelector('#sld-attribute');
      attribute.value = 'bouwjaar';
      attribute.dispatchEvent(new Event('change', { bubbles: true }));
      // The values are a WFS read; `Draw it` is disabled until they land, and a
      // click while disabled is silently lost.
      await window.__wmxWaitFor(() => !panel.sldLoadingValues
        && ((panel.sldDraft.values?.length ?? 0) > 0 || root.querySelector('.warning')), 30000);
      await panel.updateComplete;
      if ((panel.sldDraft.values?.length ?? 0) === 0) return { skipped: 'the WFS returned no values' };

      [...root.querySelectorAll('sl-button')].find((b) => b.textContent.includes('Draw it')).click();
      const sourceId = panel.context?.raster?.sourceId;
      const urls = () => decodeURIComponent(JSON.stringify(adapter.getSourceTiles(sourceId) ?? ''));
      await window.__wmxWaitFor(() => /PropertyIsLessThan/.test(urls()), 10000);
      return {
        sent: urls(),
        classes: [...root.querySelectorAll('.sld-class')].map((c) => c.textContent.trim()),
        problem: panel.sldProblem,
        values: panel.sldDraft.values?.length ?? 0,
        from: panel.sldAttributes?.from ?? null,
      };
    }, [LAYER_ID]);

    if (applied.skipped) {
      console.log(`      (${applied.skipped})`);
      return 'skip';
    }
    if (applied.problem) fail(`the panel reported: ${applied.problem}`);
    if (/<Name>all<\/Name>/.test(applied.sent)) fail('the previous single-colour style is still on the layer');
    if (!/PropertyIsLessThan/.test(applied.sent)) fail(`the document carries no class filters: ${applied.sent.slice(0, 400)}`);
    if (!/bouwjaar/.test(applied.sent)) fail('the document does not classify by the chosen column');
    if (applied.classes.length < 2) fail(`only ${applied.classes.length} classes were shown`);
    console.log(`      (${applied.values} values from the ${applied.from}, ${applied.classes.length} classes)`);
    return 'ok';
  });

  await step('a refusal never outlives the style it was about', async () => {
    // Reported from the app: raise the class count until the service refuses
    // the request (HTTP 431), then lower it again. The refusal answers late, so
    // it used to land on top of the good attempt and describe a style that was
    // no longer applied — the message was one attempt behind.
    const result = await page.evaluate(async ([id]) => {
      const legend = document.querySelector('webmapx-layer-overview');
      window.__wmxDeepQuery('webmapx-layer-styler')?.close();
      await legend.handleShowLayerStyle(id, id);
      const panel = window.__wmxDeepQuery('webmapx-layer-styler');
      const root = panel.shadowRoot;
      await window.__wmxWaitFor(() => panel.sldProbe !== null && !panel.sldProbing, 30000);
      if (!panel.sldProbe?.supported) return { skipped: 'the service did not offer its own styling' };
      const draw = () => [...root.querySelectorAll('sl-button')]
        .find((b) => b.textContent.includes('Draw it')).click();

      // Long values, so the document outgrows the url at a plausible count.
      const values = Array.from({ length: 60 }, (_, i) => `een tamelijk lange waarde nummer ${i}`);
      panel.setDraft({ driver: 'attribute', attribute: 'gebruiksdoel', values, classCount: 60 });
      await panel.updateComplete;
      draw();
      await window.__wmxWaitFor(() => panel.sldProblem, 30000);
      const refused = panel.sldProblem;
      if (!refused) return { skipped: 'the service accepted even 60 classes' };

      panel.setDraft({ classCount: 2 });
      await panel.updateComplete;
      draw();
      await window.__wmxWaitFor(() => !panel.sldVerifying, 30000);
      // Long enough for the earlier refusal to have landed, had it been kept.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { refused, after: panel.sldProblem, verifying: panel.sldVerifying };
    }, [LAYER_ID]);

    if (result.skipped) {
      console.log(`      (${result.skipped})`);
      return 'skip';
    }
    if (!/too long|fewer classes/i.test(result.refused)) fail(`unexpected refusal: ${result.refused}`);
    if (result.after) fail(`the refusal outlived the style it was about: ${result.after}`);
    if (result.verifying) fail('the panel is still reporting a check in flight');
    return 'ok';
  });

  await step('the legend follows the style, on the first click', async () => {
    // Reported from the app: the map changed and the legend did not, until the
    // same style was chosen a second time. The legend was reading the request
    // back from the engine, which reports a new `STYLES` about a second after
    // accepting it — so it always drew the style chosen before last.
    const seen = await page.evaluate(async ([id]) => {
      const legend = document.querySelector('webmapx-layer-overview');
      window.__wmxDeepQuery('webmapx-layer-styler')?.close();
      await legend.handleShowLayerStyle(id, id);
      const panel = () => window.__wmxDeepQuery('webmapx-layer-styler');
      await window.__wmxWaitFor(() => panel()?.wmsStyles !== null && !panel()?.wmsLoading
        && panel()?.sldProbe !== null && !panel()?.sldProbing, 40000);

      const shown = () => {
        const el = window.__wmxDeepQuery('webmapx-layer-legend');
        const img = el?.shadowRoot?.querySelector('img.legend-img');
        if (!img) return null;
        const url = new URL(img.src);
        return url.searchParams.get('SLD_BODY') ? 'SLD' : url.searchParams.get('STYLE');
      };
      const choices = () => [...panel().shadowRoot.querySelectorAll('.choice')];
      if (choices().length < 2) return { skipped: 'the service offers no choice of styles' };
      const names = panel().wmsStyles.map((style) => style.name);

      choices()[1].click();
      // Deliberately short: the point is that it does not take a second click.
      await new Promise((resolve) => setTimeout(resolve, 400));
      const afterNamed = shown();

      panel().setDraft({ driver: 'single', color: 'rgba(255,0,255,1)' });
      await panel().updateComplete;
      [...panel().shadowRoot.querySelectorAll('sl-button')].find((b) => b.textContent.includes('Draw it')).click();
      await new Promise((resolve) => setTimeout(resolve, 800));
      const afterOwn = shown();
      panel().close();
      return { expected: names[1], afterNamed, afterOwn };
    }, [LAYER_ID]);

    if (seen.skipped) {
      console.log(`      (${seen.skipped})`);
      return 'skip';
    }
    if (seen.afterNamed !== seen.expected) {
      fail(`the legend shows ${seen.afterNamed ?? 'nothing'} after choosing ${seen.expected}`);
    }
    if (seen.afterOwn !== 'SLD') fail(`the legend shows ${seen.afterOwn ?? 'nothing'} for a style of our own`);
    return 'ok';
  });

  await step('handing the layer back to the service removes the document', async () => {
    const cleared = await page.evaluate(async ([id]) => {
      const adapter = await document.querySelector('webmapx-map').getAdapterAsync();
      const legend = document.querySelector('webmapx-layer-overview');
      window.__wmxDeepQuery('webmapx-layer-styler')?.close();
      await legend.handleShowLayerStyle(id, id);
      const panel = window.__wmxDeepQuery('webmapx-layer-styler');
      const root = panel.shadowRoot;
      await window.__wmxWaitFor(() => panel.sldProbe !== null && !panel.sldProbing, 30000);
      if (!panel.sldProbe?.supported) return { skipped: 'the service did not offer its own styling' };

      panel.setDraft({ driver: 'single', color: '#ff00ff' });
      await panel.updateComplete;
      [...root.querySelectorAll('sl-button')].find((b) => b.textContent.includes('Draw it')).click();
      const sourceId = panel.context?.raster?.sourceId;
      const urls = () => JSON.stringify(adapter.getSourceTiles(sourceId) ?? '');
      // This step's *own* style, not merely "some SLD": an earlier step may
      // have left one behind, and waiting for that proves nothing about
      // whether this apply has landed yet.
      await window.__wmxWaitFor(() => /ff00ff|%23ff00ff/i.test(decodeURIComponent(urls())), 15000);
      const styled = urls();

      // Let the panel settle before taking hold of a button: applying starts a
      // check, the check re-renders the panel, and a button picked out before
      // that can be the one that got replaced — clicking it then does nothing
      // at all.
      await window.__wmxWaitFor(() => !panel.sldVerifying, 30000);
      await panel.updateComplete;
      [...root.querySelectorAll('sl-button')].find((b) => b.textContent.includes('service')).click();
      await window.__wmxWaitFor(() => !/SLD_BODY/i.test(urls()), 15000);
      const tiles = urls();
      const diag = { message: panel.message, applied: panel.sldApplied, problem: panel.sldProblem,
        setParams: typeof panel.context?.sourceControl?.setParams, sourceId };
      panel.close();
      return { styled, tiles, diag };
    }, [LAYER_ID]);

    if (cleared.skipped) {
      console.log(`      (${cleared.skipped})`);
      return 'skip';
    }
    if (!/ff00ff|%23ff00ff/i.test(decodeURIComponent(cleared.styled))) {
      fail('this step\'s own style never reached the layer, so removing it proves nothing');
    }
    if (/SLD_BODY/i.test(cleared.tiles)) {
      fail(`the document is still in the live urls; diag=${JSON.stringify(cleared.diag)} tail=${decodeURIComponent(cleared.tiles).slice(-160)}`);
    }
    if (!/service\.pdok\.nl/.test(cleared.tiles)) fail(`the source lost its endpoint: ${cleared.tiles.slice(0, 200)}`);
    return 'ok';
  });
}
