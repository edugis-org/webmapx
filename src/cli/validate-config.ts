/**
 * `webmapx-validate` — checks config files against the validator the app runs.
 *
 * This exists so a config repository's CI can gate on the *same* code the
 * browser uses, at a pinned version of this package, rather than on a second
 * implementation that drifts from it. Running it against several installed
 * webmapx versions is what answers the question configs and code otherwise
 * drift on quietly: a config naming a tool that does not exist yet passes
 * against `next` and fails against the release.
 *
 * Exit status is what CI reads: non-zero when a config has errors, or when
 * --strict is given and it has warnings. Warnings alone are not a failure by
 * default, because a config naming a tool an older build lacks still produces a
 * working map, and that is frequently the intended state during a rollout.
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { validateConfig } from '../config/validator.js';
import type { ValidationMessage } from '../config/validator.js';

interface Options {
    files: string[];
    strict: boolean;
    quiet: boolean;
}

const USAGE = `webmapx-validate — validate webmapx config files

Usage:
  webmapx-validate <config.json> [more.json ...] [options]

Options:
  --strict     treat warnings as failures (exit 1)
  --quiet      print only failures, not the per-file summary
  -h, --help   show this message

Exit status:
  0  every file is valid (and, with --strict, warning-free)
  1  a file has errors, could not be read, or is not valid JSON
`;

function parseArgs(argv: string[]): Options | null {
    const options: Options = { files: [], strict: false, quiet: false };

    for (const arg of argv) {
        if (arg === '-h' || arg === '--help') return null;
        else if (arg === '--strict') options.strict = true;
        else if (arg === '--quiet') options.quiet = true;
        else if (arg.startsWith('-')) {
            process.stderr.write(`Unknown option: ${arg}\n\n${USAGE}`);
            process.exit(2);
        } else options.files.push(arg);
    }

    return options.files.length > 0 ? options : null;
}

function formatMessage(message: ValidationMessage): string {
    const where = message.path ? ` ${message.path}` : '';
    return `  ${message.severity}:${where} ${message.message}`;
}

async function validateFile(file: string, options: Options): Promise<boolean> {
    let raw: string;
    try {
        raw = await readFile(file, 'utf8');
    } catch (error) {
        process.stderr.write(`${file}: cannot read — ${(error as Error).message}\n`);
        return false;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        process.stderr.write(`${file}: not valid JSON — ${(error as Error).message}\n`);
        return false;
    }

    const result = validateConfig(parsed);
    const failed = result.errors.length > 0 || (options.strict && result.warnings.length > 0);

    if (!options.quiet || failed) {
        const counts = `${result.errors.length} error(s), ${result.warnings.length} warning(s)`;
        process.stdout.write(`${file}: ${failed ? 'FAIL' : 'ok'} — ${counts}\n`);
        for (const message of [...result.errors, ...result.warnings]) {
            process.stdout.write(`${formatMessage(message)}\n`);
        }
    }

    return !failed;
}

const options = parseArgs(process.argv.slice(2));
if (!options) {
    process.stdout.write(USAGE);
    process.exit(process.argv.length > 2 ? 0 : 2);
}

let ok = true;
for (const file of options.files) {
    // Sequential on purpose: interleaved output from a dozen configs is
    // unreadable, and validation is fast enough that it does not matter.
    if (!(await validateFile(file, options))) ok = false;
}

process.exit(ok ? 0 : 1);
