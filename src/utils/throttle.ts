// src/utils/throttle.ts

/**
 * Ensures a function is called at most once per defined time interval, with a
 * guaranteed trailing call carrying the most recent arguments.
 * This is critical for rate-limiting expensive map API calls during continuous
 * UI interactions (e.g., dragging a slider).
 * * @param func The function to throttle.
 * @param limit The time limit in milliseconds.
 * @returns A throttled version of the function.
 */
export interface Throttled {
    (...args: any[]): void;
    /**
     * Runs a waiting trailing call now, if there is one.
     *
     * A throttle exists to drop work nobody will see; a *pending* call is work
     * somebody is waiting for. Anything that ends the interaction — closing a
     * panel, pressing Done, reading the result back in a test — needs the last
     * value to have landed, and waiting out the interval instead is how a
     * throttle turns into a lost edit.
     */
    flush(): void;
}

export const throttle = (func: (...args: any[]) => void, limit: number): Throttled => {
    let lastFunc: ReturnType<typeof setTimeout> | null = null;
    let lastRan = 0;
    let pending: any[] | null = null;

    const throttled = function(this: any, ...args: any[]) {
        const now = Date.now();
        const elapsed = now - lastRan;

        if (elapsed >= limit) {
            if (lastFunc) {
                clearTimeout(lastFunc);
                lastFunc = null;
            }
            pending = null;
            lastRan = now;
            func.apply(this, args);
            return;
        }

        if (lastFunc) {
            clearTimeout(lastFunc);
        }
        pending = args;
        lastFunc = setTimeout(() => {
            lastFunc = null;
            pending = null;
            lastRan = Date.now();
            func.apply(this, args);
        }, limit - elapsed);
    } as Throttled;

    throttled.flush = (): void => {
        if (!lastFunc) return;
        clearTimeout(lastFunc);
        lastFunc = null;
        const args = pending ?? [];
        pending = null;
        lastRan = Date.now();
        func(...args);
    };

    return throttled;
};
