import test from 'node:test';
import assert from 'node:assert/strict';

import { ToolManager } from '../src/tools/tool-manager.ts';
import type { IModalTool } from '../src/tools/IModalTool.ts';
import type { MapStateStore } from '../src/store/map-state-store.ts';

class FakeTool implements IModalTool {
  readonly isModal = true;
  renderTarget?: string;
  private _active = false;
  transitions: string[] = [];

  constructor(readonly toolId: string) {}

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    if (this._active === value) {
      return;
    }

    this._active = value;
    this.transitions.push(value ? 'activate' : 'deactivate');
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }
}

class FakeStore {
  dispatches: Array<{ newState: unknown; source: string }> = [];

  dispatch(newState: unknown, source: string): void {
    this.dispatches.push({ newState, source });
  }
}

test('ToolManager deactivates the previous modal tool once before activating the next one', () => {
  const manager = new ToolManager();
  const store = new FakeStore();
  manager.setStore(store as unknown as MapStateStore);

  const measure = new FakeTool('measure');
  const search = new FakeTool('search');
  manager.register(measure);
  manager.register(search);

  const events: string[] = [];
  manager.addEventListener('webmapx-tool-activated', (event) => {
    events.push(`activate:${(event as CustomEvent).detail.toolId}`);
  });
  manager.addEventListener('webmapx-tool-deactivated', (event) => {
    events.push(`deactivate:${(event as CustomEvent).detail.toolId}`);
  });

  assert.equal(manager.activate('measure'), true);
  assert.equal(manager.activate('search'), true);

  assert.equal(manager.activeToolId, 'search');
  assert.equal(measure.active, false);
  assert.equal(search.active, true);
  assert.deepEqual(measure.transitions, ['activate', 'deactivate']);
  assert.deepEqual(search.transitions, ['activate']);
  assert.deepEqual(events, ['activate:measure', 'deactivate:measure', 'activate:search']);
  assert.deepEqual(store.dispatches, [
    { newState: { activeTool: { toolId: 'measure' } }, source: 'UI' },
    { newState: { activeTool: null }, source: 'UI' },
    { newState: { activeTool: { toolId: 'search' } }, source: 'UI' },
  ]);
});

test('ToolManager deactivates the active tool once and clears activeTool state', () => {
  const manager = new ToolManager();
  const store = new FakeStore();
  manager.setStore(store as unknown as MapStateStore);

  const measure = new FakeTool('measure');
  manager.register(measure);

  const events: string[] = [];
  manager.addEventListener('webmapx-tool-deactivated', (event) => {
    events.push(`deactivate:${(event as CustomEvent).detail.toolId}`);
  });

  manager.activate('measure');
  manager.deactivate('measure');

  assert.equal(manager.activeToolId, null);
  assert.equal(measure.active, false);
  assert.deepEqual(measure.transitions, ['activate', 'deactivate']);
  assert.deepEqual(events, ['deactivate:measure']);
  assert.deepEqual(store.dispatches, [
    { newState: { activeTool: { toolId: 'measure' } }, source: 'UI' },
    { newState: { activeTool: null }, source: 'UI' },
  ]);
});
