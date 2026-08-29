/**
 * Puts the config repository where webmapx serves it, and records which commit
 * a deployment was built from.
 *
 * Configs are content: they change when a dataset moves or a school year
 * starts, on an editorial cadence that has nothing to do with a webmapx
 * release. They therefore live in their own repository — but webmapx has to
 * serve them during development, and a deployment has to ship a *known* version
 * of them, and those two wants pull in opposite directions:
 *
 *   dev    wants the working copy, edited in place, no ceremony;
 *   deploy wants a commit that cannot move under a site that was tested and
 *          working.
 *
 * So both are provided, and they are different commands. `init` gives you a
 * live checkout at public/config (a symlink to a sibling clone if you have one,
 * so setup.html edits the real repository and you commit there). `pin` records
 * the commit you have been testing into configs.lock. `sync` checks out exactly
 * what configs.lock names, which is what a deployment build runs — so what
 * shipped is what was tested, and updating configs in production is a deliberate
 * commit to that file rather than something that happens on its own.
 *
 * public/config is gitignored in webmapx: it is a checkout, not content.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REPO_URL = 'https://github.com/edugis-org/webmapx-configs.git';
const SIBLING = path.resolve(process.cwd(), '..', 'webmapx-configs');
const TARGET = path.resolve(process.cwd(), 'public', 'config');
const LOCK = path.resolve(process.cwd(), 'configs.lock');

interface Lock {
    repository: string;
    commit: string;
    pinnedAt: string;
}

function git(args: string[], cwd = TARGET): string {
    return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** Where public/config actually points: a symlink to a sibling clone, or a clone of its own. */
function describeTarget(): { kind: 'missing' | 'symlink' | 'clone'; realPath: string } {
    if (!existsSync(TARGET)) return { kind: 'missing', realPath: TARGET };
    const kind = lstatSync(TARGET).isSymbolicLink() ? 'symlink' : 'clone';
    return { kind, realPath: realpathSync(TARGET) };
}

function readLock(): Lock | null {
    if (!existsSync(LOCK)) return null;
    return JSON.parse(readFileSync(LOCK, 'utf8')) as Lock;
}

function init(): void {
    const existing = describeTarget();
    if (existing.kind !== 'missing') {
        console.log(`public/config already exists (${existing.kind} → ${existing.realPath})`);
        return status();
    }

    // A sibling clone is preferred over a second one: editing a config in
    // setup.html should edit the repository you commit from, not a copy that
    // silently diverges from it.
    //
    // A link is not always possible, and that must not stop anyone working.
    // Windows refuses symlinks to unprivileged users unless Developer Mode is
    // on — a directory *junction* is the way round it there, which is what npm
    // itself uses — and if even that fails we clone instead. A second clone is
    // a worse developer experience, not a broken one: you edit in
    // public/config and commit there.
    if (existsSync(path.join(SIBLING, '.git'))) {
        const linkType = process.platform === 'win32' ? 'junction' : 'dir';
        try {
            symlinkSync(SIBLING, TARGET, linkType);
            console.log(`public/config → ${SIBLING} (${linkType} to your sibling clone)`);
            return status();
        } catch (error) {
            console.warn(`Could not link public/config to ${SIBLING} (${(error as Error).message}).`);
            console.warn('Cloning a separate checkout instead — commit config changes from public/config.');
        }
    }

    console.log(`Cloning ${REPO_URL} into public/config …`);
    execFileSync('git', ['clone', REPO_URL, TARGET], { stdio: 'inherit' });
    status();
}

function status(): void {
    const target = describeTarget();
    if (target.kind === 'missing') {
        console.log('public/config is missing — run `npm run configs` to create it.');
        process.exitCode = 1;
        return;
    }

    const head = git(['rev-parse', 'HEAD']).slice(0, 9);
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    const dirty = git(['status', '--porcelain']).length > 0;
    const lock = readLock();

    console.log(`public/config  ${target.kind} → ${target.realPath}`);
    console.log(`checkout       ${head} on ${branch}${dirty ? ' (uncommitted changes)' : ''}`);

    if (!lock) {
        console.log('configs.lock   absent — nothing pinned for deployment yet.');
        return;
    }

    const pinned = lock.commit.slice(0, 9);
    console.log(`configs.lock   ${pinned} (pinned ${lock.pinnedAt.slice(0, 10)})`);
    if (pinned !== head) {
        console.log('               ⚠ your checkout is NOT what a deployment would ship.');
        console.log('               `npm run configs:pin` to ship what you are testing,');
        console.log('               `npm run configs:sync` to test what a deployment ships.');
    }
}

/** Records the commit currently checked out, so a deployment ships what was tested. */
function pin(): void {
    const target = describeTarget();
    if (target.kind === 'missing') {
        console.error('public/config is missing — run `npm run configs` first.');
        process.exitCode = 1;
        return;
    }

    if (git(['status', '--porcelain']).length > 0) {
        console.error('The config checkout has uncommitted changes. Commit and push them first —');
        console.error('a pin names a commit, and an unpushed one cannot be fetched by a deployment.');
        process.exitCode = 1;
        return;
    }

    const lock: Lock = {
        repository: REPO_URL,
        commit: git(['rev-parse', 'HEAD']),
        pinnedAt: new Date().toISOString(),
    };
    writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
    console.log(`Pinned ${lock.commit.slice(0, 9)} in configs.lock — commit that file to ship it.`);
}

/** Checks out exactly what configs.lock names. This is what a deployment build runs. */
function sync(): void {
    const lock = readLock();
    if (!lock) {
        console.error('No configs.lock — run `npm run configs:pin` after testing a config version.');
        process.exitCode = 1;
        return;
    }

    const target = describeTarget();
    if (target.kind === 'symlink') {
        // Moving a shared clone to a detached commit would silently rewrite the
        // working copy someone is editing.
        console.error('public/config is a link to your own clone; refusing to move it to the pinned');
        console.error(`commit. Remove the symlink and re-run, or check out ${lock.commit.slice(0, 9)} there yourself.`);
        process.exitCode = 1;
        return;
    }

    if (target.kind === 'missing') {
        execFileSync('git', ['clone', lock.repository, TARGET], { stdio: 'inherit' });
    }

    git(['fetch', 'origin', lock.commit]);
    git(['checkout', '--detach', lock.commit]);
    console.log(`public/config is at ${lock.commit.slice(0, 9)}, as configs.lock names.`);
}

const command = process.argv[2] ?? 'init';
const commands: Record<string, () => void> = { init, status, pin, sync };

if (!commands[command]) {
    console.error(`Usage: configs <init|status|pin|sync>\n\n${
        [
            'init    create public/config — a symlink to ../webmapx-configs if you have one, else a clone',
            'status  show which commit is checked out and whether it matches configs.lock',
            'pin     record the checked-out commit in configs.lock, for deployments to ship',
            'sync    check out exactly what configs.lock names (what a deployment build runs)',
        ].join('\n')
    }`);
    process.exitCode = 2;
} else {
    commands[command]();
}

export {};
