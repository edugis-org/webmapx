/**
 * The throttle, and the one thing a throttle must never do: lose the last call.
 *
 * Dropping intermediate calls is the whole point — a colour picker emits on
 * every pointer move and nobody sees the frames in between. Dropping the call
 * the user actually stopped on is a lost edit, so a waiting trailing call has
 * to be flushable by whatever ends the interaction.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { throttle } from '../src/utils/throttle';

const tick = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

test('the first call goes straight through and the rest collapse into one', async () => {
    const seen: number[] = [];
    const throttled = throttle((value: number) => seen.push(value), 40);

    throttled(1);
    throttled(2);
    throttled(3);
    // Leading call only: the other two are still waiting, as one.
    assert.deepEqual(seen, [1]);

    await tick(70);
    // And the trailing call carries the newest arguments, not the oldest.
    assert.deepEqual(seen, [1, 3]);
});

test('flush lets a waiting call out now', () => {
    const seen: string[] = [];
    const throttled = throttle((value: string) => seen.push(value), 1000);

    throttled('first');
    throttled('second');
    throttled('last');
    assert.deepEqual(seen, ['first']);

    throttled.flush();
    // Without this, closing a panel a second after the pointer stopped would
    // leave the last edit in a timer that never gets to run.
    assert.deepEqual(seen, ['first', 'last']);
});

test('flush with nothing waiting does nothing', () => {
    let calls = 0;
    const throttled = throttle(() => { calls += 1; }, 40);

    throttled();
    assert.equal(calls, 1);
    throttled.flush();
    assert.equal(calls, 1);
});

test('a flushed call is not repeated when its timer would have fired', async () => {
    const seen: number[] = [];
    const throttled = throttle((value: number) => seen.push(value), 40);

    throttled(1);
    throttled(2);
    throttled.flush();
    await tick(70);
    assert.deepEqual(seen, [1, 2]);
});
