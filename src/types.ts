export type Mode = 'window' | 'tilt'

/** A rule that pulls matching elements toward the viewer, in multiples of `step`. */
export interface LiftRule {
  match: string
  lift: number
}

export interface DelaminateOptions {
  /**
   * `window` moves `perspective-origin` and rotates nothing, so the container
   * you pass is the whole apparatus. `tilt` rotates an inner deck, which means
   * a second element has to exist or be injected.
   */
  mode?: Mode
  /** Z distance between adjacent siblings, in px. Derived from the container when unset. */
  step?: number
  /** Multiplier applied to `step` at each level of nesting. */
  falloff?: number
  /** How many levels below the container become planes. */
  maxDepth?: number
  /** Fraction of the Z range that sits in front of the container's own plane. */
  origin?: number
  perspective?: number
  /** How far the viewpoint (or the tilt) swings at full deflection. */
  swing?: number
  tilt?: number
  /** Keep every plane at its unwrapped apparent size, so nothing resizes at rest. */
  scaleCompensate?: boolean
  drift?: { near?: number; far?: number } | false
  /** Easing per frame, 0-1. Lower is heavier. */
  ease?: number
  /** Elements matching this are left flat, along with their subtrees. */
  skip?: string
  /** Extra pull toward the viewer for semantic roles. Replaces the defaults when given. */
  lift?: LiftRule[]
  driver?: DriverName | Driver | false
  /** Return the pointer to center when it leaves the container. */
  recenterOnLeave?: boolean
  /** Detach the driver and leave the frame loop while the container is out of view. */
  pauseOffscreen?: boolean
  injectStyles?: boolean
}

/**
 * `auto` is the default: the pointer and the accelerometer fused, following
 * whichever one is moving.
 */
export type DriverName = 'auto' | 'pointer' | 'orientation' | 'scroll'

export interface DriverContext {
  /** The element that never rotates, so its rect is safe to measure. */
  stage: HTMLElement
  /** Deflection in x and y, each normalized to ±1. */
  set(x: number, y: number): void
  /** Pointer position over the stage as 0-100 percentages, for surface sheens. */
  setSheen?(mx: number, my: number): void
}

export interface Driver {
  start(ctx: DriverContext): void
  stop(): void
}

export interface Plane {
  el: HTMLElement
  /** Z in stage space, after the range has been fitted. */
  z: number
  parentZ: number
  level: number
  /**
   * True when an ancestor's own styles flatten 3D, so this plane will not
   * render at depth. Read off the live DOM at the moment you ask.
   */
  readonly flattened: boolean
}

export interface DelaminateHandle {
  readonly stage: HTMLElement
  readonly planes: readonly Plane[]
  /** Re-read the subtree. Call after the content changes. */
  refresh(): void
  /** Drive it from something else; `false` detaches the current driver. */
  setDriver(driver: DriverName | Driver | false): void
  /** Push a deflection in directly. Both values are clamped to ±1. */
  set(x: number, y: number): void
  /**
   * Ask for accelerometer access. iOS requires this to be called from inside a
   * user gesture, over HTTPS; everywhere else the sensor is already fused in
   * and this resolves true without prompting.
   */
  enableOrientation(): Promise<boolean>
  /** Take the device's current attitude as level. */
  calibrate(): void
  /** Planes that will not render at depth, and what is flattening them. */
  diagnose(): Array<{ el: HTMLElement; cause: string; culprit: HTMLElement }>
  destroy(): void
}
