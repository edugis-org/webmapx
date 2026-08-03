import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { ToolIconConfig } from '../config/types';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { controlSurfaceStyles } from './internal/control-surface-styles';

/** A submenu declared in config, addressed by its slash-joined path of ids. */
interface MenuGroup {
  path: string;
  label: string;
  icon?: ToolIconConfig;
}

interface MenuEntry {
  id: string;
  label: string;
  icon?: ToolIconConfig;
  keywords: string[];
  /** Slash-joined ids of the submenus this entry lives in ('' = top level). */
  path: string;
  element: HTMLElement;
}

/** Number of entries above which the search box is shown. */
const SEARCH_THRESHOLD = 8;

/**
 * Menu container tool: a labelled, drill-in list of sub-tools (as opposed to
 * `webmapx-toolbox-tool`, which shows the same kind of sub-tools as a flat row
 * of icon buttons).
 *
 * Structure is declarative: every sub-tool is a direct light-DOM child, and
 * `menu-path` says which submenu it belongs to ('' or absent = top level,
 * `analysis/advanced` = two levels deep). Submenu labels/icons come from the
 * `groups` attribute (JSON array of `{ path, label, icon }`). Keeping the DOM
 * flat means one `<slot>` can project whichever sub-tool is active, at any
 * depth — nesting the elements themselves would put deep sub-tools out of
 * reach of the slot.
 */
@customElement('webmapx-menu-tool')
export class WebmapxMenuTool extends WebmapxBaseTool {
  readonly toolId = 'menu';

  @state() private activeSubToolId: string | null = null;
  @state() private searchQuery = '';
  @state() private currentPath = '';
  @state() private entries: MenuEntry[] = [];
  @state() private groups: MenuGroup[] = [];
  /** Roving-tabindex position within the current list; only this row is tabbable. */
  @state() private focusedIndex = 0;
  /** Set when a keyboard action should move DOM focus after the next render. */
  private pendingRowFocus = false;

  static styles = [controlSurfaceStyles, css`
    :host {
      display: block;
    }

    .menu-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px;
      border-bottom: 1px solid var(--sl-color-neutral-200);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      min-height: 24px;
      font-size: var(--sl-font-size-small);
      color: var(--sl-color-neutral-700);
    }

    .breadcrumb .crumb-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .back-btn::part(base) {
      padding-left: 4px;
      padding-right: 4px;
    }

    .menu-list {
      display: flex;
      flex-direction: column;
      padding: 4px;
      gap: 2px;
      overflow: auto;
    }

    .menu-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 8px;
      border: 0;
      border-radius: var(--webmapx-radius-sm, 4px);
      background: transparent;
      font: inherit;
      font-size: var(--sl-font-size-small);
      color: var(--sl-color-neutral-900);
      text-align: left;
      cursor: pointer;
    }

    .menu-row:hover,
    .menu-row:focus-visible {
      background: var(--sl-color-neutral-100);
    }

    .menu-row .row-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-row .row-path {
      font-size: var(--sl-font-size-x-small);
      color: var(--sl-color-neutral-500);
      white-space: nowrap;
    }

    .menu-row sl-icon {
      flex: 0 0 auto;
      font-size: 1.1em;
    }

    .empty {
      padding: 8px;
      font-size: var(--sl-font-size-small);
      color: var(--sl-color-neutral-500);
    }

    sl-input.search-input {
      --sl-input-height-medium: 28px;
      --sl-input-font-size-medium: var(--sl-font-size-small);
    }

    .tool-content-area {
      overflow: auto;
    }

    /* Only hide the inactive ones — the active sub-tool keeps whatever display
       its own :host rule sets (several tools are flex containers). */
    .tool-content-area ::slotted(:not([data-menu-active])) {
      display: none;
    }
  `];

  connectedCallback(): void {
    super.connectedCallback();
    this.readGroups();
    this.indexEntries();
  }

