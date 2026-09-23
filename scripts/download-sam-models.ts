/**
 * Mirrors Segment Anything models from HuggingFace into a directory, laid out
 * the way the segment tool's default `modelBaseUrl` (`models/{repo}/`) expects.
 *
 *   npm run models:sam -- --out public/config/models            # default models
 *   npm run models:sam -- --out <dir> --models slimsam-77,sam2.1-large
 *   npm run models:sam -- --out <dir> --all                     # every model and variant
 *
 * By default this fetches SlimSAM and both variants (fp32 and fp16) of SAM 2.1
 * Tiny, which is what a browser picks between. Files already present with the
 * right size are skipped, so re-running resumes an interrupted download.
 *
 * The files are large (SAM 2.1 Large's encoder is one 889 MB file), which rules
 * out hosting them in a git repository or on GitHub Pages (100 MB per file);
 * serve the directory from a plain web server, or point `modelBaseUrl` at
 * HuggingFace instead and skip this script altogether.
 */

import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { CLIP_MODELS, SAM_MODELS } from '../src/utils/sam/sam-models';

/** One downloadable model: a repository and the files to fetch from it. */
interface Download {
    label: string;
    repo: string;
    files: string[];
}

/**
 * Everything the segment tool can use and HuggingFace hosts: the SAM models
 * (both variants, since a browser picks between them) and the CLIP models
 * for naming segments. RemoteCLIP is not on HuggingFace in ONNX form (its
 * repo is `webmapx/...`), so it is not offered here.
 */
const DOWNLOADS: Record<string, Download> = Object.fromEntries([
    ...SAM_MODELS.map(m => [m.id, {
        label: m.label,
        repo: m.repo,
        files: [...new Set([m.default, ...(m.fp16 ? [m.fp16] : [])].flatMap(v => [...v.files.encoder, ...v.files.decoder]))],
    }]),
    ...CLIP_MODELS.filter(m => !m.repo.startsWith('webmapx/')).map(m => [m.id, {
        label: m.label,
        repo: m.repo,
        files: [m.vision, m.text, m.tokenizer, m.tokenizerConfig],
    }]),
]);

const HF = 'https://huggingface.co';
const DEFAULT_MODELS = ['slimsam-77', 'sam2.1-tiny'];

function usage(): never {
    console.log(`Usage: npm run models:sam -- --out <dir> [--models id,id | --all]

Models: ${Object.keys(DOWNLOADS).join(', ')}
Default: ${DEFAULT_MODELS.join(', ')}`);
    process.exit(1);
}

function parseArgs(argv: string[]): { out: string; models: Download[] } {
    let out = '';
    let ids = DEFAULT_MODELS;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--out') out = argv[++i] ?? '';
        else if (arg === '--models') ids = (argv[++i] ?? '').split(',').filter(Boolean);
        else if (arg === '--all') ids = Object.keys(DOWNLOADS);
        else if (arg === '--help' || arg === '-h') usage();
        else { console.error(`Unknown argument ${arg}`); usage(); }
    }
    if (!out) usage();
    const models = ids.map(id => {
        const m = DOWNLOADS[id];
        if (!m) { console.error(`Unknown model ${id}`); usage(); }
        return m;
    });
    return { out, models };
}

async function download(url: string, target: string): Promise<void> {
    const head = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!head.ok) throw new Error(`${url}: ${head.status} ${head.statusText}`);
    const size = Number(head.headers.get('content-length') ?? 0);
    if (existsSync(target) && size && statSync(target).size === size) {
        console.log(`  have   ${path.basename(target)}`);
        return;
    }
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok || !response.body) throw new Error(`${url}: ${response.status} ${response.statusText}`);
    mkdirSync(path.dirname(target), { recursive: true });
    const partial = `${target}.partial`;
    await pipeline(Readable.fromWeb(response.body as never), createWriteStream(partial));
    renameSync(partial, target);
    console.log(`  got    ${path.basename(target)} (${(statSync(target).size / 1e6).toFixed(1)} MB)`);
}

async function main(): Promise<void> {
    const { out, models } = parseArgs(process.argv.slice(2));
    for (const model of models) {
        console.log(`${model.label} (${model.repo})`);
        for (const file of model.files) {
            await download(`${HF}/${model.repo}/resolve/main/${file}`, path.join(out, model.repo, file));
        }
    }
    console.log(`\nDone. With the models in <config dir>/models the default modelBaseUrl finds them;
otherwise set tools.segment.modelBaseUrl to where "${out}" is served, ending in {repo}/.`);
}

main().catch(err => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
