import { describe, expect, it } from 'vitest'
import { CSS, injectStyles, styleRootFor } from '../src/styles.js'
import { delaminate } from '../src/delaminate.js'

const tag = (doc: Document) => doc.querySelector('style[data-delamin8r]')

function blank(): Document {
  return document.implementation.createHTMLDocument('test')
}

describe('injectStyles', () => {
  it('injects once per document, not once per process', () => {
    const one = blank()
    const two = blank()
    injectStyles(one)
    injectStyles(two)
    expect(tag(one)).not.toBeNull()
    expect(tag(two)).not.toBeNull()
  })

  it('does not stack sheets on a document it has already done', () => {
    const doc = blank()
    injectStyles(doc)
    injectStyles(doc)
    expect(doc.querySelectorAll('style[data-delamin8r]')).toHaveLength(1)
  })

  it('writes the stylesheet the build emits', () => {
    const doc = blank()
    injectStyles(doc)
    expect(tag(doc)!.textContent).toBe(CSS)
  })

  it('puts the sheet in the shadow root, where the container can see it', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<div id="panel"><span>x</span></div>'

    const handle = delaminate(shadow.getElementById('panel') as HTMLElement, { driver: false })
    // Document styles do not cross the boundary, so a sheet left outside is a
    // sheet the planes never get.
    expect(shadow.querySelector('style[data-delamin8r]')).not.toBeNull()
    handle.destroy()
    host.remove()
  })

  it('resolves the scope an element actually takes its styles from', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<span id="inner"></span>'
    expect(styleRootFor(shadow.getElementById('inner')!)).toBe(shadow)
    expect(styleRootFor(host)).toBe(document)

    // Not in a tree yet: the document it was made from is the best answer.
    expect(styleRootFor(document.createElement('div'))).toBe(document)
    host.remove()
  })
})
