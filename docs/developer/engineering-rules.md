# Engineering Rules

Short checklist for changes in WebMapX. Use this as the default bar before adding features or refactoring behavior.

## Core Rules

1. Keep one source of truth per concern.
   Adapter selection, active tool state, and config precedence should each be defined once and reused everywhere.

2. Be explicit in multi-map scenarios.
   Single-map fallbacks are acceptable only when there is exactly one `<webmapx-map>` on the page. If multiple maps exist, components should use `map="#selector"` or an equivalent explicit binding.

3. Prefer small testable helpers over hidden component logic.
   If behavior is really precedence or policy, move it into a plain helper module and test that directly.

4. Keep adapters thin.
   Adapters translate engine APIs and emit normalized behavior. Composite logic, orchestration, throttling, and UI-driven policy belong in tools or shared helpers.

5. Treat docs as part of the implementation.
   If runtime behavior changes, update the docs in the same change. Do not let architecture docs describe behavior that no longer exists.

6. Test policy boundaries first.
   The highest-value tests in this repo are around:
   - adapter/config precedence
   - map scoping
   - modal tool transitions
   - store update semantics

7. Preserve pragmatic fallbacks, but make them narrow.
   Convenience behavior is acceptable when it is deterministic and low-risk. Broad global fallbacks that silently bind to the wrong map are not.

8. Avoid broad refactors when a policy fix will do.
   If the problem is precedence, scoping, or event ownership, fix that policy directly instead of rewriting unrelated structure.

## Working Checklist

- Does this change introduce a second source of truth for existing behavior?
- Does it behave correctly when the page contains more than one map?
- Does it require an update to docs or examples?
- Is the behavior covered by an automated test, or is there a clear reason not to add one?
- Did the change keep engine-specific logic inside adapters and app logic outside them?
- If a fallback exists, is it constrained enough to avoid binding to the wrong map?

## Current Project Notes

- Adapter selection is map-scoped and should respect saved user choice before static markup defaults.
- `activeTool` is intentionally generic: `activeTool: { toolId: string } | null`.
- The remaining large production chunk is `vendor-maplibre-core`; treat it as a library tradeoff unless you intentionally change how MapLibre is loaded.
