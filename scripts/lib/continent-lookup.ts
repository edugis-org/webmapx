/**
 * Which continent a piece of land belongs to *today*.
 *
 * Asked because the interesting thing about a plate reconstruction is not that
 * India moves, it is that India moves away from Africa — which only reads if
 * every fragment keeps the colour of the landmass it is part of now.
 *
 * The answer comes from present-day position, not from the plate model's
 * rotation hierarchy. That hierarchy was the first attempt and it is the wrong
 * question: it records which plate a fragment is *defined relative to*, which is
 * tectonic ancestry rather than geography. Iberia is defined relative to North
 * America, so Spain came out the colour of Canada; Adria is a promontory of
 * Africa, so Italy and Croatia came out the colour of Algeria. All true, and
 * none of it what "which continent is this" means to a reader.
 *
 * So each piece of land is looked up against present-day countries and the
 * country's continent is used. A coastline vertex often falls just outside a
 * simplified country outline, and a great many features are small islands that
 * such an outline does not contain at all, so a miss falls back to the nearest
 * country rather than to nothing.
 */
import { readFile } from 'node:fs/promises';
import { feature as topoFeature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

export const CONTINENTS = [
    'Africa',
    'Asia',
    'Europe',
    'North America',
    'South America',
    'Oceania',
    'Antarctica',
] as const;

export type Continent = typeof CONTINENTS[number];

/**
 * ISO 3166-1 alpha-3 to continent.
 *
 * Grouped rather than listed one per line so the whole of a continent can be
 * read at a glance and a missing country is obvious. Territories are filed
 * where they *are*, not with whoever governs them: Réunion is in Africa and
 * French Guiana in South America, because this colours land, not sovereignty.
 * Transcontinental countries go where most of their land is — Russia and Turkey
 * to Asia, Egypt to Africa.
 */
const BY_CONTINENT: Record<Continent, string> = {
    'Africa':
        'DZA AGO BEN BWA BFA BDI CMR CPV CAF TCD COM COG COD CIV DJI EGY GNQ ERI SWZ ETH GAB GMB'
        + ' GHA GIN GNB KEN LSO LBR LBY MDG MWI MLI MRT MUS MYT MAR MOZ NAM NER NGA REU RWA SHN STP'
        + ' SEN SYC SLE SOM ZAF SSD SDN TZA TGO TUN UGA ESH ZMB ZWE',
    'Asia':
        'AFG ARM AZE BHR BGD BTN BRN KHM CHN CYP GEO HKG IND IDN IRN IRQ ISR JPN JOR KAZ KWT KGZ'
        + ' LAO LBN MAC MYS MDV MNG MMR NPL PRK OMN PAK PSE PHL QAT RUS SAU SGP KOR LKA SYR TWN TJK'
        + ' THA TLS TUR TKM ARE UZB VNM YEM IOT CCX CXR',
    'Europe':
        'ALA ALB AND AUT BLR BEL BIH BGR HRV CZE DNK EST FRO FIN FRA DEU GIB GRC GGY HUN ISL IRL'
        + ' IMN ITA JEY LVA LIE LTU LUX MLT MDA MCO MNE NLD MKD NOR POL PRT ROU SMR SRB SVK SVN ESP'
        + ' SJM SWE CHE UKR GBR VAT',
    'North America':
        'AIA ATG ABW BHS BRB BLZ BMU BES VGB CAN CYM CRI CUB CUW DMA DOM SLV GRL GRD GLP GTM HTI'
        + ' HND JAM MTQ MEX MSR ANT NIC PAN PRI BLM KNA LCA MAF SPM VCT SXM TTO TCA USA VIR',
    'South America':
        'ARG BOL BRA CHL COL ECU FLK GUF GUY PRY PER SGS SUR URY VEN',
    'Oceania':
        'ASM AUS COK FJI PYF GUM KIR MHL FSM NRU NCL NZL NIU NFK MNP PLW PNG PCN WSM SLB TKL TON'
        + ' TUV VUT WLF',
    'Antarctica': 'ATA ATF BVT HMD',
};

const ISO_TO_CONTINENT = new Map<string, Continent>();
for (const [continent, codes] of Object.entries(BY_CONTINENT)) {
    for (const code of codes.split(/\s+/)) {
        if (code) ISO_TO_CONTINENT.set(code, continent as Continent);
    }
}

/** Christmas Island and the Cocos Islands, spelled as the data spells them. */
ISO_TO_CONTINENT.set('CXR', 'Asia');
ISO_TO_CONTINENT.set('CCK', 'Asia');

type Ring = [number, number][];

interface Country {
    continent: Continent;
    rings: Ring[];
    /** Bounding box, so most rings are skipped without any point-in-polygon work. */
    bbox: [number, number, number, number];
    centroid: [number, number];
}

function ringsOf(geometry: { type: string; coordinates: unknown }): Ring[] {
    // Only outer rings are kept: a hole in a country outline is not somewhere a
    // coastline stops being on that continent.
    if (geometry.type === 'Polygon') {
        return [(geometry.coordinates as Ring[])[0]];
    }
    if (geometry.type === 'MultiPolygon') {
        return (geometry.coordinates as Ring[][][]).map((polygon) => polygon[0] as unknown as Ring);
    }
    return [];
}

/** Ray casting, on the ring as written. Continents are not near the date line seam. */
function ringContains(ring: Ring, lon: number, lat: number): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

/** Great-circle-ish distance, good enough to rank candidates. */
function distanceSquared(alon: number, alat: number, blon: number, blat: number): number {
    let dLon = alon - blon;
    if (dLon > 180) dLon -= 360;
    else if (dLon < -180) dLon += 360;
    const scale = Math.cos(((alat + blat) / 2) * (Math.PI / 180));
    const x = dLon * scale;
    const y = alat - blat;
    return x * x + y * y;
}

export interface ContinentLookup {
    /** The continent at a position, by containment and then by proximity. */
    at(lon: number, lat: number): Continent | null;
    /** Countries whose ISO code is not in the table, for reporting. */
    readonly unmapped: string[];
}

type CountryFeature = { properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } };

