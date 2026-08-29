// src/config/schema-version.ts
//
// The config schema version this build understands.
//
// It is 0, and 0 is a statement: the schema is not stable yet, and no
// compatibility is promised for it. webmapx is pre-1.0, configs are still all
// ours, and a tool can still be renamed as long as the configs are renamed with
// it. The number exists now anyway because a version can be bumped and never
// unbumped — starting at the floor keeps every number above it available, and
// leaves 1 free to mean the schema that release 1 actually promises to support.
//
// The `"version": 1` some older config files carry predates this and means
// nothing; those files are being rewritten to 0. A config claiming a version
// this build does not know is a warning, never an error — it should still
// produce a working map, one feature short.

/** Schema version this build reads and writes. */
export const CONFIG_SCHEMA_VERSION = 0;

/** How a config's declared version relates to this build. */
export type ConfigVersionStatus = 'current' | 'older' | 'newer' | 'missing' | 'invalid';

/**
 * Classifies a config's `version` field.
 *
 * `missing` is not a problem: versioning starts here, so a config written
 * before it says nothing and is read as the current schema. Migrating an
 * `older` config is not implemented yet — there is nothing to migrate from.
 */
export function configVersionStatus(version: unknown): ConfigVersionStatus {
    if (version === undefined || version === null) return 'missing';
    if (typeof version !== 'number' || !Number.isFinite(version)) return 'invalid';
    if (version > CONFIG_SCHEMA_VERSION) return 'newer';
    if (version < CONFIG_SCHEMA_VERSION) return 'older';
    return 'current';
}
