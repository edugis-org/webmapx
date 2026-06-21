# GitHub / Contributor Quickstart

For cloning the repo, running locally, and contributing to WebMapX.

## Prerequisites

- Node.js 20 LTS or newer
- npm 10 or newer (bundled with Node.js)
- Git
- Modern browser (Chrome, Edge, Firefox, Safari)

```bash
node -v
npm -v
git --version
```

## Setup

```bash
git clone https://github.com/edugis-org/webmapx.git
cd webmapx
npm install
```

## Run locally

```bash
npm run dev
```

Open the printed local URL in your browser.

## Build

```bash
npm run build          # app build → dist/
npm run build:lib      # library build → dist-lib/
```

## Preview production build

```bash
npm run preview
```

## Test

```bash
npm run test           # type-check + unit tests
npm run ui-test        # Playwright UI tests (all engines)
```

## Configuration

The default demo config lives in `config/demo.json`.

- `datacatalog` — layer sources and layer specs
- `tools` — which tools appear and where
- `map` — initial viewport (center, zoom, bearing, pitch)

See [docs/DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) for architecture details.

## Cesium runtime assets

Cesium requires static runtime files at runtime. They are copied automatically from
`node_modules/cesium/Build/Cesium` into `dist/cesium` during `npm run build`.
`public/cesium` is intentionally gitignored — do not commit it.

## Publishing to npm

```bash
npm version patch   # or minor / major
npm publish --access public
```

`prepublishOnly` runs `build:lib` automatically before publish.
