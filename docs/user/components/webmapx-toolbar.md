# Webmapx Toolbar

The `<webmapx-toolbar>` component is a container for tool buttons. It manages the selection state of buttons and emits events when tools are activated or deactivated.

## Features

- **Selection Management**: Automatically handles the visual state (active/inactive) of buttons.
- **Toggle Logic**: Clicking an active button deactivates it. Clicking a different button switches the active tool.
- **Orientation Support**: Can be displayed vertically or horizontally (controlled by the parent `<webmapx-control-group>` or manually).
- **Slot-based**: Accepts any button elements (e.g., `<sl-button>`) as children.

## Usage

```html
<webmapx-toolbar id="main-toolbar">
    <sl-button name="layers" circle>
        <sl-icon name="layers"></sl-icon>
    </sl-button>
    <sl-button name="settings" circle>
        <sl-icon name="gear"></sl-icon>
    </sl-button>
</webmapx-toolbar>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `orientation` | `vertical` \| `horizontal` | `vertical` | Controls the flex direction of the buttons. Usually set automatically by `<webmapx-control-group>`. |

## Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| `webmapx-tool-select` | `{ toolId: string \| null }` | Fired when a tool button is clicked. `toolId` corresponds to the `name` or `data-tool` attribute of the button. If a tool is deactivated, `toolId` is `null`. |

## Integration

The toolbar relies on the `name` or `data-tool` attribute of its children to identify tools. When used with `<webmapx-tool-panel>`, make sure the panel child sets a matching `tool-id`.

```html
<sl-button name="my-tool">...</sl-button>
<webmapx-tool-panel>
    <my-tool-element tool-id="my-tool"></my-tool-element>
</webmapx-tool-panel>
```
