import type { DelaminateHandle } from 'delamin8r'
import { SPECIMEN } from '../demos/specimen.js'
import { $, label } from '../lib/dom.js'
import { inspector } from '../lib/inspector.js'
import { Rig } from '../lib/rig.js'
import type { Page } from '../registry.js'

/** Every property that forces `transform-style` to a used value of flat. */
const FLATTENERS: Array<[string, string]> = [
  ['f-overflow', 'overflow: hidden'],
  ['f-opacity', 'opacity: 0.99'],
  ['f-filter', 'filter: saturate(1.05)'],
  ['f-contain', 'contain: paint'],
  ['f-blend', 'mix-blend-mode: multiply'],
  ['f-isolation', 'isolation: isolate'],
  ['f-clip', 'clip-path: inset(0)'],
]

const flattening: Page = {
  slug: 'flattening',
  title: 'The silent failure',
  nav: 'Flattening',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>The failure you <em>cannot see</em>.</h1>
        <p class="lede">
          Nine ordinary CSS properties force a subtree out of 3D. Nothing throws, nothing
          warns, and the computed <code>transform-style</code> still reads
          <code>preserve-3d</code> — so the only symptom is that the depth you asked for quietly
          is not there.
        </p>
      </div>

      <section>
        ${label(1, 'break it on purpose')}
        <div class="grid2">
          <div class="tagged">
            <p class="tag" id="applied">no flattener applied</p>
            <div class="stagewrap" id="subject">
              <div class="wrapbox" id="culprit">${SPECIMEN}</div>
            </div>
          </div>
          <div class="stack">
            <div class="push-row" id="switches"></div>
            <div id="readout"></div>
            <p class="blurb">
              The dashed box is an ordinary wrapper between the container and the card. Put any
              one of these on it and every plane below it stops rendering at depth. The card
              keeps its <code>--dl-z</code>; the browser just stops honoring it.
            </p>
          </div>
        </div>
      </section>

      <section>
        ${label(2, 'how to find it')}
        <div class="prose">
          <p>
            <code>handle.diagnose()</code> walks each plane's ancestors up to the container and
            names the first one that flattens it — the property, its value, and the element.
            That is the readout above; it is the same call you would make from the console.
          </p>
          <p>
            The check has to be by property name. Asking the browser for
            <code>transform-style</code> is no use, because it answers
            <code>preserve-3d</code> whether or not the used value is flat.
          </p>
        </div>
      </section>

      <section>
        ${label(3, 'the full list')}
        <table>
          <thead><tr><th>property</th><th>flattens when</th></tr></thead>
          <tbody>
            <tr><td><code>overflow</code></td><td>anything but <code>visible</code>, including <code>auto</code> on a scroller</td></tr>
            <tr><td><code>opacity</code></td><td>below 1 — a fade-in animation counts, while it runs</td></tr>
            <tr><td><code>filter</code></td><td>not <code>none</code></td></tr>
            <tr><td><code>backdrop-filter</code></td><td>not <code>none</code></td></tr>
            <tr><td><code>mask-image</code></td><td>not <code>none</code></td></tr>
            <tr><td><code>clip-path</code></td><td>not <code>none</code></td></tr>
            <tr><td><code>mix-blend-mode</code></td><td>not <code>normal</code></td></tr>
            <tr><td><code>isolation</code></td><td><code>isolate</code></td></tr>
            <tr><td><code>contain</code></td><td><code>paint</code>, <code>layout</code>, <code>strict</code> or <code>content</code></td></tr>
          </tbody>
        </table>
        <p class="note">
          This site works around two of them. Code blocks scroll horizontally, so they carry
          <code>data-dl-skip</code> and sit out of the plane walk; and page entrances animate
          <code>translate</code> rather than <code>opacity</code>, because a fade would flatten
          everything under it for as long as it ran.
        </p>
      </section>
    `

    const rig = new Rig()
    const culprit = $('#culprit', root)
    const applied = $('#applied', root)
    const insp = inspector($('#readout', root))
    let handle: DelaminateHandle | null = null

    $('#switches', root).innerHTML = FLATTENERS.map(
      ([cls, name]) => `<button class="push" type="button" data-f="${cls}" aria-pressed="false">${name}</button>`,
    ).join('')

    const report = () => {
      const on = FLATTENERS.filter(([cls]) => culprit.classList.contains(cls))
      applied.textContent = on.length ? `${on.length} applied` : 'no flattener applied'
      applied.className = on.length ? 'tag tag--bad' : 'tag'
      if (handle) insp.update(handle)
    }

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('button')
      if (!btn) return
      const cls = btn.dataset.f!
      const on = culprit.classList.toggle(cls)
      btn.setAttribute('aria-pressed', String(on))
      report()
    }
    $('#switches', root).addEventListener('click', onClick)

    handle = rig.now($('#subject', root))
    report()

    return () => {
      $('#switches', root).removeEventListener('click', onClick)
      insp.destroy()
      rig.destroy()
    }
  },
}

export default flattening
