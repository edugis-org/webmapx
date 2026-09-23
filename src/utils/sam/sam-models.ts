/**
 * The Segment Anything models the segment tool can offer, and where their files live.
 *
 * Every model here is a transformers.js-format ONNX export: a `vision_encoder`
 * (the expensive part, run once per image) and a `prompt_encoder_mask_decoder`
 * (tens of milliseconds, run on every click). Two families exist and differ in
 * their tensors, not in how they are used — see `workers/sam-runner.ts`.
 *
 * The files are addressed as `<modelBaseUrl with {repo} filled in><file>`. The
 * default base is config-relative (`models/{repo}/`), so a deployment that
 * hosts its own copy needs no config at all and a passive server works; a
 * config may instead point at HuggingFace directly with
 * `https://huggingface.co/{repo}/resolve/main/`, which lays the repositories
 * out the same way. `npm run models:sam` mirrors them into a local directory.
 */

export type SamFamily = 'sam' | 'sam2';

/**
 * A model's files, relative to its repository. The first entry of each list is
 * the ONNX graph; any further entries are its external-data files, which the
 * graph refers to by bare file name.
 */
export interface SamModelFiles {
    encoder: string[];
    decoder: string[];
}

export interface SamModelVariant {
    files: SamModelFiles;
    /** Download size in megabytes, shown before the user commits to it. */
    sizeMB: number;
}

export interface SamModelEntry {
    id: string;
    label: string;
    family: SamFamily;
    /** Repository path, substituted for `{repo}` in the base url. */
    repo: string;
    /** The variant that runs everywhere (fp32, or int8 for SlimSAM). */
    default: SamModelVariant;
    /**
     * A half-precision variant, used instead of `default` when the browser's
     * WebGPU adapter supports `shader-f16`: half the download, same tensors.
     */
    fp16?: SamModelVariant;
    /**
     * Whether the model is practical without WebGPU. SAM 2 runs on the CPU
     * too, but its encoder then takes tens of seconds per view.
     */
    cpuFriendly?: boolean;
}

export const DEFAULT_MODEL_BASE_URL = 'models/{repo}/';

function sam2Files(suffix: string): SamModelFiles {
    return {
        encoder: [`onnx/vision_encoder${suffix}.onnx`, `onnx/vision_encoder${suffix}.onnx_data`],
        decoder: [`onnx/prompt_encoder_mask_decoder${suffix}.onnx`, `onnx/prompt_encoder_mask_decoder${suffix}.onnx_data`],
    };
}

export const SAM_MODELS: readonly SamModelEntry[] = [
    {
        id: 'slimsam-77',
        label: 'SlimSAM',
        family: 'sam',
        repo: 'Xenova/slimsam-77-uniform',
        default: {
            files: {
                encoder: ['onnx/vision_encoder_quantized.onnx'],
                decoder: ['onnx/prompt_encoder_mask_decoder_quantized.onnx'],
            },
            sizeMB: 14,
        },
        cpuFriendly: true,
    },
    {
        id: 'sam2.1-tiny',
        label: 'SAM 2.1 Tiny',
        family: 'sam2',
        repo: 'onnx-community/sam2.1-hiera-tiny-ONNX',
        default: { files: sam2Files(''), sizeMB: 156 },
        fp16: { files: sam2Files('_fp16'), sizeMB: 78 },
    },
    {
        id: 'sam2.1-small',
        label: 'SAM 2.1 Small',
        family: 'sam2',
        repo: 'onnx-community/sam2.1-hiera-small-ONNX',
        default: { files: sam2Files(''), sizeMB: 184 },
        fp16: { files: sam2Files('_fp16'), sizeMB: 92 },
    },
    {
        id: 'sam2.1-base-plus',
        label: 'SAM 2.1 Base+',
        family: 'sam2',
        repo: 'onnx-community/sam2.1-hiera-base-plus-ONNX',
        default: { files: sam2Files(''), sizeMB: 328 },
        fp16: { files: sam2Files('_fp16'), sizeMB: 164 },
    },
    {
        id: 'sam2.1-large',
        label: 'SAM 2.1 Large',
        family: 'sam2',
        repo: 'onnx-community/sam2.1-hiera-large-ONNX',
        default: { files: sam2Files(''), sizeMB: 912 },
        fp16: { files: sam2Files('_fp16'), sizeMB: 457 },
    },
];

/** A model with its file urls resolved, as handed to the worker. */
export interface ResolvedSamModel {
    id: string;
    family: SamFamily;
    encoder: string[];
    decoder: string[];
    sizeMB: number;
}

export function resolveModelBase(baseUrl: string, repo: string): string {
    const base = baseUrl.includes('{repo}') ? baseUrl.replace('{repo}', repo) : `${baseUrl.replace(/\/?$/, '/')}${repo}/`;
    return base.endsWith('/') ? base : `${base}/`;
}

/**
 * Picks the variant this browser should download and turns its files into
 * urls. `resolve` makes a config-relative base absolute (the tool passes
 * `resolveConfigAsset`), since the worker has no idea where the config was.
 */
export function resolveSamModel(
    entry: SamModelEntry,
    baseUrl: string,
    useFp16: boolean,
    resolve: (path: string) => string = (p) => p,
): ResolvedSamModel {
    const variant = useFp16 && entry.fp16 ? entry.fp16 : entry.default;
    const base = resolve(resolveModelBase(baseUrl, entry.repo));
    const url = (file: string): string => new URL(file, base).toString();
    return {
        id: `${entry.id}${variant === entry.default ? '' : ':fp16'}`,
        family: entry.family,
        encoder: variant.files.encoder.map(url),
        decoder: variant.files.decoder.map(url),
        sizeMB: variant.sizeMB,
    };
}

/**
 * The model list a config asks for. `models` may name built-in ids, carry full
 * entries (for a model this build does not know), or be absent for all of them.
 */
export function modelsFromConfig(models: unknown): SamModelEntry[] {
    if (!Array.isArray(models) || models.length === 0) return [...SAM_MODELS];
    const out: SamModelEntry[] = [];
    for (const item of models) {
        if (typeof item === 'string') {
            const known = SAM_MODELS.find(m => m.id === item);
            if (known) out.push(known);
            else console.warn(`[segment] unknown model "${item}" ignored`);
        } else if (item && typeof item === 'object' && typeof (item as SamModelEntry).id === 'string') {
            const known = SAM_MODELS.find(m => m.id === (item as SamModelEntry).id);
            out.push({ ...known, ...(item as SamModelEntry) } as SamModelEntry);
        }
    }
    return out.length ? out : [...SAM_MODELS];
}
