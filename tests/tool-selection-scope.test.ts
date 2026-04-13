import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isToolSelectFromDifferentToolbar,
  resolveToolbarSelectionState,
  toolbarOwnsTool,
  type ToolSelectEventDetail
} from '../src/components/modules/tool-selection-scope.ts';

test('toolbarOwnsTool only matches tools that belong to the toolbar', () => {
  assert.equal(toolbarOwnsTool(['layers', 'search'], 'layers'), true);
  assert.equal(toolbarOwnsTool(['layers', 'search'], 'legend'), false);
  assert.equal(toolbarOwnsTool(['layers', 'search'], null), false);
});

test('select events from another toolbar are ignored', () => {
  const ownToolbar = new EventTarget();
  const otherToolbar = new EventTarget();
  const detail: ToolSelectEventDetail = {
    toolId: 'layers',
    sourceToolbar: otherToolbar
  };

  assert.equal(isToolSelectFromDifferentToolbar(detail, ownToolbar), true);
  assert.equal(resolveToolbarSelectionState({
    toolIds: ['legend'],
    currentActiveToolId: 'legend',
    detail,
    ownToolbar
  }), undefined);
});

test('programmatic legend activation and deactivation resolve to button state changes', () => {
  const ownToolbar = new EventTarget();

  assert.equal(resolveToolbarSelectionState({
    toolIds: ['legend'],
    currentActiveToolId: null,
    detail: { toolId: 'legend' },
    ownToolbar
  }), 'legend');

  assert.equal(resolveToolbarSelectionState({
    toolIds: ['legend'],
    currentActiveToolId: 'legend',
    detail: { toolId: null, previousToolId: 'legend' },
    ownToolbar
  }), null);
});
