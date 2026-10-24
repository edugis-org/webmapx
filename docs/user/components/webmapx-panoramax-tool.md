# Webmapx Street Photos Tool

The `<webmapx-panoramax-tool>` component shows a street-level photo of a spot on the map. Click a road or path, and the panel shows the nearest photo that looks at that spot. The photo can be enlarged in the page or opened in the Panoramax viewer, where you can look around and walk along the street.

The photos come from [Panoramax](https://panoramax.fr), an open, federated alternative to Google Street View:

- **No API key or account is needed.**
- **Clicks go to an open, non-commercial project,** not to an advertising company. Only the clicked position is sent. This matters for schools.
- **Photos are openly licensed,** usually CC BY-SA 4.0. The panel shows the photographer and the licence with every photo, as the licence requires.

Coverage depends on what volunteers and organisations have uploaded. It is strongest in France and growing elsewhere, for example in Amsterdam. Where nobody has taken photos, the panel says so.

## Usage

Add it to a toolbar in the config:

```json
{
  "type": "toolbar",
  "items": [
    { "type": "panoramax" }
  ]
}
```

The button shows a camera icon with the label "Street photos". Like other toolbar tools, the component is loaded only when a config uses it.

## Configuration

All settings are optional and go in the config's `tools` section:

```json
"tools": {
  "panoramax": {
    "searchDistance": 50,
    "apiUrl": "https://api.panoramax.xyz/api",
    "viewerUrl": "https://api.panoramax.xyz/"
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `searchDistance` | `50` | How far from the clicked spot a photo may be, in metres. |
| `apiUrl` | `https://api.panoramax.xyz/api` | The Panoramax search API. The default searches every Panoramax instance at once. Point it at one instance, such as the Dutch one at `https://nl.panoramax.xyz/api`, to use only its photos. |
| `viewerUrl` | `https://api.panoramax.xyz/` | The viewer that "Open in Panoramax" goes to. |

## Behaviour

- **A click asks for photos of that spot.** The search uses Panoramax's `place_position`, which finds pictures *looking at* the spot, not just pictures taken nearby that may face away from it. The nearest match is shown.
- **The clicked spot is marked** on the map. The marker goes when the panel closes.
- **Enlarging:** the photo is a button. Clicking it, or pressing Enter, opens a larger version in a dialog. Escape closes the dialog first, and the panel only on the next press. Focus returns to the photo. A 360° photo is shown as its flat panorama there; "Open in Panoramax" is the way to look around in it.
- **Plain messages** for no photo nearby and for Panoramax not answering.
- **A fast second click wins:** an answer for an earlier click that arrives late is ignored.
