import { delaminate } from 'delamin8r'
import type { Example } from '../../lib/example.js'
import source from './sheen.ts?highlight'

// #region recipe
const MARKUP = `
  <div class="rc-card rc-sheenwrap">
    <div class="rc-shine" data-dl-skip></div>
    <h4>Surface highlight</h4>
    <p>The gradient reads the pointer straight off the container.</p>
  </div>
`

// .rc-shine is positioned over the card, and:
//   background: radial-gradient(300px circle at var(--dl-mx) var(--dl-my), …)
function mount(host: HTMLElement) {
  host.innerHTML = MARKUP
  const handle = delaminate(host, { mode: 'tilt' })
  return () => handle.destroy()
}
// #endregion

export default {
  id: 'sheen',
  title: 'A sheen that follows the pointer',
  note: '--dl-mx and --dl-my track the pointer over the container as percentages. The sheen layer carries data-dl-skip so it stays flat against the surface instead of floating off it.',
  source,
  mount,
} satisfies Example
