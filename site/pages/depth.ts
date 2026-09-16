import type { DelaminateHandle } from 'delamin8r'
import { stage } from '../demos/specimen.js'
import { $, label } from '../lib/dom.js'
import { inspector } from '../lib/inspector.js'
import { snip } from '../lib/optionsnip.js'
import { Rig } from '../lib/rig.js'
import type { Page } from '../registry.js'

const DEPTHLESS = 7 // the slider's top notch means "no limit"

const depth: Page = {
  slug: 'depth',
  title: 'How depth is decided',
  nav: 'Depth',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>Nesting makes depth.<br /><em>Siblings tie.</em></h1>
        <p class="lede">
          A child sits one step in front of its parent, and each level of nesting steps by half
          as much as the one above it. Everything below is derived from the tree you already
          wrote — move a control and watch the Z column follow.
        </p>
      </div>

      <section>
        ${label(1, 'the inspector')}
        <div class="grid2">
          <div class="tagged">
            <p class="tag tag--on" id="state">delaminated</p>
            <div id="subject">${stage()}</div>
          </div>

          <div class="stack">
            <div class="controls">
              <p class="ctl"><label for="falloff">falloff</label>
                <input id="falloff" type="range" min="0.2" max="1" step="0.05" value="0.5" />
                <output id="falloffOut">0.50</output></p>
              <p class="ctl"><label for="maxDepth">max depth</label>
                <input id="maxDepth" type="range" min="1" max="${DEPTHLESS}" step="1" value="${DEPTHLESS}" />
                <output id="maxDepthOut">none</output></p>
              <p class="ctl"><label for="origin">origin</label>
                <input id="origin" type="range" min="0" max="0.6" step="0.05" value="0" />
                <output id="originOut">0.00</output></p>
              <p class="ctl ctl--check">
                <input id="scale" type="checkbox" checked />
                <label for="scale">counter-scale</label></p>
            </div>

            <div class="snip" id="snip"></div>

            <div class="push-row">
              <button class="push" type="button" id="wrap" aria-pressed="true">wrapped</button>
              <button class="push" type="button" id="reset">reset</button>
            </div>

            <div id="readout"></div>
          </div>
        </div>
        <p class="note">
          Hover a row to outline the element it stands for. Z is in pixels, measured from the
          container's own plane, and it always runs toward the viewer — an element pushed behind
          its parent would disappear into that parent's background.
        </p>
      </section>

      <section>
        ${label(2, 'what separates siblings')}
        <div class="prose">
          <p>
            Four rows in a list do not overlap, so the order the browser paints them in carries
            no depth, and staircasing them looks like a bug. Siblings land on one plane unless
            something actually separates them:
          </p>
        </div>
        <table>
          <thead><tr><th>separator</th><th>effect</th></tr></thead>
          <tbody>
            <tr><td><code>z-index</code></td>
              <td>each sibling that declares one is lifted a step clear of the tied plane, in the order it declared</td></tr>
            <tr><td>semantic lift</td>
              <td>buttons, links and form controls come forward a step and a half; badges, <code>mark</code> and <code>kbd</code> come forward two and a half</td></tr>
            <tr><td><code>data-dl-lift="3"</code></td>
              <td>say it yourself, on any element</td></tr>
          </tbody>
        </table>
        <p class="note">
          The two <code>button</code>s in the card's footer sit forward of the rows above them
          without anyone saying so. That is the semantic lift, and passing your own
          <code>lift</code> rules replaces it wholesale.
        </p>
      </section>

      <section>
        ${label(3, 'nothing moves until something moves')}
        <div class="prose">
          <p>
            <strong>Counter-scale</strong> is what makes wrapping free. Every plane is scaled
            about the stage center — the same point the perspective projects from — so the
            magnification depth would have added is canceled in position as well as in size.
          </p>
          <p>
            Press <em>wrapped</em> above to destroy the handle and put the DOM back. At rest
            nothing shifts by a pixel. Then turn counter-scale off and press it again: now the
            card jumps, because that is what depth without compensation looks like.
          </p>
        </div>
      </section>
    `

    const rig = new Rig()
    const subject = $('#subject', root)
    const insp = inspector($('#readout', root))
    const stateTag = $('#state', root)
    const wrapBtn = $('#wrap', root)

    const num = (id: string) => Number($<HTMLInputElement>(`#${id}`, root).value)
    const checked = (id: string) => $<HTMLInputElement>(`#${id}`, root).checked

    let handle: DelaminateHandle | null = null
    let wrapped = true

    const options = () => {
      const md = num('maxDepth')
      return {
        falloff: num('falloff'),
        maxDepth: md === DEPTHLESS ? undefined : md,
        origin: num('origin'),
        scaleCompensate: checked('scale'),
        driver: 'pointer' as const,
      }
    }

    /** Only what differs from the defaults, so the snippet reads like something to paste. */
    const written = () => {
      const o = options()
      return {
        falloff: o.falloff === 0.5 ? undefined : o.falloff,
        maxDepth: o.maxDepth,
        origin: o.origin === 0 ? undefined : o.origin,
        scaleCompensate: o.scaleCompensate ? undefined : false,
      }
    }

    function build() {
      if (handle) rig.drop(handle)
      handle = null

      stateTag.textContent = wrapped ? 'delaminated' : 'unwrapped'
      stateTag.className = wrapped ? 'tag tag--on' : 'tag'
      wrapBtn.textContent = wrapped ? 'wrapped' : 'unwrapped'
      wrapBtn.setAttribute('aria-pressed', String(wrapped))

      $('#falloffOut', root).textContent = num('falloff').toFixed(2)
      $('#originOut', root).textContent = num('origin').toFixed(2)
      $('#maxDepthOut', root).textContent = num('maxDepth') === DEPTHLESS ? 'none' : String(num('maxDepth'))

      $('#snip', root).innerHTML = snip('panel', written())
      if (!wrapped) {
        insp.clear()
        return
      }
      handle = rig.now($('.stagewrap', subject), options())
      insp.update(handle)
    }

    const onInput = () => build()
    for (const id of ['falloff', 'maxDepth', 'origin', 'scale']) {
      $(`#${id}`, root).addEventListener('input', onInput)
    }

    const onWrap = () => {
      wrapped = !wrapped
      build()
    }
    wrapBtn.addEventListener('click', onWrap)

    const onReset = () => {
      $<HTMLInputElement>('#falloff', root).value = '0.5'
      $<HTMLInputElement>('#maxDepth', root).value = String(DEPTHLESS)
      $<HTMLInputElement>('#origin', root).value = '0'
      $<HTMLInputElement>('#scale', root).checked = true
      wrapped = true
      build()
    }
    $('#reset', root).addEventListener('click', onReset)

    build()
    rig.audit('depth')

    return () => {
      insp.destroy()
      rig.destroy()
    }
  },
}

export default depth
