# Tool UX Modes — Architecture Proposal

## Problem

Current tool system conflates three independent concerns:

1. **Background behavior** — hook, default settings, passive processing (e.g. language hook applying browser language)
2. **Passive UI** — rendered directly on the map without a button (e.g. scalebar, inset map as control)
3. **Interactive UI** — shown in a panel when a toolbar button is pressed (e.g. language dropdown)

The current workaround for "behavior without UI" is `visible: false` or `hide-ui` attribute. This is not a proper concept — users cannot discover or change the tool's settings unless they know to click the external button.

## Examples

| Tool | Behavior | UI |
|---|---|---|
| Language | Applies browser language on layer add | Dropdown to change language |
| Inset map | Tracks main map viewport | Rendered inset map (control or panel) |
| Scalebar | Always shown | No interaction |
| Geolocation | Tracks position (active without panel open) | Panel with settings |
| Measure | Only active when panel open | Interactive drawing UI |

## Proposed Model

Every tool has two independent dimensions:

### 1. Behavior mode (`enabled`)
- `true` — background behavior always runs once tool is added to DOM
- `false` — tool exists but does nothing until explicitly activated

### 2. UI mode (`uiMode`)
- `"control"` — renders directly on map, no button (scalebar, attribution, zoom, inset map)
- `"panel"` — toolbar button → opens panel showing tool UI; background behavior runs regardless
- `"headless"` — no UI at all, just background behavior (current `visible:false` pattern)

### 3. Defaults (`default`)
- Key/value pairs applied immediately when tool is enabled, before any user interaction
- Example: `{ "language": "browser" }` on the language tool

## Config Example

```json
"tools": {
  "maplanguage": {
    "enabled": true,
    "uiMode": "panel",
    "default": { "language": "browser" },
    "position": "bottom-left"
  },
  "insetMap": {
    "enabled": true,
    "uiMode": "control",
    "position": "bottom-right"
  },
  "measure": {
    "enabled": true,
    "uiMode": "panel"
  }
}
```

## Implementation Scope

- `dynamic-layout.ts` — interpret `uiMode`, create button+panel or control slot
- Tool base classes — separate `onEnabled()` (background) from `onActivate()` (panel opened)
- Language tool — apply `default.language` in `onEnabled()` without requiring button click
- Config schema / validator — add `uiMode` and `default` fields
- Existing `visible: false` pattern — migrate to `uiMode: "headless"`

## Backwards Compatibility

- Existing `visible: false` maps to `uiMode: "headless"`
- Existing tools without `uiMode` default to current behavior (`"panel"`)
- Map controls (scalebar, zoom) keep their existing implementation, just add `uiMode: "control"` in config

## Open Questions

- Should `"panel"` tools show a badge/indicator when background behavior is active (like geolocation does)?
- Should `default` values be overridable per-layer (nl.json currently puts `"language"` in layer metadata)?
- Can `uiMode: "control"` tools also have an optional panel (e.g. inset map settings)?
