import { afterEach, describe, expect, it, vi } from 'vitest'
import { approach, join, leave, wake } from '../src/loop.js'

describe('approach', () => {
  it('consumes the given fraction in one 60Hz frame', () => {
    expect(approach(0, 1, 0.5, 16.667)).toBeCloseTo(0.5, 5)
  })

  it('is frame-rate independent', () => {
    const twoFrames = approach(approach(0, 1, 0.25, 16.667), 1, 0.25, 16.667)
    expect(approach(0, 1, 0.25, 33.334)).toBeCloseTo(twoFrames, 10)
  })

  it('snaps at full ease', () => {
    expect(approach(0, 1, 1, 16.667)).toBe(1)
  })

  it('never overshoots a long frame', () => {
    expect(approach(0, 1, 0.5, 500)).toBeLessThanOrEqual(1)
  })

  it('closes on the target from either side', () => {
    expect(approach(1, -1, 0.5, 16.667)).toBeCloseTo(0, 5)
  })
})

describe('the shared frame loop', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs ticks while they report movement and stops when they settle', () => {
    vi.useFakeTimers()
    let left = 3
    const tick = vi.fn(() => --left > 0)
    join(tick)
    vi.advanceTimersByTime(200)
    expect(tick).toHaveBeenCalledTimes(3)

    // Settled: no further frames until something wakes it.
    vi.advanceTimersByTime(200)
    expect(tick).toHaveBeenCalledTimes(3)

    left = 2
    wake()
    vi.advanceTimersByTime(200)
    expect(tick).toHaveBeenCalledTimes(5)
    leave(tick)
  })

  it('stops calling a tick that has left', () => {
    vi.useFakeTimers()
    const tick = vi.fn(() => true)
    join(tick)
    vi.advanceTimersByTime(50)
    const seen = tick.mock.calls.length
    leave(tick)
    vi.advanceTimersByTime(200)
    expect(tick).toHaveBeenCalledTimes(seen)
  })
})
