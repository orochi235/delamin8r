import { delaminate } from 'delamin8r'
import type { Example } from '../../lib/example.js'
import source from './hover-card.ts?highlight'

// #region recipe
const MARKUP = `
  <div class="rc-card">
    <h4>Tipping card</h4>
    <p>The wrapper holds the perspective. The card inside it is what turns.</p>
    <button class="btn btn--go" type="button">open</button>
  </div>
`

function mount(host: HTMLElement) {
  host.innerHTML = MARKUP
  // tilt needs a second element; the single child is used rather than injected.
  const handle = delaminate(host, { mode: 'tilt', tilt: 14 })
  return () => handle.destroy()
}
// #endregion

export default {
  id: 'hover-card',
  title: 'A card that tips',
  note: 'The classic. One child, so nothing is injected — the card itself becomes the deck.',
  source,
  mount,
} satisfies Example
