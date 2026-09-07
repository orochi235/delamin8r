import { delaminate } from 'delamin8r'
import type { DelaminateHandle, DelaminateOptions } from 'delamin8r'

/** Long enough for the entrance to finish, so nothing is delaminated while it animates. */
const SETTLE = 560

/**
 * Every handle a page makes, and the one call that ends them. Emptying the
 * outlet does not: a detached container's IntersectionObserver never fires, so
 * `pauseOffscreen` leaves the pointer listener and the frame tick alive.
 */
export class Rig {
  private live: DelaminateHandle[] = []
  private timers: number[] = []
  private dead = false

  /** Delaminate once the entrance animation is out of the way. */
  add(target: HTMLElement | null, options: DelaminateOptions = {}): void {
    if (!target || this.dead) return
    this.timers.push(
      window.setTimeout(() => {
        if (!this.dead) this.live.push(delaminate(target, options))
      }, SETTLE),
    )
  }

  /** Delaminate now, and hand the handle back for a lab to drive. */
  now(target: HTMLElement, options: DelaminateOptions = {}): DelaminateHandle {
    const handle = delaminate(target, options)
    this.live.push(handle)
    return handle
  }

  /** Drop one handle early, for a lab rebuilding its subject. */
  drop(handle: DelaminateHandle): void {
    handle.destroy()
    this.live = this.live.filter((h) => h !== handle)
  }

  destroy(): void {
    this.dead = true
    for (const t of this.timers) clearTimeout(t)
    for (const h of this.live) h.destroy()
    this.timers = []
    this.live = []
  }

  /**
   * The site is the first thing that would hit the bug it documents: one
   * `overflow` on a wrapper and the page just looks slightly flat.
   */
  audit(where: string): void {
    if (!import.meta.env.DEV) return
    window.setTimeout(() => {
      for (const handle of this.live) {
        for (const hit of handle.diagnose()) {
          console.warn(`[delamin8r site] ${where}: ${hit.cause} on`, hit.culprit, 'flattens', hit.el)
        }
      }
    }, SETTLE + 120)
  }
}
