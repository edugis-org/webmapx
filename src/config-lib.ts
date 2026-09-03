/**
 * WebMapX config-tools entry point — validation without a browser.
 *
 * Separate from `lib.ts` on purpose. That entry is the app: it pulls in Lit,
 * Shoelace, the stylesheets and every component, none of which a config check
 * needs and none of which loads in a bare Node process. Anything that wants to
 * check a config — a config repository's CI, the EduGIS converter, an editor —
 * imports this instead, and gets the same validator the app itself runs at load
 * time rather than a second implementation that drifts.
 *
 * The config schema version is 0 and says so out loud: nothing is promised
 * about it yet. It exists at the floor because a version can be bumped and
 * never unbumped, and because 1 should be free to mean the schema release 1
 * actually supports. Migrations belong with that release, not with this entry.
 */

export { validateConfig } from './config/validator.js';
export type {
  ValidationMessage,
  ValidationResult,
  ValidationSeverity,
} from './config/validator.js';

/**
 * The tool registry, so a checker can answer "does this build have that tool?"
 * for itself — which is the question a config repository asks when its configs
 * are validated against several app versions.
 */
export {
  KNOWN_TOOLS,
  TOOL_REGISTRY,
  canonicalToolId,
} from './tools/tool-registry.js';
export type { ToolPlacement, ToolRegistryEntry } from './tools/tool-registry.js';

/**
 * The computed layers a config may name in an `internalfunc://` url, described
 * rather than executed. The documentation build reads this to render its
 * reference, so the list can be checked against a version the same way the tool
 * registry is — and the generators themselves, with their astronomy and their
 * plate data, stay out of a config checker.
 */
export { INTERNAL_SOURCE_DOCS, INTERNAL_SOURCE_CATEGORIES } from './utils/internal-source-catalog.js';
export type { InternalSourceDoc, InternalSourceParamDoc } from './utils/internal-source-catalog.js';

export { CONFIG_SCHEMA_VERSION, configVersionStatus } from './config/schema-version.js';
export type { ConfigVersionStatus } from './config/schema-version.js';

export type { AppConfig } from './config/types.js';
