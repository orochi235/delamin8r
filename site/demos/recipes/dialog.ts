import { delaminate } from 'delamin8r'
import type { Example } from '../../lib/example.js'
import source from './dialog.ts?highlight'

// #region recipe
const MARKUP = `
  <div class="rc-dialog">
    <h4>Discard this draft?</h4>
    <p>It has not been saved anywhere yet.</p>
    <div class="card__foot">
      <button class="btn btn--go" type="button">discard</button>
      <button class="btn" type="button">keep</button>
    </div>
  </div>
`

function mount(host: HTMLElement) {
  host.innerHTML = MARKUP
  // recenterOnLeave: false tracks the whole window, which is what a modal wants
  // when the pointer is out over the backdrop rather than on the dialog.
  const handle = delaminate(host, { mode: 'tilt', tilt: 9, recenterOnLeave: false })
  return () => handle.destroy()
}
// #endregion

export default {
  id: 'dialog',
  title: 'A dialog over a backdrop',
  note: 'Where this library came from. The buttons come forward on their own — that is the semantic lift, not markup.',
  source,
  mount,
} satisfies Example
