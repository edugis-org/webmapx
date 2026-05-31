# WebMapX

WebMapX is a web mapping UI toolkit for building interactive map apps quickly.
It supports multiple map engines out of the box: MapLibre, OpenLayers, Leaflet, and Cesium.

Live site: https://edugis-org.github.io/webmapx/

## Why WebMapX

- Build a working map UI fast with reusable components.
- Switch map engines without rewriting all tools.
- Use a config-driven setup for layers, backgrounds, and UI behavior.
- Extend with custom tools when needed.

## What You Get

- Map container and layout system
- Toolbar and tool panel
- Layer tree and layer overview/legend
- Coordinates, zoom level, scale control, geolocation, search, measure tools
- Inset map and navigation controls

## Prerequisites

Before you start, install:

- Node.js 20 LTS or newer
- npm 10 or newer (usually bundled with Node.js)
- Git
- A modern browser (Chrome, Edge, Firefox, or Safari)

Optional but recommended:

- VS Code for editing and debugging

Quick version check:

```bash
node -v
npm -v
git --version
```

## Quick Start

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd webmapx
```

### 2) Install dependencies

```bash
npm install
```

### 3) Run locally

```bash
npm run dev
```

Open the printed local URL in your browser.

### 4) Build for production

```bash
npm run build
```

### 5) Preview production build

```bash
npm run preview
```

## Screenshots

Add UI images here so new users can understand the project in seconds.

- Full application view
- Layer panel open
- Tool interaction (search/measure/settings)

Suggested paths:

- `docs/images/webmapx-overview.png`
- `docs/images/webmapx-layer-panel.png`
- `docs/images/webmapx-tool-example.png`

When images are available, include them like this:

```md
![WebMapX overview](docs/images/webmapx-overview.png)
![Layer panel](docs/images/webmapx-layer-panel.png)
![Tool example](docs/images/webmapx-tool-example.png)
```

## Configuration

The default demo configuration lives in `config/demo.json`.

- `state.activeBackground` controls the active background layer.
- `state.activeLayers` controls active overlay layers.

## Cesium Runtime Assets

Cesium requires static runtime files (`Workers`, `Assets`, `Widgets`, `ThirdParty`, and `Cesium.js`) at runtime.

In this project, those files are copied automatically from `node_modules/cesium/Build/Cesium` into the build output (`dist/cesium`) during `npm run build`.

This keeps local and CI/GitHub Pages deployments reproducible without committing Cesium vendor files. For that reason, `public/cesium` is intentionally gitignored.

## Documentation

### For users

- User guide: [docs/user/README.md](./docs/user/README.md)

### For developers

- Developer guide: [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)
- Developer architecture:
	- Rules: [Architecture Rules](./docs/DEVELOPER_GUIDE.md#i-architecture-rules)
	- Flow: [Data Flow](./docs/DEVELOPER_GUIDE.md#ii-data-flow)
	- Diagram: [Architecture Overview](./docs/DEVELOPER_GUIDE.md#v-architecture-overview)
	- Engine contracts: [docs/developer/engine-interface.md](./docs/developer/engine-interface.md)
- Engineering rules: [docs/developer/engineering-rules.md](./docs/developer/engineering-rules.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## Commands

- `npm run dev`: start development server
- `npm run start`: alias for dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run test`: run test suite

## Project Status

WebMapX is under active development. The core multi-engine adapter model and tool system are in place, and the project continues to evolve toward a stable, configurable mapping platform.