  private readGroups(): void {
    const raw = this.getAttribute('groups');
    if (!raw) {
      this.groups = [];
      return;
    }
    try {
      const parsed = JSON.parse(raw) as MenuGroup[];
      this.groups = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.warn('[webmapx] webmapx-menu-tool: invalid "groups" JSON — ignored');
      this.groups = [];
    }
  }

  private indexEntries(): void {
    const entries: MenuEntry[] = [];
    for (const child of Array.from(this.children)) {
      const el = child as HTMLElement;
      const id = el.getAttribute('tool-id') ?? el.getAttribute('name') ?? (el as { toolId?: string }).toolId ?? null;
      if (!id) continue;
      const label = el.getAttribute('label') ?? id;
      const keywordsAttr = el.getAttribute('menu-keywords') ?? el.getAttribute('toolbox-keywords') ?? '';
      const keywords = keywordsAttr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      keywords.push(label.toLowerCase(), id.toLowerCase());

      const iconName = el.getAttribute('menu-icon') ?? el.getAttribute('toolbox-icon') ?? el.getAttribute('icon-name');
      const iconSrc = el.getAttribute('menu-icon-src');
      const icon: ToolIconConfig | undefined = iconName || iconSrc
        ? { name: iconName ?? undefined, src: iconSrc ?? undefined }
        : undefined;

      const path = (el.getAttribute('menu-path') ?? '').replace(/^\/+|\/+$/g, '');

      entries.push({ id, label, icon, keywords, path, element: el });
      if (id !== this.activeSubToolId) {
        el.hidden = true;
        el.inert = true;
      }
    }
    this.entries = entries;
  }

  /** Submenus directly below `path`, in the DOM order of their first entry. */
  private childGroups(path: string): MenuGroup[] {
    const prefix = path ? `${path}/` : '';
    const seen = new Set<string>();
    const result: MenuGroup[] = [];
    for (const entry of this.entries) {
      if (!entry.path.startsWith(prefix)) continue;
      const rest = entry.path.slice(prefix.length);
      if (!rest) continue;
      const childPath = prefix + rest.split('/')[0];
      if (seen.has(childPath)) continue;
      seen.add(childPath);
      const declared = this.groups.find(g => g.path === childPath);
      result.push(declared ?? { path: childPath, label: childPath.split('/').pop() ?? childPath });
    }
    return result;
  }

  private childEntries(path: string): MenuEntry[] {
    return this.entries.filter(e => e.path === path);
  }

  private get searchResults(): MenuEntry[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return [];
    return this.entries.filter(e => e.keywords.some(k => k.includes(q)));
  }

  private groupLabel(path: string): string {
    return this.groups.find(g => g.path === path)?.label ?? path.split('/').pop() ?? path;
  }

  /** Human-readable trail for a path, e.g. 'Analysis / Advanced'. */
  private pathLabel(path: string): string {
    if (!path) return '';
    const segments = path.split('/');
    return segments
      .map((_, index) => this.groupLabel(segments.slice(0, index + 1).join('/')))
      .join(' / ');
  }

  private setSubToolActive(entry: MenuEntry | undefined, active: boolean): void {
    if (!entry) return;
    const el = entry.element;
    if (active) {
      el.setAttribute('data-menu-active', '');
    } else {
      el.removeAttribute('data-menu-active');
    }
    el.hidden = !active;
    el.inert = !active;
    const hook = (el as unknown as Record<string, unknown>)[active ? 'activate' : 'deactivate'];
    if (typeof hook === 'function') (hook as () => void).call(el);
  }

  private activateSubTool(id: string): void {
    if (this.activeSubToolId === id) {
      this.deactivateSubTool();
      return;
    }
    if (this.activeSubToolId) {
      this.setSubToolActive(this.entries.find(e => e.id === this.activeSubToolId), false);
    }
    const entry = this.entries.find(e => e.id === id);
    this.activeSubToolId = id;
    // Follow the tool into its submenu, so "back" returns to where it lives
    // rather than to wherever a search hit was clicked from.
    if (entry) this.currentPath = entry.path;
    this.searchQuery = '';
    this.setSubToolActive(entry, true);
  }

