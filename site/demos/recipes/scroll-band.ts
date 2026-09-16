import { delaminate } from 'delamin8r'
import type { Example } from '../../lib/example.js'
import source from './scroll-band.ts?highlight'

// #region recipe
const MARKUP = `
  <div class="rc-band">
    <span>driven by scroll</span>
    <h4>No pointer required</h4>
  </div>
`

function mount(host: HTMLElement) {
  host.innerHTML = MARKUP
  const handle = delaminate(host, { driver: 'scroll' })
  return () => handle.destroy()
}
// #endregion

export default {
  id: 'scroll-band',
  title: 'Driven by the scroll position',
  note: 'For a band that should move as the page does rather than as the pointer does. Scroll this page and watch it, without touching it.',
  source,
  mount,
} satisfies Example
