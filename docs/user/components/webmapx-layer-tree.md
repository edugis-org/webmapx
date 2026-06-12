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
2. **Map config:** If no `tree` is set, it reads a `tree` from a configured `layerTree` tool item (`tools.*.items[]` where `type: "layerTree"`).

Legacy fallback: if no tool-owned tree is found, it will still read `catalog.tree`.

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

## Layer Search

A search box can filter the tree by layer. When typing, only leaf layers (and their ancestor groups) matching the query remain, with matching groups auto-expanded.

A leaf layer matches if the query (case-insensitive substring) is found in:

- the layer's label/title
- any ancestor group label (the layer's path in the tree)
- `metadata.abstract`
- the layer's `attribution` or its source's `attribution`
- `metadata.attributes.translations[].name` / `.translation` (attribute key names and their display labels)
- `metadata.attributes.translations[].valuemap[].value` / `.label` (value-map entries)

### Configuration

Set these on the `layerTree` tool item (`tools.*.items[]` where `type: "layerTree"`, or `tools.layerTree`):

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showSearch` | `boolean` | auto | Force show/hide the search box. If unset, shown only when the tree has more leaf layers than `searchThreshold`. |
| `searchThreshold` | `number` | `8` | Leaf-layer count above which the search box is shown automatically (ignored if `showSearch` is set). |

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `add-layer` | `{ layerInformation, checked }` | Fired when a layer checkbox is toggled. Bubbles and is handled by `<webmapx-map>`. |

## Runtime Sync

- After initialization, checkbox state follows active layers from the map state (`visibleLayers`).
- The map emits `layer-add` and `layer-remove` on `MapEventBus`; the layer tree mirrors those changes.

## Notes

Leaf nodes should include `layerId` so the component can resolve the layer from `layerData.layers` and linked `layerData.sources`.
