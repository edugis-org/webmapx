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
export const throttle = (func: (...args: any[]) => void, limit: number) => {
    let lastFunc: ReturnType<typeof setTimeout> | null = null;
    let lastRan = 0;

    return function(this: any, ...args: any[]) {
        const context = this;
        const now = Date.now();
        const elapsed = now - lastRan;

        if (elapsed >= limit) {
            if (lastFunc) {
                clearTimeout(lastFunc);
                lastFunc = null;
            }
            lastRan = now;
            func.apply(context, args);
            return;
        }

        if (lastFunc) {
            clearTimeout(lastFunc);
        }
        lastFunc = setTimeout(() => {
            lastFunc = null;
            lastRan = Date.now();
            func.apply(context, args);
        }, limit - elapsed);
    } as (...args: any[]) => void;
};
