import { beforeEach, describe, expect, it } from 'vitest'
import { collect, DEFAULT_LIFT, fit } from '../src/depth.js'

const OPTS = { falloff: 0.5, maxDepth: Infinity, lift: [] as never[] }

function tree(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`
  return document.getElementById('root')!
}

/** Raw depth keyed by the element's id, for assertions that read as the rule. */
function raws(root: HTMLElement, opts: Partial<Parameters<typeof collect>[1]> = {}) {
  const out: Record<string, number> = {}
  for (const r of collect(root, { ...OPTS, ...opts })) out[r.el.id] = r.raw
  return out
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('collect', () => {
  it('steps a child one unit in front of its parent', () => {
    expect(raws(tree('<div id="a"></div>'))).toEqual({ a: 1 })
  })

  it('halves the spacing at each level of nesting', () => {
    const z = raws(tree('<div id="a"><div id="b"><div id="c"></div></div></div>'))
    expect(z).toEqual({ a: 1, b: 1.5, c: 1.75 })
  })

  it('applies a custom falloff', () => {
    const z = raws(tree('<div id="a"><div id="b"></div></div>'), { falloff: 0.25 })
    expect(z).toEqual({ a: 1, b: 1.25 })
  })

  it('ties siblings on one plane', () => {
    const z = raws(tree('<i id="a"></i><i id="b"></i><i id="c"></i>'))
    expect(z).toEqual({ a: 1, b: 1, c: 1 })
  })

  it('lifts each sibling that declares a z-index, in declared order', () => {
    const z = raws(tree('<i id="a"></i><i id="b" style="z-index:5"></i><i id="c" style="z-index:2"></i>'))
    // c declares the lower z-index, so it takes the first step above the tie.
    expect(z).toEqual({ a: 1, b: 3, c: 2 })
  })

  it('honors data-dl-lift, in preference to a matching rule', () => {
    const z = raws(tree('<button id="a" data-dl-lift="4"></button>'), { lift: DEFAULT_LIFT })
    expect(z).toEqual({ a: 5 })
  })

  it('lifts interactive elements a step and a half by default', () => {
    const z = raws(tree('<button id="a"></button><span id="b"></span>'), { lift: DEFAULT_LIFT })
    expect(z).toEqual({ a: 2.5, b: 1 })
  })

  it('takes the strongest matching lift rule, not the first', () => {
    const z = raws(tree('<a id="a" href="#" class="badge"></a>'), { lift: DEFAULT_LIFT })
    expect(z).toEqual({ a: 3.5 })
  })

  it('skips a marked element and everything under it', () => {
    const z = raws(tree('<div id="a" data-dl-skip><div id="b"></div></div><div id="c"></div>'))
    expect(z).toEqual({ c: 1 })
  })

  it('skips what the skip selector matches', () => {
    const z = raws(tree('<div id="a" class="flat"><div id="b"></div></div><div id="c"></div>'), { skip: '.flat' })
    expect(z).toEqual({ c: 1 })
  })

  it('ignores elements that never paint', () => {
    const z = raws(tree('<script id="a"></script><style id="b"></style><br id="c"><i id="d"></i>'))
    expect(z).toEqual({ d: 1 })
  })

  it('stops descending at maxDepth', () => {
    const z = raws(tree('<div id="a"><div id="b"><div id="c"></div></div></div>'), { maxDepth: 2 })
    expect(z).toEqual({ a: 1, b: 1.5 })
  })
})

describe('fit', () => {
  const at = (planes: ReturnType<typeof fit>, id: string) => planes.find((p) => p.el.id === id)!

  it('maps the deepest plane onto the full span', () => {
    const planes = fit(collect(tree('<div id="a"><div id="b"></div></div>'), OPTS), 300, 0, undefined)
    expect(at(planes, 'b').z).toBeCloseTo(300)
    expect(at(planes, 'a').z).toBeCloseTo(200)
  })

  it('uses step as an absolute spacing when given, ignoring span', () => {
    const planes = fit(collect(tree('<div id="a"><div id="b"></div></div>'), OPTS), 300, 0, 40)
    expect(at(planes, 'a').z).toBeCloseTo(40)
    expect(at(planes, 'b').z).toBeCloseTo(60)
  })

  it('slides the stack back by the origin fraction', () => {
    const planes = fit(collect(tree('<div id="a"></div>'), OPTS), 100, 0.5, undefined)
    expect(at(planes, 'a').z).toBeCloseTo(50)
  })

  it('holds the top level against a true zero however far origin slides', () => {
    const planes = fit(collect(tree('<div id="a"><div id="b"></div></div>'), OPTS), 300, 0.5, undefined)
    expect(at(planes, 'a').parentZ).toBe(0)
    expect(at(planes, 'b').parentZ).toBeCloseTo(at(planes, 'a').z)
  })

  it('survives an empty subtree', () => {
    expect(fit([], 300, 0, undefined)).toEqual([])
  })
})
