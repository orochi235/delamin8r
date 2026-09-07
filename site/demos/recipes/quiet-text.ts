import { delaminate } from 'delamin8r'
import type { Example } from '../../lib/example.js'
import source from './quiet-text.ts?highlight'

// #region recipe
const MARKUP = `
  <div class="rc-text">
    <h4>Text stays put</h4>
    <p>Every plane is a composited layer, and text on one loses subpixel rendering.</p>
    <p>maxDepth: 1 lifts the panel's own blocks and leaves everything inside them flat.</p>
  </div>
`

function mount(host: HTMLElement) {
  host.innerHTML = MARKUP
  const handle = delaminate(host, { maxDepth: 1, step: 14 })
  return () => handle.destroy()
}
// #endregion

export default {
  id: 'quiet-text',
  title: 'Depth without wrecking the type',
  note: 'The honest limit of the effect. One level of lift reads as depth; running paragraphs through it just makes them fuzzy.',
  source,
  mount,
} satisfies Example
