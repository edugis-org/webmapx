const LARGE_FILE_WARN_BYTES = 20 * 1024 * 1024; // 20 MB

/** Ask the user whether to proceed with a large file. Returns true = proceed. */
export async function confirmLargeFile(filename: string, sizeBytes: number): Promise<boolean> {
  if (sizeBytes < LARGE_FILE_WARN_BYTES) return true;

  await import('@shoelace-style/shoelace/dist/components/dialog/dialog.js');
  await import('@shoelace-style/shoelace/dist/components/button/button.js');

  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(0);

  return new Promise<boolean>((resolve) => {
    const dialog = document.createElement('sl-dialog') as HTMLElement & { show(): void; hide(): void };
    dialog.setAttribute('label', 'Large file');
    dialog.style.setProperty('--width', '26rem');

    dialog.innerHTML = `
      <p style="margin:0 0 0.75rem">
        <strong>${filename}</strong> is ${sizeMb} MB.
        Large GeoPackages may take a long time to convert and could crash the browser tab.
      </p>
      <p style="margin:0">Continue with the import?</p>
      <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
        <sl-button variant="default" class="no-btn">Cancel</sl-button>
        <sl-button variant="primary" class="yes-btn">Continue</sl-button>
      </div>
    `;

    const finish = (result: boolean) => {
      dialog.hide();
      dialog.addEventListener('sl-after-hide', () => dialog.remove(), { once: true });
      resolve(result);
    };

    dialog.querySelector('.no-btn')!.addEventListener('click', () => finish(false));
    dialog.querySelector('.yes-btn')!.addEventListener('click', () => finish(true));

    document.body.appendChild(dialog);
    dialog.show();
  });
}

export interface ProgressHandle {
  setStep(message: string): void;
  readonly cancelled: boolean;
  close(): void;
}

/** Non-modal import status card (bottom-right). Shows spinner, step text, cancel button. */
export function showGdalProgress(filename: string, onCancel?: () => void): ProgressHandle {
  const card = document.createElement('div');
  card.style.cssText = [
    'position:fixed',
    'bottom:1.25rem',
    'right:1.25rem',
    'z-index:9999',
    'background:var(--sl-panel-background-color,#fff)',
    'border:1px solid var(--sl-color-neutral-200,#e2e8f0)',
    'border-radius:var(--sl-border-radius-medium,0.375rem)',
    'box-shadow:var(--sl-shadow-large,0 4px 16px rgba(0,0,0,.15))',
    'padding:0.9rem 1.1rem',
    'min-width:18rem',
    'max-width:24rem',
    'overflow:hidden',
    'font-family:var(--sl-font-sans,sans-serif)',
    'font-size:0.875rem',
    'color:var(--sl-color-neutral-900,#1a202c)',
  ].join(';');

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
      <strong style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:16rem"
              title="${filename}">${filename}</strong>
      <button class="cancel-btn" style="
        background:none;border:none;cursor:pointer;padding:0.1rem 0.3rem;
        color:var(--sl-color-neutral-500,#718096);font-size:0.8rem;white-space:nowrap;margin-left:0.5rem
      ">Cancel</button>
    </div>
    <div style="display:flex;align-items:center;gap:0.5rem">
      <span class="spinner" style="
        display:inline-block;width:1em;height:1em;border:2px solid var(--sl-color-neutral-300,#cbd5e0);
        border-top-color:var(--sl-color-primary-600,#3b82f6);border-radius:50%;
        animation:gdal-spin 0.7s linear infinite;flex-shrink:0
      "></span>
      <span class="step-label">Starting…</span>
    </div>
    <style>@keyframes gdal-spin{to{transform:rotate(360deg)}}</style>
  `;

  document.body.appendChild(card);

  let cancelled = false;
  const stepLabel = card.querySelector('.step-label') as HTMLElement;

  card.querySelector('.cancel-btn')!.addEventListener('click', () => {
    cancelled = true;
    stepLabel.textContent = 'Cancelling…';
    (card.querySelector('.cancel-btn') as HTMLElement).setAttribute('disabled', '');
    onCancel?.();
  });

  return {
    setStep(message: string) { stepLabel.textContent = message; },
    get cancelled() { return cancelled; },
    close() { card.remove(); },
  };
}
