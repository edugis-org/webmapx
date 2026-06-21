/**
 * Config-edit mode detection.
 *
 * ?configedit= or ?configedit.0= enables authoring tools for the first <webmapx-map>
 * in DOM order; ?configedit.1= for the second, etc.
 *
 * This is an authoring/developer-only flag — NOT a permalink or distribution parameter.
 * Tools injected in this mode must be stripped when the config is saved/downloaded.
 */
const PARAM = 'configedit';

function isTruthy(value: string | null): boolean {
    return value !== null && value !== '' && value !== 'false' && value !== '0';
}

/**
 * Returns true when config-edit mode is active for the map at DOM index i.
 * ?configedit.i= takes precedence over ?configedit= (for index 0 only).
 */
export function isConfigEditEnabled(index: number): boolean {
    const params = new URLSearchParams(window.location.search);
    const explicit = params.get(`${PARAM}.${index}`);
    if (explicit !== null) return isTruthy(explicit);
    if (index === 0) return isTruthy(params.get(PARAM));
    return false;
}
