# Tool: search

Geocoder — type a place name or address and the map flies to the result. Uses a configurable geocoding service.

**Tool id:** `search`  
**Load:** lazy

## Example

```js
tools: ['search']
```

## Config options

```json
{
  "tools": {
    "searchTool": {
      "type": "search",
      "serviceUrl": "https://nominatim.openstreetmap.org/search"
    }
  }
}
```

Default service is Nominatim (OpenStreetMap). Replace `serviceUrl` with any compatible geocoding API.

← [All tools](./overview.md)
