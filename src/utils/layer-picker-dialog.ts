import type { GpkgLayerInfo } from '../workers/spatial.worker';

/**
 * Show a dialog letting the user choose which layers to import from a multi-layer file.
 * Returns the selected layer names, or null if the user cancelled.
 */
export async function showLayerPickerDialog(
  filename: string,
  layers: GpkgLayerInfo[],
): Promise<string[] | null> {
  await import('@shoelace-style/shoelace/dist/components/dialog/dialog.js');
  await import('@shoelace-style/shoelace/dist/components/checkbox/checkbox.js');
  await import('@shoelace-style/shoelace/dist/components/button/button.js');

  return new Promise((resolve) => {
    const dialog = document.createElement('sl-dialog') as HTMLElement & { show(): void; hide(): void };
    dialog.setAttribute('label', `Import layers from ${filename}`);
    dialog.style.setProperty('--width', '28rem');

    const checkboxesHtml = layers
      .map(
        (l) =>
          `<sl-checkbox name="${l.name}" checked style="display:block;margin-bottom:0.4rem">` +
          `${l.name}` +
          (l.featureCount > 0
            ? ` <span style="color:var(--sl-color-neutral-400);font-size:0.85em">(${l.featureCount.toLocaleString()} features)</span>`
            : '') +
          `</sl-checkbox>`,
      )
      .join('');

    dialog.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.5rem">
        ${checkboxesHtml}
      </div>
      <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
        <sl-button variant="default" class="cancel-btn">Cancel</sl-button>
        <sl-button variant="primary" class="import-btn">Import</sl-button>
      </div>
    `;

    const finish = (result: string[] | null) => {
      dialog.hide();
      dialog.addEventListener('sl-after-hide', () => dialog.remove(), { once: true });
      resolve(result);
    };

    dialog.querySelector('.cancel-btn')!.addEventListener('click', () => finish(null));

    dialog.querySelector('.import-btn')!.addEventListener('click', () => {
      const checkboxes = Array.from(dialog.querySelectorAll('sl-checkbox'));
      const selected = checkboxes
        .filter((cb) => (cb as HTMLElement & { checked: boolean }).checked)
        .map((cb) => (cb as HTMLElement).getAttribute('name')!);
      finish(selected.length > 0 ? selected : null);
    });

    document.body.appendChild(dialog);
    dialog.show();
  });
}
