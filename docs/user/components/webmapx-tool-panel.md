# Webmapx Tool Panel

The `<webmapx-tool-panel>` is a collapsible container for displaying the detailed interface of a selected tool. It is designed to work in tandem with `<webmapx-toolbar>`.

## Features

- **Collapsible**: Can be shown or hidden via the `active` property.
- **Header**: Includes a title and a close button.
- **Scrollable Content**: Automatically handles vertical scrolling for long content.
- **Responsive**: Adapts its height to the available layout space (max 80%).

## Usage

Place the specific tool interfaces (like layer trees or forms) inside the panel.

```html
<webmapx-tool-panel id="tool-panel" label="Tools">
    <div id="layers-ui">...</div>
    <div id="settings-ui" style="display: none;">...</div>
</webmapx-tool-panel>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | `'Tools'` | The title displayed in the panel header. |
| `active` | `boolean` | `false` | Controls the visibility of the panel. Reflects as an attribute. |

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-panel-close` | `null` | Fired when the user clicks the close (X) button in the header. |

## Interaction Pattern

The panel does not automatically know which content to show. The application logic (usually in `app.js` or `index.html`) is responsible for:

1.  Listening to `webmapx-tool-select` from the toolbar.
2.  Setting `panel.active = true`.
3.  Updating `panel.label`.
4.  Toggling the visibility of the child elements (e.g., showing `#layers-ui` and hiding `#settings-ui`).