  private deactivateSubTool(): void {
    if (this.activeSubToolId) {
      this.setSubToolActive(this.entries.find(e => e.id === this.activeSubToolId), false);
    }
    this.activeSubToolId = null;
  }

  /** Back: close the open sub-tool first, then walk up one submenu level. */
  private goBack(): void {
    if (this.activeSubToolId) {
      this.deactivateSubTool();
      return;
    }
    const segments = this.currentPath.split('/').filter(Boolean);
    const leaving = segments.pop();
    this.currentPath = segments.join('/');
    // Land on the submenu we just left, so repeated ArrowLeft walks back up
    // the same trail the user came down.
    const leftIndex = leaving
      ? this.childGroups(this.currentPath).findIndex(g => g.path === leaving || g.path.endsWith(`/${leaving}`))
      : -1;
    this.focusRow(Math.max(0, leftIndex));
  }

  private enterGroup(path: string): void {
    this.currentPath = path;
    this.focusRow(0);
  }

  /** Number of rows in the list as currently rendered. */
  private get rowCount(): number {
    if (this.searchQuery.trim()) return this.searchResults.length;
    return this.childGroups(this.currentPath).length + this.childEntries(this.currentPath).length;
  }

  private get rowElements(): HTMLButtonElement[] {
    return Array.from((this.renderRoot as ShadowRoot).querySelectorAll<HTMLButtonElement>('.menu-row'));
  }

  /**
   * Moves the roving tabindex to `index` and takes DOM focus with it after the
   * next render — the target row may not exist yet when the list is changing.
   */
  private focusRow(index: number): void {
    const count = this.rowCount;
    if (count === 0) {
      this.focusedIndex = 0;
      return;
    }
    this.focusedIndex = ((index % count) + count) % count;
    this.pendingRowFocus = true;
  }

  protected updated(): void {
    if (!this.pendingRowFocus) return;
    this.pendingRowFocus = false;
    this.rowElements[this.focusedIndex]?.focus();
  }

