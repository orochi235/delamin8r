import { describe, expect, it } from 'vitest'
import { CSS, injectStyles } from '../src/styles.js'

const tag = (doc: Document) => doc.querySelector('style[data-reticul8r]')

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
    expect(doc.querySelectorAll('style[data-reticul8r]')).toHaveLength(1)
  })

  it('writes the stylesheet the build emits', () => {
    const doc = blank()
    injectStyles(doc)
    expect(tag(doc)!.textContent).toBe(CSS)
  })
})
