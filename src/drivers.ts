import type { Driver, DriverContext } from './types.js'

const clamp = (n: number) => (n < -1 ? -1 : n > 1 ? 1 : n)

interface Rect {
  cx: number
  cy: number
  w: number
  h: number
}

/**
 * The stage never rotates, so its rect is the one safe thing to measure. It is
 * cached rather than read per move, because reading it there would force a
 * layout on every frame the pointer is alive.
 */
function rectTracker(stage: HTMLElement) {
  let rect: Rect = { cx: 0, cy: 0, w: 1, h: 1 }
  const measure = () => {
    const r = stage.getBoundingClientRect()
    rect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width || 1, h: r.height || 1 }
  }
  measure()
  const ro = new ResizeObserver(measure)
  ro.observe(stage)
  addEventListener('scroll', measure, { passive: true, capture: true })
  addEventListener('resize', measure, { passive: true })
  return {
    get: () => rect,
    stop() {
      ro.disconnect()
      removeEventListener('scroll', measure, { capture: true } as EventListenerOptions)
      removeEventListener('resize', measure)
    },
  }
}

/**
 * `recenterOnLeave` also decides the gain: scoped to the stage the pointer can
 * only reach half a width from center, so it takes twice the deflection to
 * reach full swing.
 */
export function pointerDriver(recenterOnLeave: boolean): Driver {
  let tracker: ReturnType<typeof rectTracker> | null = null
  let host: HTMLElement | Window = window
  let onMove: ((e: PointerEvent) => void) | null = null
  let onLeave: (() => void) | null = null

  return {
    start(ctx: DriverContext) {
      tracker = rectTracker(ctx.stage)
      host = recenterOnLeave ? ctx.stage : window
      onMove = (e: PointerEvent) => {
        const r = tracker!.get()
        const dx = (e.clientX - r.cx) / r.w
        const dy = (e.clientY - r.cy) / r.h
        const gain = recenterOnLeave ? 2 : 1
        ctx.set(clamp(dx * gain), clamp(dy * gain))
        ctx.setSheen?.(dx * 100 + 50, dy * 100 + 50)
      }
      onLeave = () => {
        ctx.set(0, 0)
        ctx.setSheen?.(50, 50)
      }
      host.addEventListener('pointermove', onMove as EventListener, { passive: true })
      if (recenterOnLeave) host.addEventListener('pointerleave', onLeave as EventListener)
    },
    stop() {
      if (onMove) host.removeEventListener('pointermove', onMove as EventListener)
      if (onLeave) host.removeEventListener('pointerleave', onLeave as EventListener)
      tracker?.stop()
      tracker = null
    },
  }
}

type PermissionAPI = { requestPermission?: () => Promise<'granted' | 'denied' | 'default'> }

export function orientationSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
}

/**
 * iOS 13+ gates the accelerometer behind a call made from inside a user
 * gesture, on a secure origin. Everywhere else this resolves immediately.
 */
