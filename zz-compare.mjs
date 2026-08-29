import { chromium } from 'playwright';
const S = '/tmp/claude-1000/-home-anneb-projects-webmapx/a07f55a6-3a5f-43f8-a0d2-34e665368ea9/scratchpad';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 760, height: 620 } });
await p.goto('http://127.0.0.1:5173/scripts/ui-tests/pages/paleotime.html?config=%2Fconfig%2Fdeeptime.json', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(16000);
await p.evaluate(async () => {
  const t = document.querySelector('webmapx-paleotime-tool');
  const s = t.shadowRoot.querySelector('input[type=range]');
  s.value = '-200'; s.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 3000));
});
await p.screenshot({ path: `${S}/cmp-merdith.png` });
await p.evaluate(async () => {
  const sel = document.querySelector('webmapx-paleotime-tool').shadowRoot.querySelector('.models select');
  sel.value = 'muller2019'; sel.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 9000));
});
await p.screenshot({ path: `${S}/cmp-muller.png` });
console.log('captured');
await b.close();
