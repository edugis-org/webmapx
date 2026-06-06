# Architecture Contract

Status: normative, enforce in all new changes
Version: 1.0
Last updated: 2026-05-31

## Purpose

This document defines non-negotiable architecture boundaries for WebMapX.
All changes MUST be checked against this contract.

Use RFC keywords as defined here:
- MUST / MUST NOT: hard requirement
- SHOULD / SHOULD NOT: strong default, exceptions require explicit note

## Canonical Terms

- LayerData: runtime map layer data model only.
- LayerData.sources: source definitions used by runtime resolver.
- LayerData.layers: layer definitions used by runtime resolver.
- LayerTreeConfig: tool-only tree structure and UI behavior.

LayerTreeConfig MUST NOT be required for runtime layer resolution.

## Boundary Rules

### 1. Runtime Resolver Boundary

Runtime resolution MUST use only LayerData.
Runtime modules MUST NOT read tree semantics.

Tree semantics include:
- selectionMode
- selectionGroup
- allowNone
- stackOrder

### 2. Tool Boundary

Tree parsing and tree-driven interaction MUST live in tool components.
Layer tree behavior MAY emit concrete add/remove/order actions to runtime.

### 3. Adapter Boundary

Adapters MUST stay thin:
- translate engine APIs
- expose normalized interfaces/events

Adapters MUST NOT contain tool policy, tree logic, or business orchestration.

### 4. Engine Service Boundary

Engine layer services MUST execute placement and rendering only.
Placement policy decisions MUST live outside engine services.

Engine services MUST NOT call `registerMapLayer` or `unregisterMapLayer`.
Generic layer bookkeeping is owned by `BaseAdapter` (`src/map/base-adapter.ts`),
which wraps every `addLayer` / `removeLayer` / `removeSource` call and updates
`store.mapLayers` based on the engine's boolean return value.

Engine core services MUST return `boolean` from `addLayer`: `true` = layer was
accepted and added to the engine, `false` = engine rejected it (missing source,
map not ready, etc.).

## Allowed And Forbidden Dependencies

### Runtime Orchestration (`src/components/webmapx-map.ts`, `src/map/**`)

Allowed:
- LayerData types and runtime state
- engine-neutral resolver/executor interfaces

Forbidden:
- LayerTreeConfig fields
- tree traversal for runtime policy
- direct tool-specific policy fields

### Tool Layer Components (`src/components/webmapx-layer-tree.ts`, other tool UIs)

Allowed:
- LayerTreeConfig
- tool UX semantics (single/multi selection, group behavior)

Forbidden:
- engine-specific rendering internals

### Engine Implementations (`src/map/*-services/**`)

Allowed:
- execution of add/remove/reorder as commanded

Forbidden:
- deriving policy from tree structure
- introducing orchestration-level slot policy

## Required PR Checks

Each PR MUST include:

1. Architecture impact note
- Which contract rules are touched.
- Why behavior remains compliant.

2. Boundary self-check
- Confirm no forbidden dependency was added.

3. Tests or justification
- Add/adjust tests for changed policy boundaries, or explain why not needed.

4. Docs sync
- If contracts/interfaces changed, update developer docs in the same PR.

## CI Gate Checklist

Implement these checks in CI (or local pre-merge) and fail on violation.

1. Static forbidden-usage scans
- Detect runtime usage of tree semantics outside tool modules.
- Detect runtime imports of tool-tree modules (`webmapx-layer-tree`, `layer-panel-model`) outside allowlisted exceptions.

2. Dependency rules
- Runtime modules cannot import tool-only tree config types.

3. Contract checklist in PR template
- Required checkbox section: pass/fail with links to files.

4. Optional architecture test suite
- Behavioral tests for policy boundaries (runtime works without tree config).

## Example Guardrail Patterns

- Runtime files SHOULD depend on `LayerData` types, not tree node types.
- Tool files MAY depend on tree node types and convert user interaction into explicit runtime operations.
- Engine services SHOULD accept resolved runtime instructions, not infer intent from UI metadata.

## Transitional Exceptions (Temporary)

Known debt MUST be listed here with an owner and removal target.
No new exceptions may be added without explicit approval.

Current known exceptions:
- Runtime map host still reads tree semantics for selection grouping and slot behavior.
- Layer overview docs still describe `catalog.tree`-driven grouping.

These exceptions do NOT permit extending this pattern.
Only reduction/removal is allowed.

## Definition Of Done For Architecture Compliance

A change is architecture-complete only if:
- code passes boundary checks
- tests pass
- docs are updated where interfaces/behavior changed
- no new temporary exceptions were introduced
