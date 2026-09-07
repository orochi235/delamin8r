import { Rig } from './lib/rig.js'
import { pages } from './registry.js'

/**
 * The bar is delaminated like everything else, so the first thing a reader
 * moves the pointer over is already the effect.
 */
export function chrome(nav: HTMLElement, bar: HTMLElement): Rig {
  nav.innerHTML = pages
    .filter((p) => p.slug !== '')
    .map((p) => `<a href="#/${p.slug}">${p.nav}</a>`)
    .join('')

  const rig = new Rig()
  rig.add(bar, { step: 5, maxDepth: 3, recenterOnLeave: false, drift: false })
  return rig
}

export function markCurrent(nav: HTMLElement, slug: string): void {
  for (const a of nav.querySelectorAll('a')) {
    const target = a.getAttribute('href')!.slice(2)
    if (target === slug) a.setAttribute('aria-current', 'page')
    else a.removeAttribute('aria-current')
  }
}
