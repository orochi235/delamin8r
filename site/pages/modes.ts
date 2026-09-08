import { stage } from '../demos/specimen.js'
import { $, label } from '../lib/dom.js'
import { Rig } from '../lib/rig.js'
import type { Page } from '../registry.js'

const modes: Page = {
  slug: 'modes',
  title: 'Window and tilt',
  nav: 'Modes',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>Two ways to <em>swing</em> it.</h1>
        <p class="lede">
          Both put the same planes at the same depths. They differ in what moves: one moves the
          viewpoint and rotates nothing, the other rotates the whole stack under a fixed
          viewpoint.
        </p>
      </div>

      <section>
        ${label(1, 'side by side')}
        <div class="grid2">
          <div class="tagged">
            <p class="tag tag--on">mode: window &mdash; the default</p>
            <div id="win">${stage()}</div>
            <p class="blurb">
              Moves <code>perspective-origin</code>. The container you pass is the entire
              apparatus: no element is injected, no <code>transform</code> of yours is touched,
              and the panel's own box stays square. It reads like looking through a window as
              your head moves.
            </p>
          </div>
          <div class="tagged">
            <p class="tag tag--on">mode: tilt</p>
            <div id="tilt">${stage()}</div>
            <p class="blurb">
              Rotates an inner deck, the way a card tips under the cursor. That needs a second
              element: pass one as <code>deck</code>, or let it use the container's only child,
              or it injects a wrapper and moves the children into it.
            </p>
          </div>
        </div>
      </section>

      <section>
        ${label(2, 'the tilt gotcha')}
        <div class="prose">
          <p>
            The container holds the perspective, so it cannot also be the thing that rotates —
            which means <strong>your card's visible surface has to be inside the container, not
            on it</strong>. Put the border and the background on the element you pass and the
            frame sits still while its contents tip inside it.
          </p>
        </div>
        <div class="grid2">
          <div class="tagged">
            <p class="tag tag--bad">surface on the container</p>
            <div class="stagewrap card" id="bad">
              <div class="card__sheen" data-dl-skip></div>
              <div class="card__head"><h3 class="card__title">deploy 4f2a91c</h3><span class="badge">staged</span></div>
              <p class="card__lede">The frame stays put. Only what is inside it moves, which reads as a bug.</p>
              <div class="card__foot"><button class="btn btn--go" type="button">promote</button></div>
            </div>
          </div>
          <div class="tagged">
            <p class="tag tag--on">surface inside a bare wrapper</p>
            <div id="good">${stage()}</div>
          </div>
        </div>
        <p class="note">
          The usual shape is a bare wrapper around the card, which is what
          <code>&lt;div class="stagewrap"&gt;</code> is on the right. The wrapper carries the
          perspective; the card carries the paint.
        </p>
        <div class="prose">
          <p>
            Injection has a second cost, and it fails differently. The wrapper becomes the
            container's only child, so <strong>a container that was laying its own children
            out — a grid, a flex row — is left holding one item</strong> and loses its tracks.
            The boarding pass on the showcase page stacked into a single column until it was
            given a bare wrapper of its own. Pass <code>deck</code> to say which element should
            turn, and nothing is injected.
          </p>
        </div>
      </section>

      <section>
        ${label(3, 'what each one costs')}
        <table>
          <thead><tr><th>&nbsp;</th><th>window</th><th>tilt</th></tr></thead>
          <tbody>
            <tr><td>injects an element</td><td>never</td><td>only if the container has no single child to use</td></tr>
            <tr><td>rotates</td><td>nothing</td><td>the deck</td></tr>
            <tr><td>panel stays square</td><td>yes</td><td>no — the deck turns</td></tr>
            <tr><td>default swing</td><td>0.18 &times; the container</td><td>12&deg;</td></tr>
          </tbody>
        </table>
      </section>
    `

    const rig = new Rig()
    rig.add($('.stagewrap', $('#win', root)), { mode: 'window' })
    rig.add($('.stagewrap', $('#tilt', root)), { mode: 'tilt' })
    rig.add($('#bad', root), { mode: 'tilt' })
    rig.add($('.stagewrap', $('#good', root)), { mode: 'tilt' })
    rig.audit('modes')
    return () => rig.destroy()
  },
}

export default modes
