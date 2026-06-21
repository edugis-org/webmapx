/**
 * Show a Shoelace toast notification. Lazily imports sl-alert and sl-icon
 * so the components are only loaded when actually needed.
 */
export async function showToast(
  message: string,
  options: {
    variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger';
    icon?: string;
    duration?: number;
    closable?: boolean;
  } = {},
): Promise<void> {
  const {
    variant = 'neutral',
    icon = variant === 'danger' ? 'x-circle' : variant === 'warning' ? 'exclamation-triangle' : 'info-circle',
    duration = variant === 'danger' ? Infinity : 8000,
    closable = true,
  } = options;

  await import('@shoelace-style/shoelace/dist/components/alert/alert.js');
  await import('@shoelace-style/shoelace/dist/components/icon/icon.js');

  const alert = Object.assign(document.createElement('sl-alert'), {
    variant,
    closable,
    duration,
  });
  alert.innerHTML = `<sl-icon slot="icon" name="${icon}"></sl-icon>${message}`;
  document.body.appendChild(alert);
  (alert as any).toast();
}
