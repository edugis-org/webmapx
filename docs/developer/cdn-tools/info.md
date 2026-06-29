# Tool: info

Click any feature on the map to see its properties in a panel. Supports attribute metadata for translated labels, units, and value maps.

**Tool id:** `info`  
**Load:** lazy

## Example

```js
tools: ['info']
```

## Attribute metadata

Control how feature properties are displayed using `metadata.attributes` on a layer:

```json
{
  "id": "my-layer",
  "type": "fill",
  "source": "my-source",
  "title": "My Layer",
  "metadata": {
    "attributes": {
      "translations": [
        { "name": "pop_dens", "translation": "Population density", "unit": " inh/km²" },
        { "name": "municipality", "translation": "Municipality" }
      ]
    }
  }
}
```

See [attribute metadata](../../CLAUDE.md) for `valuemap` and shared attribute catalogs.

← [All tools](./overview.md)
