/**
 * The `internalfunc://paleo-coastlines` source: the world's coastlines at an
 * age, in millions of years.
 *
 *   internalfunc://paleo-coastlines?data=data/paleo/merdith2021&ma=200
 *   internalfunc://paleo-coastlines?data=data/paleo/merdith2021&ma={ma}
 *
 * Written as a computed source rather than owned by a tool so that the data is
 * addressable by anything: a story step can pin the Cretaceous, a second layer
 * can draw the same age differently, and the deeptime tool becomes nothing more
 * than a slider that moves `{ma}`. A tool that owned its own layer could do
 * none of that.
 *
 * Two files stand behind it, both built by `scripts/build-paleorotations.ts`:
 * present-day coastlines tagged with the plate they ride on, and a rotation per
 * plate per sampled age. See `plate-rotation.ts` for why that is the form the
 * data wants to be in.
 */
import { buildPlateModel, reconstruct, type PlateModel, type PlateRotationFile } from './plate-rotation';
import { announceComputedDataReady } from './computed-source-ready';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Where the rotation file sits, given a data directory. */
function rotationsUrl(base: string, model: string): string {
    return `${base.replace(/\/$/, '')}/rotations-${model}.json`;
}

function coastlinesUrl(base: string): string {
    return `${base.replace(/\/$/, '')}/coastlines-present.geojson`;
}

/**
 * The model name a directory holds, taken from the directory itself.
 *
 * `data/paleo/merdith2021` holds `rotations-merdith2021.json`, so the name need
 * not be written twice in every config that uses it. `?model=` overrides for a
 * directory named something else.
 */
function modelFromBase(base: string): string {
    const parts = base.replace(/\/$/, '').split('/');
    return parts[parts.length - 1] ?? '';
}

const loaded = new Map<string, PlateModel>();
const loading = new Map<string, Promise<PlateModel | null>>();

/** The model for a data directory, fetched at most once per directory. */
export async function loadPlateModelFrom(base: string, model?: string): Promise<PlateModel | null> {
    const name = model || modelFromBase(base);
    const key = `${base}|${name}`;
    const already = loaded.get(key);
    if (already) return already;

    const inFlight = loading.get(key);
    if (inFlight) return inFlight;

    const attempt = (async (): Promise<PlateModel | null> => {
        try {
            const [coastlines, rotations] = await Promise.all([
                fetch(coastlinesUrl(base)).then(r => {
                    if (!r.ok) throw new Error(`${r.status} ${coastlinesUrl(base)}`);
                    return r.json() as Promise<GeoJSON.FeatureCollection>;
                }),
                fetch(rotationsUrl(base, name)).then(r => {
                    if (!r.ok) throw new Error(`${r.status} ${rotationsUrl(base, name)}`);
                    return r.json() as Promise<PlateRotationFile>;
                }),
            ]);
            const built = buildPlateModel(coastlines, rotations);
            loaded.set(key, built);
            // The first resolve of this url necessarily drew an empty world, so
            // the map is told there is something to draw now.
            announceComputedDataReady();
            return built;
        } catch (err) {
            console.warn(`[paleo-coastlines] could not load the plate model from ${base}:`, err);
            return null;
        } finally {
            loading.delete(key);
        }
    })();

    loading.set(key, attempt);
    return attempt;
}

/** The model if it is already here, without starting a fetch. */
export function peekPlateModel(base: string, model?: string): PlateModel | null {
    return loaded.get(`${base}|${model || modelFromBase(base)}`) ?? null;
}

/**
 * The generator itself.
 *
 * Empty rather than an error while the data is on its way: an empty world is
 * what the map already shows, and it is replaced the moment the fetch lands.
 */
export function paleoCoastlines(query: URLSearchParams): GeoJSON.FeatureCollection {
    const base = query.get('data');
    if (!base) {
        console.warn('[paleo-coastlines] needs ?data=<directory holding the plate model>');
        return EMPTY;
    }
    const name = query.get('model') ?? undefined;
    const model = peekPlateModel(base, name);
    if (!model) {
        void loadPlateModelFrom(base, name);
        return EMPTY;
    }
    const age = Number(query.get('ma'));
    return reconstruct(model, Number.isFinite(age) ? Math.max(0, Math.min(model.maxAge, age)) : 0);
}
