import { IMapAdapter } from '../../map/IMapAdapter';
import { WebmapxMapElement } from './webmapx-map';

function queryWithSelector(root: ParentNode, selector: string): WebmapxMapElement | null {
  try {
    const candidate = root.querySelector(selector);
    if (candidate instanceof WebmapxMapElement) {
      return candidate;
    }
    return null;
  } catch (error) {
    console.error(`[webmapx] Invalid selector "${selector}" provided via map attribute.`, error);
    return null;
  }
}

export function resolveMapElement(host: HTMLElement): WebmapxMapElement | null {
  const explicitSelector = host.getAttribute('map');
  if (explicitSelector) {
    const root = host.ownerDocument ?? document;
    const explicitMatch = queryWithSelector(root, explicitSelector);
    if (!explicitMatch) {
      console.error(`[webmapx] No <webmapx-map> found for selector "${explicitSelector}" on ${host.tagName.toLowerCase()}.`);
    }
    return explicitMatch;
  }

  const ancestor = host.closest('webmapx-map');
  if (ancestor instanceof WebmapxMapElement) {
    return ancestor;
  }

  const root = host.ownerDocument ?? document;
  const maps = root.querySelectorAll('webmapx-map');
  if (maps.length === 1 && maps[0] instanceof WebmapxMapElement) {
    return maps[0];
  }
  if (maps.length > 1) {
    console.error(
      `[webmapx] Multiple <webmapx-map> elements found for ${host.tagName.toLowerCase()}. ` +
      `Set a "map" attribute with an explicit selector.`
    );
    return null;
  }

  console.error(`[webmapx] Unable to locate a <webmapx-map> for ${host.tagName.toLowerCase()}.`);
  return null;
}

export function resolveMapAdapter(host: HTMLElement): IMapAdapter | null {
  const mapElement = resolveMapElement(host);
  if (!mapElement) {
    return null;
  }

  const adapter = mapElement.adapter;
  // Adapter creation is async (lazy-loaded engines). It's normal for tools/components to
  // connect before the adapter is ready; callers can subscribe to `webmapx-map-ready` or
  // use `webmapx-map.getAdapterAsync()`.
  return adapter;
}
