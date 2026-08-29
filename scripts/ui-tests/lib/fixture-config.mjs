/**
 * The config the UI tests run against.
 *
 * Tests own their fixtures. They used to drive the app's own `config/demo.json`,
 * which made every UI suite depend on content that exists to be edited — a new
 * layer or a renamed tool in the demo config could turn the test suite red, and
 * the configs are moving to a repository of their own where they will change
 * without webmapx knowing.
 *
 * This copy lives beside the tests, changes only when a test needs it to, and
 * carries its own assets (the plate model under data/, the story html), so
 * nothing outside tests/ has to stay still for the suite to pass.
 *
 * Vite serves the repository root in dev, which is how a path under tests/ is
 * fetchable; the UI tests only ever run against the dev server.
 */
export const FIXTURE_CONFIG = '/tests/fixtures/demo.json';

/**
 * URL of the app under test, pointed at the fixture config.
 *
 * `?config=` overrides the `src` attribute in index.html, so the page loads the
 * fixture instead of whatever the demo config happens to contain today.
 */
export function appUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('config', FIXTURE_CONFIG);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}
