/**
 * Injects the config-edit toolbar button (and its settings-tool sibling) into a map.
 * Finds an existing top-left toolbar or creates one. Idempotent — safe to call multiple times.
 * Shared by the demo app bootstrap (src/app.js) and the embeddable WebMapX.mount API so both
 * entry points behave identically instead of maintaining separate copies.
 */
export async function injectConfigEditTool(mapEl: Element): Promise<void> {
    await import('../components/webmapx-config-edit-tool.js');

    let layout = mapEl.querySelector('webmapx-layout') as HTMLElement | null;
    if (!layout) {
        layout = document.createElement('webmapx-layout');
        mapEl.appendChild(layout);
    }

    let group = layout.querySelector('webmapx-control-group[slot="top-left"]') as HTMLElement | null;
    let toolbar = group?.querySelector('webmapx-toolbar') as HTMLElement | null;
    let panel = group?.querySelector('webmapx-tool-panel') as HTMLElement | null;

    if (!group) {
        group = document.createElement('webmapx-control-group');
        group.setAttribute('slot', 'top-left');
        group.setAttribute('orientation', 'vertical');
        group.setAttribute('panel-position', 'after');
        toolbar = document.createElement('webmapx-toolbar');
        panel = document.createElement('webmapx-tool-panel');
        group.appendChild(toolbar);
        group.appendChild(panel);
        layout.appendChild(group);
    }
    if (!toolbar) {
        toolbar = document.createElement('webmapx-toolbar');
        group.prepend(toolbar);
    }
    if (!panel) {
        panel = document.createElement('webmapx-tool-panel');
        group.appendChild(panel);
    }

    // Add settings button if not already present
    if (!toolbar.querySelector('[name="settings"]')) {
        await import('../components/webmapx-settings.js');
        const btn = document.createElement('sl-button');
        btn.setAttribute('name', 'settings');
        btn.setAttribute('circle', '');
        btn.title = 'Settings';
        btn.innerHTML = '<sl-icon name="gear"></sl-icon>';
        toolbar.appendChild(btn);

        const tool = document.createElement('webmapx-settings');
        tool.setAttribute('tool-id', 'settings');
        panel.appendChild(tool);
    }

    // Add config-edit button if not already present
    if (!toolbar.querySelector('[name="configedit"]')) {
        const btn = document.createElement('sl-button');
        btn.setAttribute('name', 'configedit');
        btn.setAttribute('circle', '');
        btn.title = 'Edit config';
        btn.innerHTML = '<sl-icon name="pencil-square"></sl-icon>';
        toolbar.appendChild(btn);

        const tool = document.createElement('webmapx-config-edit-tool');
        tool.setAttribute('tool-id', 'configedit');
        panel.appendChild(tool);
    }
}