/**
 * The countries, from either spelling of the file.
 *
 * TopoJSON is what `scripts/prepare-country-data.sh` writes and what the
 * repository carries; the GeoJSON is an artefact of an older run of that script
 * which is no longer produced and is not committed. Both are read, so a
 * `--countries` pointing at an old local copy still works.
 */
async function readCountries(countriesFile: string): Promise<CountryFeature[]> {
    const parsed = JSON.parse(await readFile(countriesFile, 'utf8')) as Record<string, unknown>;
    if (parsed.type === 'Topology') {
        const topology = parsed as unknown as Topology;
        const key = Object.keys(topology.objects)[0];
        const collection = topoFeature(topology, topology.objects[key] as GeometryCollection);
        return (collection as { features: CountryFeature[] }).features;
    }
    return (parsed as unknown as { features: CountryFeature[] }).features;
}

/**
 * A coordinate that is on the map.
 *
 * A guard, not a repair of a wrong answer. The old GeoJSON closes its Antarctic
 * ring along the pole with a 1315-degree sweep -- twenty vertices out to
 * +-657.5 longitude, all of them at latitude -90, where a longitude means
 * nothing -- which gives that ring a bounding box spanning every longitude on
 * Earth. Measured, it changes none of this lookup's answers: the same box is
 * bounded to latitudes below -63, and every probe in that band agrees with and
 * without this. It is here because a ring whose box covers the planet defeats
 * the pre-filter that makes the search cheap, and because a coordinate off the
 * map should not reach a planar ray cast at all.
 *
 * Clamping rather than folding by whole turns, which is the right rule
 * anywhere else: every offending vertex is at |latitude| >= 89.3, where a
 * degree of longitude is under a kilometre, and clamping keeps the pole sweep
 * monotone where folding would zig-zag it across the map.
 */
function onTheMap([lon, lat]: [number, number]): [number, number] {
    return [Math.min(Math.max(lon, -180), 180), Math.min(Math.max(lat, -90), 90)];
}

export async function loadContinentLookup(countriesFile: string): Promise<ContinentLookup> {
    const parsed = { features: await readCountries(countriesFile) };

    const countries: Country[] = [];
    const unmapped = new Set<string>();

    for (const feature of parsed.features) {
        const iso = String(feature.properties.ISO_A3 ?? '');
        const continent = ISO_TO_CONTINENT.get(iso);
        if (!continent) {
            // `-99` is how this dataset spells a disputed or unrecognised area.
            if (iso && iso !== '-99') unmapped.add(iso);
            continue;
        }
        for (const raw of ringsOf(feature.geometry)) {
            if (!raw || raw.length < 4) continue;
            const ring = raw.map(onTheMap);
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let sumX = 0, sumY = 0;
            for (const [x, y] of ring) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                sumX += x;
                sumY += y;
            }
            countries.push({
                continent,
                rings: [ring],
                bbox: [minX, minY, maxX, maxY],
                centroid: [sumX / ring.length, sumY / ring.length],
            });
        }
    }

    return {
        unmapped: [...unmapped].sort(),
        at(lon: number, lat: number): Continent | null {
            for (const country of countries) {
                const [minX, minY, maxX, maxY] = country.bbox;
                if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
                for (const ring of country.rings) {
                    if (ringContains(ring, lon, lat)) return country.continent;
                }
            }
            // Not inside anything: an island the simplified outlines do not
            // carry, or a coastal vertex just outside its own country. The
            // nearest landmass is the right answer for both.
            let best: Continent | null = null;
            let bestDistance = Infinity;
            for (const country of countries) {
                const d = distanceSquared(lon, lat, country.centroid[0], country.centroid[1]);
                if (d < bestDistance) {
                    bestDistance = d;
                    best = country.continent;
                }
            }
            return best;
        },
    };
}
