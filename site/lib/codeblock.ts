/**
 * Scrolling code needs `overflow-x`, which would flatten anything inside it, so
 * the block sits out of the plane walk entirely.
 */
export function codeblock(source: string, caption = '', aside = ''): string {
  const cap = caption || aside ? `<div class="code__cap"><span>${caption}</span><span>${aside}</span></div>` : ''
  return `<div class="code" data-dl-skip>${cap}${source}</div>`
}
