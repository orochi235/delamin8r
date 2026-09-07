import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { reticulize } from '../src/reticulize.js'

/** jsdom measures nothing, so a box has to be handed to the element. */
function size(el: HTMLElement, width: number, height: number): void {
  el.getBoundingClientRect = () => new DOMRect(0, 0, width, height)
}

function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="panel">${html}</div>`
  return document.getElementById('panel')!
}

const perspective = (el: HTMLElement) => el.style.getPropertyValue('--rz-perspective')
const swing = (el: HTMLElement) => el.style.getPropertyValue('--rz-swing')

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('reticulize', () => {
  it('puts the DOM back exactly as it was', () => {
    const before = '<h2>Title</h2><p>Body <a href="#">link</a></p>'
    const panel = mount(before)
    const handle = reticulize(panel, { driver: false })
    expect(panel.innerHTML).not.toBe(before)
    handle.destroy()
    expect(panel.outerHTML).toBe(`<div id="panel">${before}</div>`)
  })

  it('leaves no empty class or style attribute behind', () => {
    const panel = mount('<span>x</span>')
    reticulize(panel, { driver: false }).destroy()
    expect(panel.hasAttribute('class')).toBe(false)
    expect(panel.hasAttribute('style')).toBe(false)
  })

  it('makes every element in the subtree a plane', () => {
    const panel = mount('<div><span>a</span></div><span>b</span>')
    const handle = reticulize(panel, { driver: false })
    expect(handle.planes).toHaveLength(3)
    expect(handle.planes.every((p) => p.el.classList.contains('rz-plane'))).toBe(true)
    handle.destroy()
  })

  it('scales the depth to the container it is given', () => {
    const panel = mount('<span>x</span>')
    size(panel, 1000, 400)
    const handle = reticulize(panel, { driver: false })
    // 1.4x the long edge, clamped to 1400; swing is 0.18 of it.
    expect(perspective(panel)).toBe('1400px')
    expect(swing(panel)).toBe('180.0px')
    handle.destroy()
  })

  it('re-derives the depth when the container changes size', () => {
    const panel = mount('<span>x</span>')
    size(panel, 320, 200)
    const handle = reticulize(panel, { driver: false })
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
    const handle = reticulize(panel, { driver: false, perspective: 900 })
    size(panel, 1200, 800)
    handle.refresh()
    expect(perspective(panel)).toBe('900px')
    handle.destroy()
  })

  it('picks up content added after it was wrapped', async () => {
    const panel = mount('<span>a</span>')
    const handle = reticulize(panel, { driver: false })
    panel.appendChild(document.createElement('span'))
    await new Promise((r) => requestAnimationFrame(r))
    expect(handle.planes).toHaveLength(2)
    handle.destroy()
  })

  it('clamps a deflection pushed in directly to the unit square', async () => {
    const panel = mount('<span>x</span>')
    const handle = reticulize(panel, { driver: false, ease: 1 })
    handle.set(5, -5)
    await new Promise((r) => requestAnimationFrame(r))
    expect(panel.style.getPropertyValue('--rz-px')).toBe('1.0000')
    expect(panel.style.getPropertyValue('--rz-py')).toBe('-1.0000')
    handle.destroy()
  })
})

describe('tilt mode', () => {
  it('wraps the children in a deck and unwraps them again', () => {
    const before = '<h2>Card</h2><p>Body</p>'
    const panel = mount(before)
    const handle = reticulize(panel, { mode: 'tilt', driver: false })
    expect(panel.children).toHaveLength(1)
    expect(panel.firstElementChild!.classList.contains('rz-deck')).toBe(true)
    handle.destroy()
    expect(panel.outerHTML).toBe(`<div id="panel">${before}</div>`)
  })

  it('uses an only child as the deck rather than injecting one', () => {
    const panel = mount('<article>Card</article>')
    const deck = panel.firstElementChild!
    const handle = reticulize(panel, { mode: 'tilt', driver: false })
    expect(panel.firstElementChild).toBe(deck)
    expect(deck.classList.contains('rz-deck')).toBe(true)
    handle.destroy()
    expect(panel.outerHTML).toBe('<div id="panel"><article>Card</article></div>')
  })
})
