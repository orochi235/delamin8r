import { collect, DEFAULT_LIFT, fit } from './depth.js'
import { fuse, orientationDriver, orientationSupported, pointerDriver, requestOrientationPermission, scrollDriver } from './drivers.js'
import { approach, join, leave, wake } from './loop.js'
import { injectStyles } from './styles.js'
import type { Driver, DriverName, Plane, ReticuleHandle, ReticuleOptions } from './types.js'

const clamp = (n: number) => (n < -1 ? -1 : n > 1 ? 1 : n)

/** Leave no empty `class=""` / `style=""` behind on an element we only borrowed. */
function tidy(el: HTMLElement): void {
  if (el.classList.length === 0) el.removeAttribute('class')
  if (el.style.length === 0) el.removeAttribute('style')
}

/**
 * Properties that force `transform-style` to a used value of flat, taking the
 * subtree out of 3D with it. They have to be checked by name: the computed
 * value still reads `preserve-3d`, so asking for that misses every one of them.
 */
const FLATTENERS: Array<[keyof CSSStyleDeclaration, (v: string) => boolean]> = [
  ['overflow', (v) => v !== 'visible'],
  ['opacity', (v) => Number(v) < 1],
  ['filter', (v) => v !== 'none'],
  ['backdropFilter', (v) => v !== 'none'],
  ['maskImage', (v) => v !== 'none'],
  ['clipPath', (v) => v !== 'none'],
  ['mixBlendMode', (v) => v !== 'normal'],
  ['isolation', (v) => v === 'isolate'],
  ['contain', (v) => /paint|layout|strict|content/.test(v)],
]

function resolve(stage: HTMLElement, o: ReticuleOptions) {
  const r = stage.getBoundingClientRect()
  const maxDim = Math.max(r.width, r.height) || 640
  const mode = o.mode ?? 'window'
  const tiltDefaults = mode === 'tilt'
  return {
    mode,
    step: o.step,
    falloff: o.falloff ?? 0.5,
    fan: o.fan ?? 0,
    maxDepth: o.maxDepth ?? Infinity,
    origin: o.origin ?? 0,
    span: 0.4 * maxDim,
    perspective: o.perspective ?? Math.min(1400, Math.max(700, 1.4 * maxDim)),
    swing: o.swing ?? (mode === 'window' ? 0.18 * maxDim : 0),
    tilt: o.tilt ?? (tiltDefaults ? 12 : 0),
    recoil: tiltDefaults ? -7 : 0,
    scaleCompensate: o.scaleCompensate ?? true,
    drift:
      o.drift === false
        ? { near: 0, far: 0 }
        : {
            near: o.drift?.near ?? (tiltDefaults ? 0.1 : 0.05),
            far: o.drift?.far ?? (tiltDefaults ? 0.1 : 0.05),
          },
    ease: o.ease ?? 0.09,
    skip: o.skip,
    lift: o.lift ?? DEFAULT_LIFT,
    recenterOnLeave: o.recenterOnLeave ?? true,
  }
}

/**
 * Turn `container` into a parallax window. Every element in its subtree becomes
 * a Z plane, ordered by `z-index` where it is set and document order where it
 * is not, and the whole stack swings with whatever is driving it.
 */
