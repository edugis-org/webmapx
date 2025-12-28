# Webmapx Layer Tree

The `<webmapx-layer-tree>` component renders a tree of map layers and lets users toggle layers on or off.

## Usage

Place the component inside a tool panel and assign it a `tool-id` that matches your toolbar button.

```html
<webmapx-tool-panel label="Tools">
  <webmapx-layer-tree tool-id="layers"></webmapx-layer-tree>
</webmapx-tool-panel>

<webmapx-toolbar>
  <sl-button name="layers" circle>
    <sl-icon name="layers"></sl-icon>
  </sl-button>
</webmapx-toolbar>
```

## Data Sources

The tree can be provided in two ways:

1. **`tree` property:** Provide an explicit array of nodes (takes precedence).
2. **Map config:** If no `tree` is set, it reads `catalog.tree` from the map config.

### Node Shape

```ts
{
  label: string;
  layerId?: string;
  checked?: boolean;
  expanded?: boolean;
  children?: LayerNode[];
}
```

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `add-layer` | `{ layerInformation, checked }` | Fired when a layer checkbox is toggled. Bubbles and is handled by `<webmapx-map>`. |

## Notes

Leaf nodes should include `layerId` so the component can resolve the layer from the map catalog.