export async function requestOrientationPermission(): Promise<boolean> {
  if (!orientationSupported()) return false
  const api = window.DeviceOrientationEvent as unknown as PermissionAPI
  if (typeof api.requestPermission !== 'function') return true
  try {
    return (await api.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

export interface OrientationDriver extends Driver {
  /** Take the device's current attitude as level. */
  calibrate(): void
}

/** `range` is the tilt in degrees that reaches full deflection. */
export function orientationDriver(range = 24): OrientationDriver {
  let base: { beta: number; gamma: number } | null = null
  let onEvent: ((e: DeviceOrientationEvent) => void) | null = null

  return {
    calibrate() {
      base = null
    },
    start(ctx: DriverContext) {
      onEvent = (e: DeviceOrientationEvent) => {
        if (e.beta === null || e.gamma === null) return
        if (!base) base = { beta: e.beta, gamma: e.gamma }
        let x = (e.gamma - base.gamma) / range
        let y = (e.beta - base.beta) / range
        // In landscape the device's own axes are rotated out from under us.
        const angle = screen.orientation?.angle ?? 0
        if (angle === 90) [x, y] = [y, -x]
        else if (angle === 270 || angle === -90) [x, y] = [-y, x]
        else if (angle === 180) [x, y] = [-x, -y]
        ctx.set(clamp(x), clamp(y))
        ctx.setSheen?.(clamp(x) * 50 + 50, clamp(y) * 50 + 50)
      }
      addEventListener('deviceorientation', onEvent, { passive: true })
    },
    stop() {
      if (onEvent) removeEventListener('deviceorientation', onEvent)
      onEvent = null
      base = null
    },
  }
}

export function scrollDriver(): Driver {
  let tracker: ReturnType<typeof rectTracker> | null = null
  let onScroll: (() => void) | null = null

  return {
    start(ctx: DriverContext) {
      tracker = rectTracker(ctx.stage)
      onScroll = () => {
        const r = tracker!.get()
        const span = (innerHeight + r.h) / 2
        ctx.set(0, clamp((r.cy - innerHeight / 2) / span))
      }
      onScroll()
      addEventListener('scroll', onScroll, { passive: true, capture: true })
      addEventListener('resize', onScroll, { passive: true })
    },
    stop() {
      if (onScroll) {
        removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
        removeEventListener('resize', onScroll)
      }
      tracker?.stop()
      tracker = null
    },
  }
}

export interface FusedDriver extends Driver {
  readonly sources: readonly Driver[]
  /** Restart one source in place - after its permission was granted, say. */
  restart(source: Driver): void
  calibrate(): void
}

/** Per-event motion below this decays away instead of counting as intent. */
const DECAY = 0.9
const TAKEOVER = 0.04

/**
 * Follow whichever source is actually moving. A desktop has a pointer and a
 * still accelerometer; a phone has a live accelerometer and only fires
 * pointermove mid-drag - so asking a consumer to choose one asks them to guess
 * the device. Each source accumulates a decaying measure of how much it has
 * moved, and takes over when that crosses the threshold, which keeps sensor
 * drift from stealing control while a real tilt claims it within a few events.
 */
export function fuse(...drivers: Driver[]): FusedDriver {
  let outer: DriverContext | null = null
  let active = -1
  const state = drivers.map(() => ({ x: 0, y: 0, energy: 0, seen: false }))

  const wrap = (i: number): DriverContext => ({
    get stage() {
      return outer!.stage
    },
    set(x, y) {
      const s = state[i]!
      // A source's first reading is its baseline, never a claim - an
      // accelerometer starts reporting the instant it is listened to, and would
      // otherwise seize control from the pointer without the device moving.
      const first = !s.seen
      s.energy = first ? 0 : s.energy * DECAY + Math.hypot(x - s.x, y - s.y)
      s.x = x
      s.y = y
      s.seen = true
      if (active !== i) {
        if (first ? active !== -1 : s.energy < TAKEOVER) return
        // Energy measures intent since a source last held control, so handing
        // over clears it everywhere. Without this a source that was moving
        // hard before it lost control snatches it straight back on its next
        // event, however still it has gone.
        for (const other of state) other.energy = 0
        active = i
      }
      outer!.set(x, y)
    },
    setSheen(mx, my) {
      if (active === i) outer!.setSheen?.(mx, my)
    },
  })

  return {
    sources: drivers,
    start(ctx) {
      outer = ctx
      drivers.forEach((d, i) => d.start(wrap(i)))
    },
    stop() {
      for (const d of drivers) d.stop()
      active = -1
      for (const s of state) {
        s.energy = 0
        s.seen = false
      }
      outer = null
    },
    restart(source) {
      const i = drivers.indexOf(source)
      if (i < 0 || !outer) return
      source.stop()
      source.start(wrap(i))
    },
    calibrate() {
      for (const d of drivers) (d as { calibrate?: () => void }).calibrate?.()
    },
  }
}