export function reticulize(container: HTMLElement, options: ReticuleOptions & { deck?: HTMLElement } = {}): ReticuleHandle {
  const cfg = resolve(container, options)
  if (options.injectStyles !== false) injectStyles(container.ownerDocument)

  const stage = container
  let injectedDeck: HTMLElement | null = null
  let deck: HTMLElement | null = null

  if (cfg.mode === 'tilt') {
    const only = stage.children.length === 1 ? stage.firstElementChild : null
    deck = options.deck ?? (only instanceof HTMLElement ? only : null)
    if (!deck) {
      injectedDeck = stage.ownerDocument.createElement('div')
      injectedDeck.dataset.rzDeck = ''
      while (stage.firstChild) injectedDeck.appendChild(stage.firstChild)
      stage.appendChild(injectedDeck)
      deck = injectedDeck
    }
    deck.classList.add('rz-deck')
  }

  const root = deck ?? stage
  let planes: Plane[] = []

  stage.classList.add('rz-stage', cfg.mode === 'window' ? 'rz-window' : 'rz-tilt')
  stage.style.setProperty('--rz-perspective', `${Math.round(cfg.perspective)}px`)
  stage.style.setProperty('--rz-swing', `${cfg.swing.toFixed(1)}px`)
  stage.style.setProperty('--rz-tilt', `${cfg.tilt}deg`)
  stage.style.setProperty('--rz-recoil', `${cfg.recoil}px`)

  const clear = () => {
    for (const p of planes) {
      p.el.classList.remove('rz-plane')
      p.el.style.removeProperty('--rz-z')
      p.el.style.removeProperty('--rz-s')
      p.el.style.removeProperty('--rz-d')
      p.el.style.removeProperty('--rz-o')
      tidy(p.el)
    }
  }

  const driftAt = (z: number) => (z >= 0 ? z * cfg.drift.near : z * cfg.drift.far)

  const apply = () => {
    clear()
    const raws = collect(root, { falloff: cfg.falloff, maxDepth: cfg.maxDepth, fan: cfg.fan, skip: cfg.skip, lift: cfg.lift })
    planes = fit(raws, cfg.span, cfg.origin, cfg.step)
    const p = cfg.perspective

    // Read every rect before writing anything, so the loop costs one layout
    // rather than one per plane.
    const box = stage.getBoundingClientRect()
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2
    const boxes = cfg.scaleCompensate ? planes.map((plane) => plane.el.getBoundingClientRect()) : []

    planes.forEach((plane, i) => {
      // A plane's own scale is applied to its descendants, so both its Z and
      // its drift are divided back out by whatever the ancestors already did.
      const parentScale = cfg.scaleCompensate ? 1 - plane.parentZ / p : 1
      const localZ = (plane.z - plane.parentZ) / parentScale
      const localDrift = (driftAt(plane.z) - driftAt(plane.parentZ)) / parentScale
      plane.el.style.setProperty('--rz-z', `${localZ.toFixed(2)}px`)
      plane.el.style.setProperty('--rz-d', `${localDrift.toFixed(2)}px`)
      if (cfg.scaleCompensate) {
        // Scaling about the stage center - the same point perspective projects
        // from - cancels the magnification in position as well as in size, so
        // a wrapped panel is identical until something actually moves.
        const r = boxes[i]!
        plane.el.style.setProperty('--rz-s', ((1 - plane.z / p) / (1 - plane.parentZ / p)).toFixed(5))
        plane.el.style.setProperty('--rz-o', `${(cx - r.left).toFixed(1)}px ${(cy - r.top).toFixed(1)}px`)
      }
      plane.el.classList.add('rz-plane')
    })
    for (const plane of planes) {
      plane.flattened = plane.level > 1 && flattener(plane.el) !== null
    }
  }

  /** The nearest ancestor between `el` and the stage that drops it out of 3D. */
  const flattener = (el: HTMLElement): { cause: string; culprit: HTMLElement } | null => {
    let node = el.parentElement
    while (node && node !== stage) {
      const style = getComputedStyle(node)
      const hit = FLATTENERS.find(([prop, bad]) => bad(String(style[prop])))
      if (hit) return { cause: `${String(hit[0])}: ${String(style[hit[0]])}`, culprit: node }
      node = node.parentElement
    }
    return null
  }

  // Motion state. The target is what input writes; the current value is what
  // the frame writes, so input never touches the DOM.
  const target = { x: 0, y: 0, mx: 50, my: 50 }
  const now = { x: 0, y: 0, mx: 50, my: 50 }

  const tick = (dt: number): boolean => {
    now.x = approach(now.x, target.x, cfg.ease, dt)
    now.y = approach(now.y, target.y, cfg.ease, dt)
    now.mx = approach(now.mx, target.mx, cfg.ease, dt)
    now.my = approach(now.my, target.my, cfg.ease, dt)
    stage.style.setProperty('--rz-px', now.x.toFixed(4))
    stage.style.setProperty('--rz-py', now.y.toFixed(4))
    stage.style.setProperty('--rz-mx', `${now.mx.toFixed(2)}%`)
    stage.style.setProperty('--rz-my', `${now.my.toFixed(2)}%`)
    return (
      Math.abs(now.x - target.x) > 1e-4 ||
      Math.abs(now.y - target.y) > 1e-4 ||
      Math.abs(now.mx - target.mx) > 1e-2 ||
      Math.abs(now.my - target.my) > 1e-2
    )
  }

  const ctx = {
    stage,
    set(x: number, y: number) {
      target.x = clamp(x)
      target.y = clamp(y)
      wake()
    },
    setSheen(mx: number, my: number) {
      target.mx = mx
      target.my = my
      wake()
    },
  }

  let driver: Driver | null = null
  let orientation: Driver | null = null
  let spec: DriverName | Driver | false = false
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')

  const build = (d: DriverName | Driver): Driver => {
    orientation = null
    if (typeof d !== 'string') return d
    if (d === 'scroll') return scrollDriver()
    if (d === 'orientation') return (orientation = orientationDriver())
    const pointer = pointerDriver(cfg.recenterOnLeave)
    if (d === 'pointer' || !orientationSupported()) return pointer
    orientation = orientationDriver()
    return fuse(pointer, orientation)
  }

  const attach = (d: DriverName | Driver | false) => {
    driver?.stop()
    driver = null
    spec = d
    if (d === false || reduced.matches) return
    driver = build(d)
    driver.start(ctx)
  }

  // Both the plane transform origins and the derived spacing are read off
  // layout, so anything that reflows the subtree has to re-place it.
  let pending = 0
  const schedule = () => {
    if (pending) return
    pending = requestAnimationFrame(() => {
      pending = 0
      apply()
    })
  }
  const observer = new MutationObserver(schedule)
  const resizer = new ResizeObserver(schedule)

  apply()
  join(tick)
  observer.observe(root, { childList: true, subtree: true })
  resizer.observe(stage)
  attach(options.driver ?? 'auto')

  return {
    stage,
    get planes() {
      return planes
    },
    refresh: apply,
    setDriver: attach,
    set: (x, y) => ctx.set(x, y),
    async enableOrientation() {
      const ok = await requestOrientationPermission()
      if (!ok) return false
      // Bring the sensor into the mix if it was left out, and otherwise restart
      // it in place so its listener is live now that the prompt has been
      // answered - without dropping the pointer it is fused with.
      if (!orientation) attach('auto')
      else {
        const fused = driver as { restart?: (d: Driver) => void }
        if (fused.restart) fused.restart(orientation)
        else attach(spec === false ? 'auto' : spec)
      }
      return true
    },
    calibrate() {
      const d = driver as { calibrate?: () => void } | null
      d?.calibrate?.()
    },
    diagnose() {
      const out: Array<{ el: HTMLElement; cause: string; culprit: HTMLElement }> = []
      for (const plane of planes) {
        const hit = plane.flattened ? flattener(plane.el) : null
        if (hit) out.push({ el: plane.el, ...hit })
      }
      return out
    },
    destroy() {
      observer.disconnect()
      resizer.disconnect()
      if (pending) cancelAnimationFrame(pending)
      driver?.stop()
      leave(tick)
      clear()
      planes = []
      stage.classList.remove('rz-stage', 'rz-window', 'rz-tilt')
      for (const prop of ['--rz-perspective', '--rz-swing', '--rz-tilt', '--rz-recoil', '--rz-px', '--rz-py', '--rz-mx', '--rz-my']) {
        stage.style.removeProperty(prop)
      }
      tidy(stage)
      if (deck) {
        deck.classList.remove('rz-deck')
        tidy(deck)
      }
      if (injectedDeck) {
        while (injectedDeck.firstChild) stage.appendChild(injectedDeck.firstChild)
        injectedDeck.remove()
      }
    },
  }
}
