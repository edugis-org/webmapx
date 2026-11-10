# Webmapx Street Photos Tool

The `<webmapx-street-photos-tool>` component shows a street-level photo of a spot on the map. While the tool is open, the map shows where photos exist. Click a photographed road or path, and the panel shows the nearest photo that looks at that spot. The photo can be enlarged in the page, where a 360° photo can be turned to look around, or opened in the service's own viewer to walk along the street.

The photos come from [Panoramax](https://panoramax.fr) by default. When the config has a Google key, the panel also offers **Google Street View** (see [Google Street View](#google-street-view) below).

Panoramax is an open, federated alternative to Google Street View:

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
    { "type": "street-photos" }
  ]
}
```

The button shows a camera icon with the label "Street photos". Like other toolbar tools, the component is loaded only when a config uses it. `panoramax` is accepted as the older name of the tool type and its `tools` section.

## Configuration

All settings are optional and go in the config's `tools` section:

```json
"tools": {
  "street-photos": {
    "googleApiKey": "{key-google}",
    "searchDistance": 50,
    "apiUrl": "https://api.panoramax.xyz/api",
    "viewerUrl": "https://api.panoramax.xyz/"
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `googleApiKey` | none | A Google Maps API key, usually written `{key-google}` so it is read from `apikeys.json` and never committed with the config. With one, the panel offers Google Street View; without, the tool uses Panoramax only. |
| `searchDistance` | `50` | The least distance from the clicked spot a photo may be, in metres. Zoomed out, the tool searches further, up to 500 m. |
| `apiUrl` | `https://api.panoramax.xyz/api` | The Panoramax search API. The default searches every Panoramax instance at once. Point it at one instance, such as the Dutch one at `https://nl.panoramax.xyz/api`, to use only its photos. |
| `viewerUrl` | `https://api.panoramax.xyz/` | The viewer that "Open in Panoramax" goes to. |

## Behaviour

- **Coverage map.** Opening the tool adds a "Panoramax photos" layer, drawn from Panoramax's own vector tiles: lines along the photographed routes, and one dot per photo at street level. Panoramax's tiles carry routes from zoom level 6 (about a province, or the whole of Iceland); further out they hold only a density grid, which is left out because it draws an area with one photo as large as one with thousands, so the map then shows nothing and the tip says to zoom in. A click that far out does not search. It is listed in the legend while shown, and removed when the tool closes. It is not stored in permalinks. MapLibre and OpenLayers draw it; Leaflet and Cesium cannot draw vector tiles, so there the panel says the map cannot show where photos are, and the tool still works by clicking.
- **Colour by.** The panel's **Coverage | Date | Camera** choice recolours the routes and photo dots: one colour; by when they were taken (this year, last year, 2–4 years ago, older), to see how up to date a photo is; or by camera, 360° or flat. The legend explains the colours.
- **The pointer turns into a hand** over anything that can be clicked on the coverage map.
- **A click on a photo dot shows that photo.** At street level, a dot is one photo, and clicking it means "this one".
- **A click anywhere else asks for photos of that spot.** The search uses Panoramax's `place_position`, which finds pictures *looking at* the spot, not just pictures taken nearby that may face away from it. The nearest match is shown. How far it may look follows the zoom level: about 12 pixels on screen, at least `searchDistance` (50 m) and at most 500 m, so a click on a line at city level still finds the photos along it.
- **The clicked spot is marked** on the map. The marker goes when the panel closes.
- **Enlarging:** the panel's **Open larger picture** button, or **Open 360 view** for a 360° photo, opens a larger version in a dialog; so does clicking the photo itself. **Open in Panoramax** is in that dialog only, so the panel keeps one next step and leaving the app is a deliberate second one. Escape closes the dialog first, and the panel only on the next press. Focus returns to the photo.
- **360° photos** are marked "360°" in the panel. Panoramax stores them flattened, which looks distorted as a plain image, so the dialog shows them in a panorama viewer ([Pannellum](https://pannellum.org), MIT) instead: an undistorted view you can turn by dragging or with the arrow keys. It opens facing the clicked spot. The viewer is loaded only the first time a 360° photo is enlarged (about 20 KB gzipped).
- **Plain messages** for no photo nearby and for Panoramax not answering.
- **A fast second click wins:** an answer for an earlier click that arrives late is ignored.

## Google Street View

With `googleApiKey` set, the panel shows **Photos from: Panoramax | Google Street View**. Panoramax stays the default; Google is used only when someone chooses it, because every Google request sends the clicked position to Google.

- **The key** needs the **Street View Static API** enabled in Google Cloud, and a billing account. Restrict it to that API and to the sites that use it: it is visible in every visitor's browser.
- **A click first asks Google whether there is imagery** within the search distance (the metadata request, free), outdoors only. Only when there is does the panel load images (billed per image), so a click on a field costs nothing.
- **The photo faces the clicked spot**, since Google's panorama is usually taken from the road beside it.
- **Open larger picture** shows a larger image in the dialog, with **Open in Google Street View**, which opens Google Maps at the same panorama, facing the same way, to look around and walk on.
- **The credit** names Google (or the contributor Google gives) and the month the photo was taken. Google gives no day.
- **No coverage map, no look-around in the page.** Google allows its Street View coverage layer only through its Maps JavaScript library, and the Static API returns flat views, not panoramas. So with Google chosen the coverage layer and "Colour by" are hidden, and looking around happens in Google Maps.
- **When something is wrong it says so:** no imagery near the spot; Google refusing the request, with Google's reason (for example a key that is invalid or not allowed this API); or a photo found but its image refused, which usually means the Static API or billing is not enabled for the key.
