import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a', 'b', 'strong', 'i', 'em', 'u', 's', 'p', 'br', 'span', 'div',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'blockquote', 'code', 'pre', 'hr', 'img', 'sub', 'sup', 'small'
];

const ALLOWED_ATTR = ['href', 'title', 'src', 'alt', 'width', 'height'];

/** Sanitizes an externally sourced HTML fragment (e.g. a layer "abstract") via DOMPurify, allow-listing safe tags/attributes and stripping scripts, event handlers, and unsafe URL schemes. */
export function sanitizeAbstractHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });

  // Force safe link behavior on anchors that survived sanitization.
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  doc.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
  return doc.body.innerHTML;
}
