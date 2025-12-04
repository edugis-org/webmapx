// src/utils/throttle.ts

/**
 * Ensures a function is called at most once per defined time interval.
 * This is critical for rate-limiting expensive map API calls during continuous 
 * UI interactions (e.g., dragging a slider).
 * * @param func The function to throttle.
 * @param limit The time limit in milliseconds.
 * @returns A throttled version of the function.
 */
export const throttle = (func: (...args: any[]) => void, limit: number) => {
    let lastFunc: ReturnType<typeof setTimeout> | null;
    let lastRan: number;

    return function(this: any, ...args: any[]) {
        const context = this;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            if (lastFunc) {
                clearTimeout(lastFunc);
            }
            lastFunc = setTimeout(() => {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    } as (...args: any[]) => void;
};