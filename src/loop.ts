type Tick = (dt: number) => boolean

const ticks = new Set<Tick>()
let raf = 0
let last = 0

function frame(now: number): void {
  const dt = last === 0 ? 16.667 : Math.min(now - last, 50)
  last = now
  let moving = false
  for (const tick of ticks) {
    if (tick(dt)) moving = true
  }
  if (moving && ticks.size > 0) {
    raf = requestAnimationFrame(frame)
  } else {
    raf = 0
    last = 0
  }
}

export function join(tick: Tick): void {
  ticks.add(tick)
  wake()
}

export function leave(tick: Tick): void {
  ticks.delete(tick)
  if (ticks.size === 0 && raf !== 0) {
    cancelAnimationFrame(raf)
    raf = 0
    last = 0
  }
}

/** Restart the loop after input. It stops on its own once everything settles. */
export function wake(): void {
  if (raf === 0 && ticks.size > 0) {
    last = 0
    raf = requestAnimationFrame(frame)
  }
}

/** Frame-rate independent easing: `ease` is the fraction consumed per 60Hz frame. */
export function approach(current: number, target: number, ease: number, dt: number): number {
  const k = 1 - Math.pow(1 - ease, dt / 16.667)
  return current + (target - current) * k
}
