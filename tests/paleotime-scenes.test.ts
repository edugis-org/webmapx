/**
 * Which scene belongs to an age on the deep-time slider.
 *
 * The ranges in `deeptime-periods.json` run oldest-first and touch at their
 * boundaries — the Cretaceous ends at 66 Ma and the Paleogene begins there — so
 * "which period is this" is a question about which side of a boundary an age
 * falls on, and getting it backwards is invisible until someone stops exactly
 * on 66 and sees the wrong picture.
 *
 * `now` is the awkward one: a zero-wide range that no `from > ma >= to` test
 * can match, and the only entry that may answer for the present day.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import path from 'node:path';

interface Scene {
    id: string;
    name: string;
    fromMa: number;
    toMa: number;
    caption: string;
    sprite: { x: number; y: number; w: number; h: number };
}

interface Scenes {
    sprite: string;
    spriteWidth: number;
    spriteHeight: number;
    periods: Scene[];
}

/**
 * The scenes file lives in the config repository, which is a checkout here —
 * so the test reads it when present and says so when it is not, rather than
 * failing over something that is not webmapx's to provide.
 */
function loadScenes(): Scenes | null {
    const file = path.join(process.cwd(), 'public/config/data/paleo/deeptime-periods.json');
    try {
        return JSON.parse(readFileSync(file, 'utf8')) as Scenes;
    } catch {
        return null;
    }
}

/** Mirrors `sceneAt` in webmapx-paleotime-tool.ts. */
function sceneAt(scenes: Scenes, ma: number): Scene | null {
    for (const period of scenes.periods) {
        if (period.fromMa === 0 && period.toMa === 0) continue;
        if (ma <= period.fromMa && ma > period.toMa) return period;
    }
    return scenes.periods.find((period) => period.fromMa === 0 && period.toMa === 0) ?? null;
}

const scenes = loadScenes();

test('the scenes file describes a complete, ordered timeline', { skip: !scenes && 'no config checkout' }, () => {
    const periods = scenes!.periods.filter((period) => !(period.fromMa === 0 && period.toMa === 0));
    for (const period of periods) {
        assert.ok(period.fromMa > period.toMa, `${period.id} runs ${period.fromMa} → ${period.toMa}`);
        assert.ok(period.caption.length > 0, `${period.id} has no caption`);
    }
    // Each range starts where the previous one ended: no gap to fall into.
    for (let i = 1; i < periods.length; i++) {
        assert.equal(periods[i].fromMa, periods[i - 1].toMa,
            `${periods[i].id} should begin where ${periods[i - 1].id} ends`);
    }
});

test('an age picks the period it belongs to', { skip: !scenes && 'no config checkout' }, () => {
    const cases: Array<[number, string]> = [
        [900, 'neoproterozoic'],
        [500, 'cambrian'],
        [300, 'carboniferous'],
        [220, 'triassic'],
        [100, 'cretaceous'],
        [30, 'paleogene'],
        [5, 'neogene'],
        [2, 'pleistocene'],
        [0.5, 'early-hominins'],
        [0, 'now'],
    ];
    for (const [ma, expected] of cases) {
        assert.equal(sceneAt(scenes!, ma)?.id, expected, `${ma} Ma`);
    }
});

test('a boundary age starts the younger period', { skip: !scenes && 'no config checkout' }, () => {
    // Stratigraphy defines a boundary as the base of the younger unit: the
    // K–Pg boundary at 66 Ma *is* the start of the Paleogene, so an age of
    // exactly 66 belongs to it and 66.1 is still Cretaceous. Same rule at 252,
    // where the Permian ends and the Triassic begins.
    assert.equal(sceneAt(scenes!, 66)?.id, 'paleogene');
    assert.equal(sceneAt(scenes!, 66.1)?.id, 'cretaceous');
    assert.equal(sceneAt(scenes!, 252)?.id, 'triassic');
    assert.equal(sceneAt(scenes!, 252.1)?.id, 'permian');
});

test('every sprite rectangle lies inside the sprite', { skip: !scenes && 'no config checkout' }, () => {
    for (const period of scenes!.periods) {
        const { x, y, w, h } = period.sprite;
        assert.ok(x >= 0 && y >= 0, `${period.id} starts outside the sprite`);
        assert.ok(x + w <= scenes!.spriteWidth, `${period.id} runs past the right edge`);
        assert.ok(y + h <= scenes!.spriteHeight, `${period.id} runs past the bottom edge`);
        assert.ok(w > 0 && h > 0, `${period.id} is empty`);
    }
});

test('no two periods share a sprite rectangle', { skip: !scenes && 'no config checkout' }, () => {
    // A copy-paste in the rects would show one period's picture for another.
    const seen = new Map<string, string>();
    for (const period of scenes!.periods) {
        const key = `${period.sprite.x},${period.sprite.y}`;
        assert.equal(seen.get(key), undefined, `${period.id} reuses ${seen.get(key)}'s tile`);
        seen.set(key, period.id);
    }
});
