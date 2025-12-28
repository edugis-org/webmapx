# Webmapx Settings

The `<webmapx-settings>` component provides a small settings panel for map UI preferences, adapter selection, and API key storage.

## Usage

Place the component inside a tool panel and assign it a `tool-id` that matches your toolbar button.

```html
<webmapx-tool-panel label="Tools">
  <webmapx-settings tool-id="settings"></webmapx-settings>
</webmapx-tool-panel>

<webmapx-toolbar>
  <sl-button name="settings" circle>
    <sl-icon name="gear"></sl-icon>
  </sl-button>
</webmapx-toolbar>
```

## Behavior

- **Theme toggle:** Persists `webmapx-theme` in `localStorage` and toggles the `sl-theme-dark` class on `<html>`.
- **Adapter selection:** Saves `webmapx-adapter` and reloads the page after capturing the current viewport.
- **API key:** Stores `webmapx-api-key` in `localStorage` for use by services that read it.

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `theme-change` | `{ theme: 'dark' \| 'light' }` | Fired when the theme toggle is changed. |
| `apikey-change` | `{ apiKey: string }` | Fired when the API key input changes. |

## Notes

Adapter switching triggers a full page reload to recreate the map with the selected adapter.
