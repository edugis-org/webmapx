# Creating Modal Tools

This guide explains how to create modal tools in WebMapX using the `WebmapxModalTool` base class.

## What is a Modal Tool?

Modal tools are **exclusive** - only one can be active at a time. When you activate a modal tool, any other active modal tool is automatically deactivated. Examples include:

- **Measure tool** - captures clicks to measure distances
- **Feature info tool** - captures clicks to query features
- **Drawing tools** - capture clicks/drags to create geometries

In contrast, **passive tools** (like coordinates display, zoom level) can run simultaneously and don't capture events exclusively.

## Quick Start

1. Create a new file extending `WebmapxModalTool`
2. Set a unique `toolId`
3. Override `onActivate()` and `onDeactivate()` for lifecycle
4. Implement your `render()` method

```typescript
import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';

@customElement('my-custom-tool')
export class MyCustomTool extends WebmapxModalTool {
    // Required: unique identifier
    readonly toolId = 'my-custom-tool';

    // Tool state
    @state() private data: string = '';

    protected onActivate(): void {
        // Subscribe to events, create layers, etc.
    }

    protected onDeactivate(): void {
        // Cleanup: unsubscribe, remove layers, etc.
    }

    protected render(): TemplateResult {
        return html`
            <div class="tool-content">
                <!-- Your UI here -->
            </div>
        `;
    }
}
```

## Base Class API

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `toolId` | `string` (abstract) | Unique identifier for the tool |
| `isModal` | `boolean` | Always `true` for modal tools |
| `active` | `boolean` | Whether the tool is currently active |
| `renderTarget` | `string?` | Optional CSS selector for portal rendering |

### Lifecycle Hooks

```typescript
// Called when map adapter is attached (tool can access map)
protected onMapAttached(adapter: IMapAdapter): void

// Called when map adapter is detached
protected onMapDetached(): void

// Called when tool becomes active
protected onActivate(): void

// Called when tool becomes inactive
protected onDeactivate(): void
```

### Methods

```typescript
// Activate this tool (prefer using ToolManager)
activate(): void

// Deactivate this tool
deactivate(): void

// Toggle active state
toggle(): void
```

### Inherited from WebmapxBaseTool

```typescript
// Access the map adapter
protected adapter: IMapAdapter | null

// Access the state store
protected store: MapStateStore | null

// Access the parent map element
protected get mapHost(): WebmapxMapElement | null

// Access configuration
protected get config(): AppConfig | null
protected get toolsConfig(): ToolsConfig | undefined
```

## Common Patterns

### Subscribing to Map Events

```typescript
private unsubClick: (() => void) | null = null;

protected onActivate(): void {
    if (this.adapter) {
        this.unsubClick = this.adapter.events.on('click', this.handleClick.bind(this));
    }
}

protected onDeactivate(): void {
    this.unsubClick?.();
    this.unsubClick = null;
}

private handleClick(event: ClickEvent): void {
    console.log('Clicked at:', event.coords);
}
```

### Creating Visualization Layers

```typescript
private layersCreated = false;

protected onActivate(): void {
    if (!this.layersCreated) {
        this.dispatchEvent(new CustomEvent('webmapx-add-source', {
            detail: { id: 'my-source', config: { type: 'geojson', data: myGeoJSON } },
            bubbles: true, composed: true
        }));

        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: { id: 'my-layer', type: 'circle', source: 'my-source', paint: {...} },
            bubbles: true, composed: true
        }));

        this.layersCreated = true;
    }
}

protected onDeactivate(): void {
    if (this.layersCreated) {
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', {
            detail: 'my-layer', bubbles: true, composed: true
        }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-source', {
            detail: 'my-source', bubbles: true, composed: true
        }));
        this.layersCreated = false;
    }
}
```

### Handling Keyboard Shortcuts

```typescript
private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

protected onActivate(): void {
    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);
}

protected onDeactivate(): void {
    if (this.keydownHandler) {
        document.removeEventListener('keydown', this.keydownHandler);
        this.keydownHandler = null;
    }
}

private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        this.deactivate();
    }
}
```

### Emitting Tool-Specific Events

```typescript
protected onActivate(): void {
    this.dispatchEvent(new CustomEvent('webmapx-mytool-activate', {
        bubbles: true,
        composed: true,
        detail: { toolId: this.toolId }
    }));
}
```

## Render Target (Portal Rendering)

By default, your tool renders where it's placed in the DOM. Using `render-target`, you can render the tool's content to a different location:

```html
<!-- Tool element can be anywhere -->
<webmapx-measure-tool render-target="#my-sidebar"></webmapx-measure-tool>

<!-- Content will be rendered here -->
<div id="my-sidebar"></div>
```

**Important:** For portal rendering to work, wrap your content in an element with `class="tool-content"`:

```typescript
protected render(): TemplateResult {
    return html`
        <div class="tool-content">
            <!-- This content can be portaled -->
        </div>
    `;
}
```

## Integration with Toolbar

Add a button in the toolbar with a matching `name` attribute:

```html
<webmapx-toolbar>
    <sl-button name="my-custom-tool">My Tool</sl-button>
</webmapx-toolbar>
```

The toolbar automatically:
- Calls `toolManager.toggle('my-custom-tool')` on click
- Syncs button active states based on tool events

## Full Example

See `src/components/modules/webmapx-example-tool.ts` for a complete, well-documented example.
