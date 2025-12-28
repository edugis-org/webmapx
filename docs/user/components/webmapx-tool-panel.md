# Webmapx Tool Panel

The `<webmapx-tool-panel>` is a collapsible container for displaying the detailed interface of a selected tool. It is designed to work in tandem with `<webmapx-toolbar>`.

## Features

- **Collapsible**: Can be shown or hidden via the `active` property.
- **Header**: Includes a title and a close button.
- **Scrollable Content**: Automatically handles vertical scrolling for long content.
- **Responsive**: Adapts its height to the available layout space (max 80%).

## Usage

Place the specific tool interfaces (like layer trees or forms) inside the panel and assign each tool a `tool-id` that matches the toolbar button `name`.

```html
<webmapx-tool-panel id="tool-panel" label="Tools">
    <webmapx-layer-tree tool-id="layers"></webmapx-layer-tree>
    <webmapx-settings tool-id="settings"></webmapx-settings>
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

The panel automatically syncs with toolbar selections and modal tool activation when tool IDs are provided:

1.  Toolbar buttons emit `webmapx-tool-select`, and modal tools emit `webmapx-tool-activated`.
2.  The panel opens, updates its label, and shows only the tool matching the active ID.
3.  Closing the panel emits `webmapx-panel-close`, which the toolbar listens to for reset.
