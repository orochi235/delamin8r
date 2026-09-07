import { delaminate } from 'delamin8r'
import type { Example } from '../../lib/example.js'
import source from './fan-table.ts?highlight'

// #region recipe
const MARKUP = `
  <div class="rc-list">
    <div>build <b>42s</b></div>
    <div>typecheck <b>clean</b></div>
    <div>unit <b>318</b></div>
    <div>bundle <b>21.4 kB</b></div>
  </div>
`

function mount(host: HTMLElement) {
  host.innerHTML = MARKUP
  // Rows tie by default, because rows that do not overlap carry no depth.
  // fan says you want them staircased anyway.
  const handle = delaminate(host, { fan: 1, step: 9 })
  return () => handle.destroy()
}
// #endregion

export default {
  id: 'fan-table',
  title: 'A list you actually want staircased',
  note: 'fan is off by default. Turning it on is a decision about this list, not a default anyone should inherit.',
  source,
  mount,
} satisfies Example
