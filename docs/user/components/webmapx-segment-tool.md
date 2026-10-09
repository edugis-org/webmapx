# WebmapX Segment Tool

The `<webmapx-segment-tool>` (tool type `segment`) outlines objects on the map with [Segment Anything](https://segment-anything.com/), entirely in the browser. Click an object (right-click what does not belong) or drag a box around it, and its outline appears; *Keep* adds it to a "Segments" layer. *Everything* segments the whole view at once, and can name each segment from a word list with CLIP.

What is segmented is what the map engine renders, so any raster the map can draw works — an aerial photo is the usual case. Choosing one layer (the photo without labels on top) gives cleaner outlines. The view is rendered to an image only by MapLibre so far; on the other engines the tool says it is unavailable.

## Naming segments

SAM finds outlines; it does not know what anything is. *Name the segments* asks CLIP which of *your* names fits each segment best. CLIP cannot invent a word — it only scores the texts it is given, and always picks one of them — so the choice of words matters:

- Every kept segment carries `name`, `name_probability` and `name_scores` (all your names with their probability, most likely first), so you can see where CLIP hesitated.
- It also carries `suggestion_1`–`suggestion_3`: the best words from a built-in vocabulary of ~60 remote-sensing terms (the class names of the caption datasets RemoteCLIP was trained on, plus Dutch landscape features such as greenhouses, ditches and dikes; `src/utils/sam/clip-vocabulary.ts`). The panel lists the words that came out on top most often; clicking one adds it to your names.
- Renaming is fast: each segment is looked at by CLIP once, after which only the new words have to be read.

## Configuration

`tools.segment`, all optional:

| Key | Default | Meaning |
| --- | --- | --- |
| `modelBaseUrl` | none | A mirror holding every model, `{repo}` replaced by the model's repository path, relative to the config. See [Where the models come from](#where-the-models-come-from). |
| `models` | all | Model ids to offer: `slimsam-77`, `sam2.1-tiny`, `sam2.1-small`, `sam2.1-base-plus`, `sam2.1-large`. |
| `defaultModel` | `sam2.1-tiny` with WebGPU, else `slimsam-77` | Model selected first. |
| `labels` | rooftops, a street, trees, … | Names a segment may get, in English (CLIP reads English). Their order sets their colours. |
| `clipModel` | `remoteclip` | Model that names segments: `remoteclip` (trained on aerial imagery) or `clip` (general). |

Nothing is downloaded until the user picks a model; the panel shows each model's size first. A downloaded model is kept in the browser's Cache API, so it is fetched once per browser.

## Where the models come from

**By default, from HuggingFace**, directly into the user's browser (`https://huggingface.co/{repo}/resolve/main/`, which allows cross-origin requests). Trying the tool, developing it and running a demo therefore need no set-up and no copy of the models on the webmapx server.

The one exception is **RemoteCLIP**, the default model for naming segments. It is not published in a form a browser can load: its ONNX export (`webmapx/remoteclip-vit-b-32`) is our own, so it is always served from a mirror — by default `models/{repo}/` beside the config, i.e. `<config dir>/models/webmapx/remoteclip-vit-b-32/`. Without it there, naming with RemoteCLIP fails; `clipModel: "clip"` uses the general CLIP model from HuggingFace instead. The export was made from the open_clip checkpoint ([chendelong/RemoteCLIP](https://huggingface.co/chendelong/RemoteCLIP), Apache-2.0) with the `Xenova/clip-vit-base-patch32` interface and int8 quantization; the export script is not in this repository yet, so keep a copy of the exported files.

### Deploying for the longer term: consider a mirror

Fetching from HuggingFace means the deployment depends on it. Before a deployment that has to keep working unattended — a course, a school year — consider mirroring the models and setting `modelBaseUrl`:

- **Stability.** `resolve/main` always serves the newest upload; a repository that changes or disappears changes or breaks the tool. A mirror serves exactly what was tested.
- **Privacy.** With HuggingFace, every user's browser contacts a third party. A mirror keeps all requests on your own host.
- **Networks.** School and company networks sometimes block or throttle HuggingFace.
- **Rate limits.** HuggingFace may limit anonymous downloads; your own server or CDN is under your control.
- **Speed.** Measured once (2026-10-09, one connection in the Netherlands): in the browser, SAM 2.1 Large downloaded from HuggingFace at ~15 Mbit/s after a slow start — about eight minutes for its 912 MB (four for the 457 MB half-precision variant a WebGPU browser with `shader-f16` picks). `curl` on the same line got ~130 Mbit/s from HuggingFace, so the browser figure is not HuggingFace's limit; the cause is not yet known. On a shared classroom line expect slower still. Small models (SlimSAM, 14 MB) are not worth mirroring for speed; the large ones may be.

A mirror is filled with:

```bash
npm run models:sam -- --out <dir>                                # SlimSAM and SAM 2.1 Tiny
npm run models:sam -- --out <dir> --models slimsam-77,sam2.1-large
npm run models:sam -- --out <dir> --all                          # every model and variant
```

and then pointed at in the config, ending in `{repo}/`:

```json
"tools": { "segment": { "modelBaseUrl": "models/{repo}/" } }
```

A configured `modelBaseUrl` serves **every** model, so copy the RemoteCLIP export into the same directory (`<dir>/webmapx/remoteclip-vit-b-32/`: `tokenizer.json`, `tokenizer_config.json`, `onnx/vision_model_quantized.onnx`, `onnx/text_model_quantized.onnx`). Re-running the script resumes an interrupted download.

The files are large — SAM 2.1 Large's encoder alone is 889 MB — which rules out a git repository or GitHub Pages (100 MB per file). Serve the directory from a plain web server or object storage. A server that answers a missing file with a web page (an SPA fallback with status 200) is detected: the tool reports the file as missing instead of handing the page to the model runtime.
