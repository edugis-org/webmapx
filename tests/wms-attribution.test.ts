/**
 * A WMS says who its data belongs to; the discovered layer keeps it.
 *
 * WMS 1.3.0's `<Attribution>` element is exactly the credit a map should show,
 * and "Add layer from URL" used to credit the *service title* instead — which
 * names the endpoint ("PDOK BRT Achtergrondkaart WMS"), not the body whose data
 * it is. Capabilities are someone else's XML, so this also pins the escaping:
 * the value goes into an attribution string that is parsed as markup.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { wmsLayerAttribution } from '../src/utils/layer-discovery';

test('a declared title and url become one link', () => {
    assert.equal(
        wmsLayerAttribution({ title: 'Kadaster', url: 'https://www.kadaster.nl/' }, 'Some WMS'),
        '<a href="https://www.kadaster.nl/" target="_blank" rel="noopener">Kadaster</a>',
    );
});

test('a title alone is the credit; a url alone is credited by host', () => {
    assert.equal(wmsLayerAttribution({ title: 'Kadaster' }, 'Some WMS'), 'Kadaster');
    assert.equal(
        wmsLayerAttribution({ url: 'https://www.pdok.nl/services' }, 'Some WMS'),
        '<a href="https://www.pdok.nl/services" target="_blank" rel="noopener">pdok.nl</a>',
    );
});

test('a service that declares nothing keeps its name as the credit', () => {
    assert.equal(wmsLayerAttribution(undefined, 'Some WMS'), 'Some WMS');
    assert.equal(wmsLayerAttribution({}, 'Some WMS'), 'Some WMS');
    assert.equal(wmsLayerAttribution(undefined, undefined), undefined);
});

test('capabilities text cannot inject markup', () => {
    const credit = wmsLayerAttribution(
        { title: 'Ministry of <script>alert(1)</script> & Co', url: 'https://x.example/"onmouseover="alert(1)' },
        undefined,
    );
    assert.ok(credit);
    assert.ok(!credit.includes('<script'), `script tag survived: ${credit}`);
    assert.ok(!/"\s*onmouseover/.test(credit), `attribute escaped out of its quotes: ${credit}`);
    assert.ok(credit.includes('&lt;script&gt;'), 'the text is kept, escaped');
});
