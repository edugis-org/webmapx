export type ToolSelectEventDetail = {
  toolId?: string | null;
  previousToolId?: string | null;
  sourceToolbar?: EventTarget | null;
};

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
