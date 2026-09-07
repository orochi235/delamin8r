import { describe, expect, it } from 'vitest'
import { pages } from '../site/registry.js'

/**
 * Emptying the outlet does not stop a delaminated region: a detached
 * container's IntersectionObserver never fires, so `pauseOffscreen` cannot
 * collect it. Every page's teardown has to do it, and this is what says so.
 */
describe('every page tears itself down', () => {
  for (const page of pages) {
    if (page.headless === false) continue

    it(`${page.slug || 'home'} leaves nothing behind`, () => {
      const root = document.createElement('main')
      document.body.append(root)

      const teardown = page.render(root)
      expect(root.children.length).toBeGreaterThan(0)

      teardown()
      expect(root.querySelectorAll('.dl-stage, .dl-plane, .dl-deck')).toHaveLength(0)
      expect(root.querySelectorAll('[style*="--dl-"]')).toHaveLength(0)
      expect(root.querySelectorAll('[data-dl-deck]')).toHaveLength(0)

      root.remove()
    })
  }
})
