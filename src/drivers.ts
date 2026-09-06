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
