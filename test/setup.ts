/**
 * jsdom has no layout, no ResizeObserver and no IntersectionObserver. The last
 * two are stubbed so a test can drive them by hand.
 */
class NoopResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class FakeIntersectionObserver {
  static live = new Set<FakeIntersectionObserver>()
  readonly targets = new Set<Element>()
  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.live.add(this)
  }
  observe(el: Element): void {
    this.targets.add(el)
  }
  unobserve(el: Element): void {
    this.targets.delete(el)
  }
  disconnect(): void {
    this.targets.clear()
    FakeIntersectionObserver.live.delete(this)
  }
  /** Report a visibility change for everything this observer is watching. */
  report(isIntersecting: boolean): void {
    const entries = [...this.targets].map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry)
    if (entries.length > 0) this.callback(entries, this as unknown as IntersectionObserver)
  }
}

/** Move every reticulized stage in or out of view. */
export function setVisibility(isIntersecting: boolean): void {
  for (const observer of FakeIntersectionObserver.live) observer.report(isIntersecting)
}

const listeners = new Set<() => void>()
let reduceMotion = false

/** Change the reduced-motion setting the way a person changes it mid-session. */
export function setReducedMotion(on: boolean): void {
  reduceMotion = on
  for (const fn of listeners) fn()
}

globalThis.ResizeObserver ??= NoopResizeObserver as unknown as typeof ResizeObserver
globalThis.IntersectionObserver ??= FakeIntersectionObserver as unknown as typeof IntersectionObserver

globalThis.matchMedia ??= ((query: string) =>
  ({
    get matches() {
      return query.includes('prefers-reduced-motion') && reduceMotion
    },
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList) as typeof matchMedia
