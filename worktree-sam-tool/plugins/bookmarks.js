// Example webmapx plugin: named map views.
//
// One plain ES module, no build step and no imports: everything webmapx-specific
// arrives as the `api` argument of register(). Importing webmapx from a CDN
// instead would load a second copy whose tool registry this page never reads.
//
// Use it by naming the module in a config (relative to the config file) and
// adding the tool id to a toolbar:
//
//   "plugins": ["../plugins/bookmarks.js"],
//   "tools": {
//     "mainToolbar": { "type": "toolbar", "items": [{ "type": "bookmarks" }] },
//     "bookmarks": { "enabled": true, "views": [
//       { "label": "Amsterdam", "center": [4.9, 52.37], "zoom": 12 }
//     ] }
//   }
//
// Views from the config are fixed; views the user adds are kept in this
// browser's localStorage, per page. The code has no built-in views: the three
// below are the plugin's config template, its default tools.bookmarks section.

const TEMPLATE_VIEWS = [
  { label: 'World', center: [0, 20], zoom: 1.5 },
  { label: 'Amsterdam', center: [4.9, 52.37], zoom: 12 },
  { label: 'Eiffel Tower', center: [2.2945, 48.8584], zoom: 17 },
];

export default {
  register(api) {
    const { WebmapxModalTool, html, css, registerTool } = api;

    const storageKey = () => `webmapx-bookmarks:${location.pathname}`;

    function readSaved() {
      try {
        const parsed = JSON.parse(localStorage.getItem(storageKey()) ?? '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function writeSaved(views) {
      try {
        localStorage.setItem(storageKey(), JSON.stringify(views));
      } catch {
        // Private mode or storage full: the view simply is not remembered.
      }
    }

    class WebmapxBookmarksTool extends WebmapxModalTool {
      static properties = {
        saved: { state: true },
        view: { state: true },
        draftName: { state: true },
      };

      static styles = css`
        :host { display: block; }
        .content { padding: 0.75rem; font-size: 0.875rem; }
        ul { list-style: none; margin: 0 0 0.75rem; padding: 0; }
        li { display: flex; align-items: center; gap: 0.25rem; }
        .go {
          flex: 1; text-align: left; font: inherit; color: inherit;
          background: none; border: none; border-radius: var(--webmapx-radius-sm, 4px);
          padding: 0.4rem 0.5rem; cursor: pointer;
        }
        .go:hover { background: var(--color-surface-hover, rgba(0, 0, 0, 0.06)); }
        .go:focus-visible { outline: var(--webmapx-focus-width, 2px) solid var(--webmapx-focus-color, #1a5fb4); outline-offset: var(--webmapx-focus-offset, 1px); }
        .zoom { color: var(--color-text-muted, #6b7681); font-variant-numeric: tabular-nums; margin-left: 0.4rem; }
        .empty { color: var(--color-text-muted, #6b7681); font-style: italic; margin: 0 0 0.75rem; }
        form { display: flex; gap: 0.4rem; }
        input {
          flex: 1; min-width: 0; font: inherit; color: inherit;
          padding: 0.3rem 0.5rem; border: 1px solid var(--color-border, #c7ced6);
          border-radius: var(--webmapx-radius-sm, 4px); background: var(--color-surface, #fff);
        }
      `;

      constructor() {
        super();
        this.saved = readSaved();
        this.view = null;
        this.draftName = '';
      }

      get toolId() { return 'bookmarks'; }

      get configuredViews() {
        const views = this.toolsConfig?.bookmarks?.views;
        return Array.isArray(views) ? views.filter(isView) : [];
      }

      onStateChanged(state) {
        if (!state.mapCenter || state.zoomLevel == null) return;
        this.view = { center: state.mapCenter, zoom: state.zoomLevel };
      }

      goTo(view) {
        this.adapter?.setViewport(view.center, view.zoom);
      }

      addCurrent(event) {
        event.preventDefault();
        if (!this.view) return;
        const label = this.draftName.trim() || `View ${this.saved.length + 1}`;
        const zoom = Math.round(this.view.zoom * 100) / 100;
        const center = this.view.center.map((v) => Math.round(v * 1e5) / 1e5);
        this.saved = [...this.saved, { label, center, zoom }];
        this.draftName = '';
        writeSaved(this.saved);
      }

      remove(index) {
        this.saved = this.saved.filter((_, i) => i !== index);
        writeSaved(this.saved);
      }

      renderRow(view, onRemove) {
        return html`
          <li>
            <button type="button" class="go" @click=${() => this.goTo(view)}>
              ${view.label}<span class="zoom">z${Math.round(view.zoom)}</span>
            </button>
            ${onRemove ? html`
              <sl-icon-button name="x-lg" label="Remove bookmark ${view.label}" @click=${onRemove}></sl-icon-button>
            ` : ''}
          </li>`;
      }

      render() {
        const fixed = this.configuredViews;
        const empty = fixed.length === 0 && this.saved.length === 0;
        return html`
          <div class="tool-content content">
            ${empty ? html`<p class="empty">No bookmarks yet.</p>` : html`
              <ul aria-label="Bookmarks">
                ${fixed.map((view) => this.renderRow(view, null))}
                ${this.saved.map((view, i) => this.renderRow(view, () => this.remove(i)))}
              </ul>`}
            <form @submit=${(e) => this.addCurrent(e)}>
              <input type="text" placeholder="Name this view" aria-label="Bookmark name"
                .value=${this.draftName}
                @input=${(e) => { this.draftName = e.target.value; }}>
              <sl-button size="small" ?disabled=${!this.view} @click=${(e) => this.addCurrent(e)}>Add</sl-button>
            </form>
          </div>`;
      }
    }

    function isView(v) {
      return v && typeof v.label === 'string'
        && Array.isArray(v.center) && v.center.length === 2 && v.center.every(Number.isFinite)
        && Number.isFinite(v.zoom);
    }

    if (!customElements.get('webmapx-bookmarks-tool')) {
      customElements.define('webmapx-bookmarks-tool', WebmapxBookmarksTool);
    }
    registerTool({
      id: 'bookmarks',
      tag: 'webmapx-bookmarks-tool',
      placement: 'toolbar',
      label: 'Bookmarks',
      icon: 'bookmark-star',
      // The default tools.bookmarks section: setup.html writes it into a config
      // that places the tool, and its ⚙ editor starts from it.
      configTemplate: { enabled: true, views: TEMPLATE_VIEWS },
    });
  },
};
