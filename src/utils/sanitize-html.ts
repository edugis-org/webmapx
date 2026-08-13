import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a', 'b', 'strong', 'i', 'em', 'u', 's', 'p', 'br', 'span', 'div',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'blockquote', 'code', 'pre', 'hr', 'img', 'sub', 'sup', 'small'
];

const ALLOWED_ATTR = ['href', 'title', 'src', 'alt', 'width', 'height'];

/** Matches absolute (has a scheme) or protocol-relative URLs — mirrors resolveConfigRelativeUrl in config/loader.ts. */
const ABSOLUTE_URL_RE = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/** Rewrites relative src/href attributes to absolute URLs against baseUrl, so HTML fetched from a URL can use ordinary relative paths. */
function resolveRelativeUrls(doc: Document, baseUrl: string): void {
  doc.querySelectorAll('img[src], a[href]').forEach((el) => {
    const attr = el.tagName === 'A' ? 'href' : 'src';
    const value = el.getAttribute(attr);
    if (!value || ABSOLUTE_URL_RE.test(value)) return;
    try {
      el.setAttribute(attr, new URL(value, baseUrl).toString());
    } catch {
      // Leave malformed URLs untouched.
    }
  });
}

/**
 * Sanitizes an externally sourced HTML fragment (e.g. a layer "abstract" or fetched story
 * content) via DOMPurify, allow-listing safe tags/attributes and stripping scripts, event
 * handlers, and unsafe URL schemes. When `baseUrl` is given (e.g. the URL the HTML was fetched
 * from), relative `src`/`href` values are resolved against it.
 */
export function sanitizeAbstractHtml(html: string, baseUrl?: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
  });

  // Force safe link behavior on anchors that survived sanitization.
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  if (baseUrl) {
    resolveRelativeUrls(doc, baseUrl);
  }
  doc.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
  return doc.body.innerHTML;
}