  private handleListKeydown(e: KeyboardEvent): void {
    const rows = this.rowElements;
    if (rows.length === 0) return;
    const current = rows.findIndex(row => row === (this.renderRoot as ShadowRoot).activeElement);
    const index = current === -1 ? this.focusedIndex : current;

    switch (e.key) {
      case 'ArrowDown':
        this.focusRow(index + 1);
        break;
      case 'ArrowUp':
        this.focusRow(index - 1);
        break;
      case 'Home':
        this.focusRow(0);
        break;
      case 'End':
        this.focusRow(rows.length - 1);
        break;
      case 'ArrowRight': {
        // Only submenu rows drill in; a tool row has nothing to open.
        if (this.searchQuery.trim()) return;
        const group = this.childGroups(this.currentPath)[index];
        if (!group) return;
        this.enterGroup(group.path);
        break;
      }
      case 'ArrowLeft':
        if (this.currentPath === '') return;
        this.goBack();
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  /** ArrowDown from the search box moves into the result list. */
  private handleSearchKeydown(e: KeyboardEvent): void {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    this.focusRow(0);
  }

  // Called by webmapx-tool-panel when this tool becomes visible
  activate(): void {
    this.readGroups();
    this.indexEntries();
  }

  // Called by webmapx-tool-panel when this tool is hidden
  deactivate(): void {
    this.deactivateSubTool();
    this.currentPath = '';
    this.searchQuery = '';
  }

  protected onStateChanged(_state: IMapState): void {}

  private handleSearchInput(e: Event): void {
    this.searchQuery = (e.target as HTMLInputElement).value;
    this.focusedIndex = 0;
  }

  private renderIcon(icon: ToolIconConfig | undefined): TemplateResult | typeof nothing {
    const cfg = typeof icon === 'string' ? { name: icon } : icon;
    if (!cfg?.name && !cfg?.src) return nothing;
    return html`<sl-icon
      name=${cfg.name ?? ''}
      library=${cfg.library ?? 'default'}
      src=${cfg.src ?? ''}
      aria-hidden="true"
    ></sl-icon>`;
  }

  private renderRow(
    index: number,
    label: string,
    icon: ToolIconConfig | undefined,
    onClick: () => void,
    options: { trailing?: TemplateResult | typeof nothing; sublabel?: string; submenu?: boolean } = {}
  ): TemplateResult {
    return html`
      <button
        type="button"
        class="menu-row"
        role="menuitem"
        aria-haspopup=${options.submenu ? 'true' : nothing}
        tabindex=${index === this.focusedIndex ? 0 : -1}
        @focus=${() => { this.focusedIndex = index; }}
        @click=${onClick}
      >
        ${this.renderIcon(icon)}
        <span class="row-label">${label}</span>
        ${options.sublabel ? html`<span class="row-path">${options.sublabel}</span>` : nothing}
        ${options.trailing ?? nothing}
      </button>
    `;
  }

  private renderList(): TemplateResult {
    if (this.searchQuery.trim()) {
      const results = this.searchResults;
      if (results.length === 0) {
        return html`<div class="empty">No matching tools</div>`;
      }
      return html`
        <div class="menu-list" role="menu" @keydown=${this.handleListKeydown}>
          ${results.map((entry, index) => this.renderRow(
            index,
            entry.label,
            entry.icon,
            () => this.activateSubTool(entry.id),
            { sublabel: this.pathLabel(entry.path) }
          ))}
        </div>
      `;
    }

    const groups = this.childGroups(this.currentPath);
    const entries = this.childEntries(this.currentPath);
    if (groups.length === 0 && entries.length === 0) {
      return html`<div class="empty">No tools configured</div>`;
    }

    return html`
      <div class="menu-list" role="menu" @keydown=${this.handleListKeydown}>
        ${groups.map((group, index) => this.renderRow(
          index,
          group.label,
          group.icon ?? 'folder',
          () => this.enterGroup(group.path),
          { trailing: html`<sl-icon name="chevron-right" aria-hidden="true"></sl-icon>`, submenu: true }
        ))}
        ${entries.map((entry, index) => this.renderRow(
          groups.length + index,
          entry.label,
          entry.icon,
          () => this.activateSubTool(entry.id)
        ))}
      </div>
    `;
  }

  protected render(): TemplateResult {
    const activeEntry = this.entries.find(e => e.id === this.activeSubToolId);
    const showSearch = !activeEntry && this.entries.length >= SEARCH_THRESHOLD;
    const trail = [this.pathLabel(this.currentPath), activeEntry?.label]
      .filter(Boolean)
      .join(' / ');
    const canGoBack = Boolean(activeEntry) || this.currentPath !== '';

    return html`
      <div class="tool-content">
        <div class="menu-header">
          ${canGoBack ? html`
            <div class="breadcrumb">
              <sl-button class="back-btn" size="small" variant="text" @click=${() => this.goBack()}>
                <sl-icon name="chevron-left" aria-hidden="true"></sl-icon>
                Back
              </sl-button>
              <span class="crumb-text">${trail}</span>
            </div>
          ` : nothing}
          ${showSearch ? html`
            <sl-input
              class="search-input"
              size="small"
              aria-label="Search tools"
              placeholder="Search tools…"
              clearable
              .value=${this.searchQuery}
              @sl-input=${this.handleSearchInput}
              @keydown=${this.handleSearchKeydown}
              @sl-clear=${() => { this.searchQuery = ''; this.focusedIndex = 0; }}
            >
              <sl-icon name="search" slot="prefix"></sl-icon>
            </sl-input>
          ` : nothing}
        </div>
        ${activeEntry ? nothing : this.renderList()}
        <div class="tool-content-area">
          <slot @slotchange=${() => this.indexEntries()}></slot>
        </div>
      </div>
    `;
  }
}
