export type ToolSelectEventDetail = {
  toolId?: string | null;
  previousToolId?: string | null;
  sourceToolbar?: EventTarget | null;
};

/**
 * The id a tool element is addressed by in `webmapx-tool-select` events: the `tool-id`
 * attribute (how dynamic-layout.ts instantiates every config-driven tool), `data-tool`/
 * `name` as hand-authored alternatives, and finally the `toolId` JS property for an
 * element that had it set directly rather than through an attribute (Lit's `@property`
 * does not reflect a property write back to the attribute by default, so `getAttribute`
 * alone misses that case). One copy, so every caller that needs to identify a tool
 * element — the panel that owns it, or another tool addressing it from the outside —
 * agrees on the same rules instead of drifting.
 */
export function resolveToolId(element: Element): string | null {
  const attrToolId =
    element.getAttribute('tool-id') ||
    element.getAttribute('data-tool') ||
    element.getAttribute('name');
  if (attrToolId) return attrToolId;
  const propertyToolId = (element as { toolId?: unknown }).toolId;
  if (typeof propertyToolId === 'string' && propertyToolId) {
    return propertyToolId;
  }
  return null;
}

export function toolbarOwnsTool(toolIds: string[], toolId: string | null | undefined): boolean {
  return Boolean(toolId && toolIds.includes(toolId));
}

export function isToolSelectFromDifferentToolbar(
  detail: ToolSelectEventDetail,
  ownToolbar: EventTarget | null
): boolean {
  return Boolean(detail.sourceToolbar && ownToolbar && detail.sourceToolbar !== ownToolbar);
}

export function resolveToolbarSelectionState(params: {
  toolIds: string[];
  currentActiveToolId: string | null;
  detail: ToolSelectEventDetail;
  ownToolbar: EventTarget | null;
}): string | null | undefined {
  const { toolIds, detail, ownToolbar } = params;

  if (isToolSelectFromDifferentToolbar(detail, ownToolbar)) {
    return undefined;
  }

  if (detail.toolId) {
    return toolbarOwnsTool(toolIds, detail.toolId) ? detail.toolId : undefined;
  }

  if (detail.previousToolId) {
    return toolbarOwnsTool(toolIds, detail.previousToolId) ? null : undefined;
  }

  return detail.toolId === null ? null : undefined;
}
