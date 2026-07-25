# Webmapx Stories Tool

The `<webmapx-stories-tool>` component provides a guided-tour UI: a sequence of chapters and steps that fly the camera, toggle layer visibility/opacity/projection/terrain, and show HTML content (inline or fetched from a URL) alongside the map. It is a modal tool driven entirely by the `stories` config section — no markup configuration beyond mounting the element.

## Usage

1.  **Activate the tool:** Click the corresponding toolbar button, activate via `ToolManager`, or deep-link with `?story=<name>` in the page URL (matches `StoryConfig.name`, case-insensitive; auto-activates the tool and opens that story).
2.  **Pick a story:** If more than one story is configured, the tool lists them; pick one to open it.
3.  **Navigate:** Use Next/Prev to step through the chapters. Chapter buttons (`buttonText`) jump straight to the first step of that chapter.
4.  **Close:** Closing the tool (or deactivating it) restores the camera, layer visibility/opacity, projection, and terrain state that was active before the story opened, and removes any layers the story added that weren't already on the map.

## Attributes

Inherited from the modal-tool base (`tool-id`, `active`, `render-target`) — see [`webmapx-tool-template`](./webmapx-tool-template.md) for the shared attribute set. The stories tool additionally widens its own panel per-story via `StoryConfig.width` (dispatches a `webmapx-panel-width` event consumed by `webmapx-tool-panel`), resetting to the panel's default width when the story closes.

## Configuration

Configure stories via the top-level `stories` section of the app config:

```json
{
  "stories": {
    "stories": [
      {
        "name": "Demo tour",
        "description": "A short guided tour demonstrating the stories tool.",
        "width": "480px",
        "chapters": [
          {
            "id": "intro",
            "title": "Introduction",
            "buttonText": "Intro",
            "steps": [
              {
                "title": "Welcome",
                "html": "<p>This is the <strong>webmapx</strong> stories tool. Use Next to continue.</p>",
                "state": {
                  "layers": ["osm"],
                  "view": { "center": [-74.0, 40.7], "zoom": 4 }
                }
              },
              {
                "title": "From a URL",
                "htmlUrl": "stories-demo/step2.html",
                "state": {
                  "layers": ["osm", "world-countries"],
                  "view": { "center": [10, 50], "zoom": 4 },
                  "projection": "globe"
                }
              }
            ]
          },
          {
            "id": "detail",
            "title": "Detail",
            "buttonText": "Detail",
            "steps": [
              {
                "title": "Zoomed in",
                "html": "<p>Country borders layer is now hidden.</p>",
                "state": {
                  "layers": ["osm", "world-countries"],
                  "hiddenLayers": ["world-countries"],
                  "view": { "center": [4.9041, 52.3676], "zoom": 10 }
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### `StoryConfig`

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Story title, also matched against the `?story=` deep-link param. |
| `description` | `string?` | Optional subtitle shown in the story picker. |
| `width` | `string?` | CSS width applied to the tool panel while this story is open (e.g. `"480px"`). |
| `chapters` | `StoryChapterConfig[]` | Ordered list of chapters. |

### `StoryChapterConfig`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique chapter id. |
| `title` | `string` | Chapter title. |
| `buttonText` | `string?` | Label for the chapter-jump button. |
| `steps` | `StoryStepConfig[]` | Ordered list of steps in this chapter. |

### `StoryStepConfig`

| Field | Type | Description |
|---|---|---|
| `title` | `string?` | Step title. |
| `html` | `string?` | Inline HTML content, sanitized before render. Mutually exclusive with `htmlUrl`. |
| `htmlUrl` | `string?` | URL fetched for step content, resolved relative to the config file's own URL. Relative `src`/`href` inside the fetched HTML are resolved against that same base URL. |
| `state` | `StoryStepConfigState` | Camera + layer + projection + terrain state to apply for this step (see below). |

### `StoryStepConfigState`

Human-readable step state — this is what you write in config. Internally it's converted to a short-key form (`src/config/story-step-state.ts`) before being applied to the map adapter, so config stays readable while the runtime representation stays compact.

| Field | Type | Description |
|---|---|---|
| `layers` | `string[]` | All layer ids relevant to this step. Any layer referenced here that isn't already loaded is added on demand (same catalog-lookup path as the search/buffer tools) and removed again when the story closes. |
| `hiddenLayers` | `string[]?` | Subset of `layers` to hide for this step. Omit or empty = all visible. |
| `view` | `{ center: [lng, lat], zoom: number, bearing?: number, pitch?: number }` | Camera position. `bearing`/`pitch` default to `0`. |
| `transparency` | `Record<string, number>?` | Per-layer transparency overrides (0–100%), keyed by layer id. |
| `projection` | `string?` | Projection name (e.g. `"globe"`, `"equalEarth"`). Omitted or `"mercator"` = default flat projection. |
| `terrain` | `boolean?` | Whether 3D terrain should be enabled for this step. |

A layer visible in an earlier step but not listed in a later step's `layers` is hidden again automatically when you land on that step — steps don't need to repeat "hide this" for every layer they don't use.

## Features

*   **Chapters and steps:** Multi-chapter tours with per-chapter jump buttons and linear Next/Prev navigation.
*   **Camera flythrough:** Each step flies the camera to its configured `view`.
*   **Layer choreography:** Steps show/hide/set-opacity on layers, lazily loading any layer not already on the map.
*   **Projection and terrain:** Steps can switch projection (e.g. flat ↔ globe) and toggle 3D terrain.
*   **Rich content:** Step content is inline `html` (sanitized) or fetched from `htmlUrl`, with relative links/images resolved against the source file.
*   **Transient overlay:** Applying a step never touches the store or the permalink — it's pure adapter calls (`setViewport`/`setBearing`/`setPitch`/`setLayerVisibility`/`setLayerOpacity`/`setProjection`/`setTerrainEnabled`). Closing a story restores the exact camera/layer/projection/terrain state from before it opened.
*   **Deep linking:** `?story=<name>` in the page URL opens a matching story automatically on load.

## Integration

```html
<webmapx-tool-panel label="Tools">
  <webmapx-stories-tool tool-id="stories"></webmapx-stories-tool>
</webmapx-tool-panel>

<webmapx-toolbar>
  <sl-button name="stories" circle>
    <sl-icon name="signpost-split"></sl-icon>
  </sl-button>
</webmapx-toolbar>
```

## JavaScript API

```javascript
const map = document.querySelector('#map');
map.toolManager.activate('stories');
map.toolManager.deactivate('stories'); // also closes any open story and restores prior map state
map.toolManager.toggle('stories');
```

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-panel-width` | `{ toolId, width }` | Bubbling event requesting the enclosing `webmapx-tool-panel` resize to `StoryConfig.width` (or reset to default `width: null` on close). Ignored unless `toolId` matches the currently active tool. |

You can also listen to global tool events on the map element:

```javascript
const map = document.querySelector('#map');

map.addEventListener('webmapx-tool-activated', (e) => {
  if (e.detail.toolId === 'stories') {
    console.log('Stories tool activated');
  }
});
```
