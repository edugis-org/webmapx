## Summary

Describe what changed and why.

## Architecture Contract Checklist

Reference: docs/developer/architecture-contract.md

- [ ] I reviewed this PR against docs/developer/architecture-contract.md.
- [ ] Runtime modules do not read tree semantics (`selectionMode`, `selectionGroup`, `allowNone`, `stackOrder`).
- [ ] Tool-only tree logic stays in tool components.
- [ ] No engine service policy was introduced (execution only).
- [ ] If interfaces/behavior changed, related docs were updated in the same PR.
- [ ] If a temporary exception is needed, it is documented in docs/developer/architecture-contract.md with owner and removal target.

## Validation

- [ ] `npm run check:architecture`
- [ ] `npm test`

## Risks / Follow-ups

List known risks or follow-up tasks.
