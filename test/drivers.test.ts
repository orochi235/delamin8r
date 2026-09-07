import { describe, expect, it, vi } from 'vitest'
import { fuse } from '../src/drivers.js'
import type { Driver, DriverContext } from '../src/types.js'

/** A driver whose readings the test pushes in by hand. */
function manual() {
  let ctx: DriverContext | null = null
  const driver: Driver = {
    start(c) {
      ctx = c
    },
    stop() {
      ctx = null
    },
  }
  return {
    driver,
    move: (x: number, y: number) => ctx?.set(x, y),
    sheen: (mx: number, my: number) => ctx?.setSheen?.(mx, my),
  }
}

function rig() {
  const a = manual()
  const b = manual()
  const set = vi.fn()
  const setSheen = vi.fn()
  const fused = fuse(a.driver, b.driver)
  fused.start({ stage: document.createElement('div'), set, setSheen })
  return { a, b, set, setSheen, fused }
}

describe('fuse', () => {
  it('gives control to the first source that reports', () => {
    const { a, set } = rig()
    a.move(0.5, 0)
    expect(set).toHaveBeenCalledWith(0.5, 0)
  })

  it("treats a second source's first reading as a baseline, not a claim", () => {
    const { a, b, set } = rig()
    a.move(0.5, 0)
    set.mockClear()
    // An accelerometer starts reporting the moment it is listened to; that
    // reading is where the device already was, not a move.
    b.move(-1, -1)
    expect(set).not.toHaveBeenCalled()
  })

  it('hands over to a source that actually moves', () => {
    const { a, b, set } = rig()
    a.move(0, 0)
    b.move(0, 0)
    set.mockClear()
    b.move(0.2, 0)
    expect(set).toHaveBeenCalledWith(0.2, 0)
  })

  it('leaves control alone while a source only drifts', () => {
    const { a, b, set } = rig()
    a.move(0, 0)
    b.move(0, 0)
    set.mockClear()
    for (let i = 1; i <= 50; i++) b.move(i * 0.001, 0)
    expect(set).not.toHaveBeenCalled()
  })

  it('does not let the losing source snatch control straight back', () => {
    const { a, b, set } = rig()
    a.move(0, 0)
    b.move(0, 0)
    // a builds up energy, then b takes over.
    for (let i = 1; i <= 10; i++) a.move(i * 0.1, 0)
    b.move(0.5, 0)
    set.mockClear()
    // a is now still: one small twitch must not be enough to win it back.
    a.move(1.01, 0)
    expect(set).not.toHaveBeenCalled()
  })

  it('forwards the sheen only from the source in control', () => {
    const { a, b, setSheen } = rig()
    a.move(0, 0)
    b.move(0, 0)
    setSheen.mockClear()
    b.sheen(10, 10)
    expect(setSheen).not.toHaveBeenCalled()
    a.sheen(20, 30)
    expect(setSheen).toHaveBeenCalledWith(20, 30)
  })

  it('rebaselines every source after a stop, so control is up for grabs again', () => {
    const { a, b, fused, set } = rig()
    a.move(0, 0)
    b.move(0, 0)
    fused.stop()
    fused.start({ stage: document.createElement('div'), set })
    set.mockClear()
    // Nobody holds control, so whoever reports first takes it - and a's old
    // baseline is gone, so its next reading cannot take it straight back.
    b.move(0.9, 0.9)
    expect(set).toHaveBeenCalledWith(0.9, 0.9)
    set.mockClear()
    a.move(0.1, 0)
    expect(set).not.toHaveBeenCalled()
  })

  it('restarts one source in place without disturbing the other', () => {
    const { a, b, fused, set } = rig()
    a.move(0, 0)
    fused.restart(b.driver)
    set.mockClear()
    b.move(0.4, 0)
    expect(set).not.toHaveBeenCalled()
    b.move(0.5, 0)
    expect(set).toHaveBeenCalledWith(0.5, 0)
  })

  it('passes calibrate through to whichever sources have one', () => {
    const calibrate = vi.fn()
    const plain = manual().driver
    const sensor = { ...manual().driver, calibrate }
    const fused = fuse(plain, sensor)
    fused.calibrate()
    expect(calibrate).toHaveBeenCalledOnce()
  })
})
