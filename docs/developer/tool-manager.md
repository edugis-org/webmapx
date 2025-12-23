# ToolManager

The ToolManager is the central coordinator for modal tools in WebMapX. It handles tool registration, activation, and ensures mutual exclusion (only one modal tool active at a time).

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ToolManager                              │
│  - Registers tools automatically                            │
│  - Manages mutual exclusion                                 │
│  - Dispatches activation/deactivation events                │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    Toolbar              Tab Click            Keyboard
    Button               Handler              Shortcut
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                   toolManager.toggle('measure')
```

## Accessing ToolManager

The ToolManager is accessed via the `webmapx-map` element:

```javascript
const map = document.querySelector('webmapx-map');
const toolManager = map.toolManager;
```

## API Reference

### Methods

#### `register(tool: IModalTool): void`

Register a tool with the manager. **Tools auto-register when attached to the map**, so you typically don't call this directly.

```typescript
toolManager.register(myTool);
```

#### `unregister(toolId: string): void`

Unregister a tool. **Tools auto-unregister when detached**, so you typically don't call this directly.

```typescript
toolManager.unregister('my-tool');
```

#### `activate(toolId: string): boolean`

Activate a tool by ID. Returns `true` if successful, `false` if tool not found.

```typescript
toolManager.activate('measure');
```

- If another modal tool is active, it will be deactivated first
- Dispatches `webmapx-tool-activated` event
- Updates `activeTool` in state store

#### `deactivate(toolId?: string): void`

Deactivate a tool. If no toolId provided, deactivates the currently active tool.

```typescript
toolManager.deactivate();           // Deactivate current
toolManager.deactivate('measure');  // Deactivate specific
```

- Dispatches `webmapx-tool-deactivated` event
- Updates `activeTool` in state store to `null`

#### `toggle(toolId: string): boolean`

Toggle a tool on/off. Returns `true` if now active, `false` if now inactive.

```typescript
const isActive = toolManager.toggle('measure');
```

### Properties

#### `activeTool: IModalTool | null`

Get the currently active tool instance.

```typescript
const tool = toolManager.activeTool;
if (tool) {
    console.log('Active tool:', tool.toolId);
}
```

#### `activeToolId: string | null`

Get the ID of the currently active tool.

```typescript
if (toolManager.activeToolId === 'measure') {
    console.log('Measure tool is active');
}
```

#### `getTool(toolId: string): IModalTool | undefined`

Get a registered tool by ID.

```typescript
const measureTool = toolManager.getTool('measure');
```

#### `getToolIds(): string[]`

Get all registered tool IDs.

```typescript
const tools = toolManager.getToolIds();
// ['measure', 'feature-info', ...]
```

## Events

ToolManager dispatches events that bubble up through the map element:

### `webmapx-tool-activated`

Fired when a tool is activated.

```javascript
map.addEventListener('webmapx-tool-activated', (e) => {
    console.log('Tool activated:', e.detail.toolId);
    console.log('Tool instance:', e.detail.tool);
});
```

**Event detail:**
```typescript
{
    toolId: string,
    tool: IModalTool
}
```

### `webmapx-tool-deactivated`

Fired when a tool is deactivated.

```javascript
map.addEventListener('webmapx-tool-deactivated', (e) => {
    console.log('Tool deactivated:', e.detail.toolId);
});
```

**Event detail:**
```typescript
{
    toolId: string,
    tool: IModalTool
}
```

## Integration Examples

### With Toolbar Buttons

The toolbar component automatically integrates with ToolManager:

```html
<webmapx-toolbar>
    <sl-button name="measure">Measure</sl-button>
    <sl-button name="info">Info</sl-button>
</webmapx-toolbar>
```

### With Tabs

```javascript
const tabs = document.querySelectorAll('.tool-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const toolId = tab.dataset.tool;
        map.toolManager.activate(toolId);
    });
});

// Sync tab state with tool events
map.addEventListener('webmapx-tool-activated', (e) => {
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tool === e.detail.toolId);
    });
});
```

### With Keyboard Shortcuts

```javascript
document.addEventListener('keydown', (e) => {
    if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
        map.toolManager.toggle('measure');
    }
    if (e.key === 'i' && !e.ctrlKey && !e.metaKey) {
        map.toolManager.toggle('info');
    }
    if (e.key === 'Escape') {
        map.toolManager.deactivate();
    }
});
```

### With Tool Panel Visibility

```javascript
const panel = document.querySelector('webmapx-tool-panel');

map.addEventListener('webmapx-tool-activated', (e) => {
    panel.active = true;
    panel.label = e.detail.toolId;
});

map.addEventListener('webmapx-tool-deactivated', () => {
    if (!map.toolManager.activeToolId) {
        panel.active = false;
    }
});
```

## State Store Integration

ToolManager automatically updates the `activeTool` property in the state store:

```typescript
// When tool is activated
store.dispatch({ activeTool: 'measure' }, 'UI');

// When tool is deactivated
store.dispatch({ activeTool: null }, 'UI');
```

This allows passive tools to check if a modal tool is active:

```typescript
protected onStateChanged(state: IAppState): void {
    if (state.activeTool) {
        // A modal tool is active, maybe reduce updates
    }
}
```
