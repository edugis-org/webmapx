import { IMapAdapter } from '../../map/IMapAdapter';
import { WebmapxMapElement } from './webmapx-map';

function queryWithSelector(selector: string): WebmapxMapElement | null {
  try {
    const candidate = document.querySelector(selector);
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
    const explicitMatch = queryWithSelector(explicitSelector);
    if (explicitMatch) {
      return explicitMatch;
    }
  }

  const ancestor = host.closest('webmapx-map');
  if (ancestor instanceof WebmapxMapElement) {
    return ancestor;
  }

  const fallback = document.querySelector('webmapx-map');
  if (fallback instanceof WebmapxMapElement) {
    return fallback;
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
  if (!adapter) {
    console.error('[webmapx] Map adapter not initialized yet.');
  }
  return adapter;
}
