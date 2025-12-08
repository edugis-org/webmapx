# Webmapx Control Group

The `<webmapx-control-group>` component is a layout container designed to orchestrate the positioning and orientation of a toolbar and its associated tool panel. It simplifies the creation of responsive, flexible UI layouts for map tools.

## Features

- **Automatic Layout Management**: Automatically arranges the toolbar and panel based on the chosen orientation.
- **Orientation Propagation**: Passes the orientation setting down to the child `<webmapx-toolbar>`.
- **Flexible Positioning**: Allows placing the panel before or after the toolbar.
- **Alignment Control**: Supports aligning the group to the start, end, or center of the container.

## Usage

Wrap your `<webmapx-toolbar>` and `<webmapx-tool-panel>` inside this component.

```html
<webmapx-control-group 
    orientation="vertical" 
    panel-position="after" 
    alignment="start">
    
    <webmapx-toolbar>...</webmapx-toolbar>
    <webmapx-tool-panel>...</webmapx-tool-panel>

</webmapx-control-group>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `orientation` | `vertical` \| `horizontal` | `vertical` | Determines the main axis of the toolbar. If `vertical`, the group is laid out as a row (toolbar side-by-side with panel). If `horizontal`, the group is a column (toolbar above/below panel). |
| `panel-position` | `after` \| `before` | `after` | Determines if the panel appears after (right/bottom) or before (left/top) the toolbar. |
| `alignment` | `start` \| `end` \| `center` | `start` | Controls the cross-axis alignment of the items. For a vertical toolbar, this aligns them vertically (top/bottom). For a horizontal toolbar, this aligns them horizontally (left/right). |

## Examples

### Vertical Toolbar on the Left
Standard sidebar layout.
```html
<webmapx-control-group orientation="vertical" panel-position="after" alignment="start">
    <!-- Toolbar -->
    <!-- Panel -->
</webmapx-control-group>
```

### Horizontal Toolbar at the Bottom
Toolbar at the bottom, panel opens upwards.
```html
<webmapx-control-group orientation="horizontal" panel-position="before" alignment="center">
    <!-- Toolbar -->
    <!-- Panel -->
</webmapx-control-group>
```
