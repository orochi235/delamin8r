import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { delaminate } from '../src/delaminate.js'
import { setReducedMotion, setVisibility } from './setup.js'
import type { Driver } from '../src/types.js'

const frame = () => new Promise((r) => requestAnimationFrame(r))

/** jsdom measures nothing, so a box has to be handed to the element. */
function size(el: HTMLElement, width: number, height: number): void {
  el.getBoundingClientRect = () => new DOMRect(0, 0, width, height)
}

function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="panel">${html}</div>`
  return document.getElementById('panel')!
}

const perspective = (el: HTMLElement) => el.style.getPropertyValue('--dl-perspective')
const swing = (el: HTMLElement) => el.style.getPropertyValue('--dl-swing')

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('delaminate', () => {
  it('puts the DOM back exactly as it was', () => {
    const before = '<h2>Title</h2><p>Body <a href="#">link</a></p>'
    const panel = mount(before)
    const handle = delaminate(panel, { driver: false })
    expect(panel.innerHTML).not.toBe(before)
    handle.destroy()
    expect(panel.outerHTML).toBe(`<div id="panel">${before}</div>`)
  })

  it('leaves no empty class or style attribute behind', () => {
    const panel = mount('<span>x</span>')
    delaminate(panel, { driver: false }).destroy()
    expect(panel.hasAttribute('class')).toBe(false)
    expect(panel.hasAttribute('style')).toBe(false)
  })

  it('makes every element in the subtree a plane', () => {
    const panel = mount('<div><span>a</span></div><span>b</span>')
    const handle = delaminate(panel, { driver: false })
    expect(handle.planes).toHaveLength(3)
    expect(handle.planes.every((p) => p.el.classList.contains('dl-plane'))).toBe(true)
    handle.destroy()
  })

  it('marks a plane with nothing under it as a leaf, so its subtree stays out of 3D', () => {
    const panel = mount('<div><span>a</span></div><span>b</span>')
    const handle = delaminate(panel, { driver: false })
    const [outer, inner, sibling] = handle.planes.map((p) => p.el)
    expect(outer!.classList.contains('dl-leaf')).toBe(false)
    expect(inner!.classList.contains('dl-leaf')).toBe(true)
    expect(sibling!.classList.contains('dl-leaf')).toBe(true)
    handle.destroy()
    expect(panel.querySelector('.dl-leaf')).toBe(null)
  })

  it('scales the depth to the container it is given', () => {
    const panel = mount('<span>x</span>')
    size(panel, 1000, 400)
    const handle = delaminate(panel, { driver: false })
    // 1.4x the long edge, clamped to 1400; swing is 0.18 of it.
    expect(perspective(panel)).toBe('1400px')
    expect(swing(panel)).toBe('180.0px')
    handle.destroy()
  })

  it('re-derives the depth when the container changes size', () => {
    const panel = mount('<span>x</span>')
    size(panel, 320, 200)
    const handle = delaminate(panel, { driver: false })
    const small = perspective(panel)

    size(panel, 1200, 800)
    handle.refresh()
    expect(perspective(panel)).not.toBe(small)
    expect(swing(panel)).toBe('216.0px')
    handle.destroy()
  })

  it('holds an explicit perspective against a resize', () => {
    const panel = mount('<span>x</span>')
    size(panel, 320, 200)
    const handle = delaminate(panel, { driver: false, perspective: 900 })
    size(panel, 1200, 800)
    handle.refresh()
    expect(perspective(panel)).toBe('900px')
    handle.destroy()
  })

  it('picks up content added after it was wrapped', async () => {
    const panel = mount('<span>a</span>')
    const handle = delaminate(panel, { driver: false })
    panel.appendChild(document.createElement('span'))
    await frame()
    expect(handle.planes).toHaveLength(2)
    handle.destroy()
  })

  it('re-places a plane when an attribute changes its depth', async () => {
    const panel = mount('<span id="a">a</span>')
    const handle = delaminate(panel, { driver: false, step: 10 })
    expect(handle.planes[0]!.z).toBe(10)

    // `.badge` carries a lift of 2.5 - nothing added or removed a node.
    document.getElementById('a')!.className = 'badge'
    await frame()
    expect(handle.planes[0]!.z).toBe(35)
    handle.destroy()
  })

  it('does not re-place itself while the frame loop is running', async () => {
    const panel = mount('<span>a</span>')
    const handle = delaminate(panel, { driver: false, ease: 0.1 })
    const first = handle.planes
    handle.set(1, 1)
    for (let i = 0; i < 6; i++) await frame()
    // A re-place swaps the array; the loop writing the stage's own style must
    // not look like a content change.
    expect(handle.planes).toBe(first)
    handle.destroy()
  })

  it('reports what is flattening a plane, reading the DOM as it is now', () => {
    const panel = mount('<div id="wrap"><span id="a">a</span></div>')
    const handle = delaminate(panel, { driver: false })
    expect(handle.diagnose()).toHaveLength(0)

    document.getElementById('wrap')!.style.overflow = 'hidden'
    const flat = handle.diagnose()
    expect(flat).toHaveLength(1)
    expect(flat[0]!.cause).toBe('overflow: hidden')
    expect(handle.planes.find((p) => p.el.id === 'a')!.flattened).toBe(true)
    handle.destroy()
  })
})

describe('pausing off-screen', () => {
  const spy = (): Driver & { started: number; stopped: number } => {
    const d = { started: 0, stopped: 0, start: () => void d.started++, stop: () => void d.stopped++ }
    return d
  }

  it('drops the driver when the container scrolls out of view', () => {
    const panel = mount('<span>a</span>')
    const driver = spy()
    const handle = delaminate(panel, { driver })
    expect(driver.started).toBe(1)

    setVisibility(false)
    expect(driver.stopped).toBe(1)

    setVisibility(true)
    expect(driver.started).toBe(2)
    handle.destroy()
  })

  it('stays put when the option is off', () => {
    const panel = mount('<span>a</span>')
    const driver = spy()
    const handle = delaminate(panel, { driver, pauseOffscreen: false })
    setVisibility(false)
    expect(driver.stopped).toBe(0)
    handle.destroy()
  })

  it('lets go of the observer on destroy', () => {
    const panel = mount('<span>a</span>')
    const driver = spy()
    delaminate(panel, { driver }).destroy()
    const stoppedByDestroy = driver.stopped
    setVisibility(false)
    expect(driver.stopped).toBe(stoppedByDestroy)
  })
})

describe('reduced motion', () => {
  afterEach(() => setReducedMotion(false))

  it('attaches no driver while it is on', () => {
    setReducedMotion(true)
    const panel = mount('<span>a</span>')
    const start = vi.fn()
    const handle = delaminate(panel, { driver: { start, stop() {} } })
    expect(start).not.toHaveBeenCalled()
    handle.destroy()
  })

  it('follows the setting being changed mid-session', () => {
    const panel = mount('<span>a</span>')
    const start = vi.fn()
    const stop = vi.fn()
    const handle = delaminate(panel, { driver: { start, stop } })
    expect(start).toHaveBeenCalledOnce()

    setReducedMotion(true)
    expect(stop).toHaveBeenCalledOnce()

    setReducedMotion(false)
    expect(start).toHaveBeenCalledTimes(2)
    handle.destroy()
  })

  it('clamps a deflection pushed in directly to the unit square', async () => {
    const panel = mount('<span>x</span>')
    const handle = delaminate(panel, { driver: false, ease: 1 })
    handle.set(5, -5)
    await new Promise((r) => requestAnimationFrame(r))
    expect(panel.style.getPropertyValue('--dl-px')).toBe('1.0000')
    expect(panel.style.getPropertyValue('--dl-py')).toBe('-1.0000')
    handle.destroy()
  })
})

describe('tilt mode', () => {
  it('wraps the children in a deck and unwraps them again', () => {
    const before = '<h2>Card</h2><p>Body</p>'
    const panel = mount(before)
    const handle = delaminate(panel, { mode: 'tilt', driver: false })
    expect(panel.children).toHaveLength(1)
    expect(panel.firstElementChild!.classList.contains('dl-deck')).toBe(true)
    handle.destroy()
    expect(panel.outerHTML).toBe(`<div id="panel">${before}</div>`)
  })

  it('uses an only child as the deck rather than injecting one', () => {
    const panel = mount('<article>Card</article>')
    const deck = panel.firstElementChild!
    const handle = delaminate(panel, { mode: 'tilt', driver: false })
    expect(panel.firstElementChild).toBe(deck)
    expect(deck.classList.contains('dl-deck')).toBe(true)
    handle.destroy()
    expect(panel.outerHTML).toBe('<div id="panel"><article>Card</article></div>')
  })
})
