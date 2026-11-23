# WebMapX configs

Map configurations for [webmapx](https://github.com/edugis-org/webmapx), kept
apart from the code that renders them.

A config is content. It changes when a dataset is replaced, a school year
starts, a layer moves to a new endpoint — an editorial cadence that has nothing
to do with a webmapx release. Keeping the two in one repository forces one
cadence on both: either configs wait for a release, or a release drags every
config with it.

Separating them raises the real question, which this repository answers with
CI rather than with a convention: **how do configs and code stay in sync?**

## Layout

```
demo.json world.json nl.json deeptime.json …   one config per map, at the root
data/      datasets the configs read (plate model, world countries)
styles/    MapLibre style documents the configs reference
stories-demo/  html a story step points at
apikeys.example.json  template; copy to apikeys.json (gitignored) per deployment
```

Flat on purpose: webmapx serves this repository *as* its `public/config`, so
`demo.json` sits where the app expects `config/demo.json`, and every path inside
a config — `data/paleo/merdith2021`, `styles/openmaptiles/osmbright.json` — is
relative to the config file itself. Nothing has to be copied or rewritten to go
from editing to serving.

**A tool's data is a config asset.** The 4.4 MB plate model behind the deep-time
map belongs to the map being described, not to webmapx, so it lives here under
`data/` and is served with the configs. webmapx resolves such a path against the
config's own URL, so it is found from a subdirectory, a CDN, or a config edited
in `setup.html` and previewed out of `localStorage`.

## Working on a config

From a webmapx checkout, `npm run configs` puts this repository at
`public/config` — a symlink to your sibling clone if you have one, so editing a
config in `testpages/setup.html` edits the real thing and you commit it here.

A deployment does not follow this repository's main branch. It records the
commit it was built and tested against in webmapx's `configs.lock`
(`npm run configs:pin`), and `npm run configs:sync` checks out exactly that —
so a site that was tested and working cannot change because this repository
moved. Updating a deployment's configs is a deliberate commit to that file.

## Using a config

Point a webmapx page at one with the `config` URL parameter:

```
https://your-site.example/map/?config=../configs/world.json
```

An absolute URL works too, which is the quickest way to try a config against a
local build — the styles and assets travel with it, because every path inside
resolves against the config's own URL:

```
http://localhost:5173/?config=https://raw.githubusercontent.com/edugis-org/webmapx-configs/main/configs/world.json
```

**In production, vendor these files rather than fetching them from here.** Copy
the ones you serve into your deployment and pin the commit you took them from,
so upgrading configs is a deliberate, reviewable, revertable act by whoever
maintains the deployment — not something that changes under a live site because
this repository moved. A live dependency on GitHub is also a dependency on
GitHub being up.

## Validation

Every config is checked against webmapx's own validator — the same code the
browser runs when it loads a config, not a second implementation that drifts
from it:

```bash
npm install
npm run validate
```

CI runs this on every push and pull request, against **more than one version of
webmapx** (see `.github/workflows/validate.yml`). That matrix is the point. A
config naming a tool that only exists in `main` passes there and fails against
the released version, which tells you exactly what it is: not a typo, but a
config that has run ahead of the code. Without it, both failures look the same
— which is to say, they look like nothing at all, since webmapx skips what it
does not recognise and carries on.

Errors fail the build. Warnings do not, deliberately: a config naming a tool an
older build lacks still produces a working map, and during a rollout that is
frequently the intended state. Use `--strict` locally when you want a clean
sheet.

## Schema version

Configs declare `"version": 0`. That is not a placeholder — it says the config
schema is **not stable yet**. webmapx is pre-1.0, no compatibility is promised,
and a tool may still be renamed as long as the configs here are renamed with
it. The number exists at the floor because a version can be bumped and never
unbumped: starting low keeps every number above it free, `1` included, so that
`1` can mean the schema release 1 actually supports.

A config declaring a version newer than the build reading it produces a
warning, never a failure. The map still loads, one feature short.
