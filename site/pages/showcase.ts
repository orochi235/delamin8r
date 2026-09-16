import { $, label } from '../lib/dom.js'
import { Rig } from '../lib/rig.js'
import type { Page } from '../registry.js'
import type { DelaminateOptions } from 'delamin8r'

const BARS = [9, 15, 22, 30, 24, 13, 19, 27, 30, 17, 11, 21, 28, 16, 8, 14, 25, 30, 20, 10]

const NOW_PLAYING = `
  <div class="np">
    <div class="np-art"></div>
    <div class="np-meta">
      <strong>Delamination</strong>
      <span>side two &middot; 4:12</span>
    </div>
    <div class="np-wave">${BARS.map((h) => `<i data-h="${h}"></i>`).join('')}</div>
    <div class="np-keys"><span>&#9198;</span><span>&#9199;</span><span>&#9197;</span></div>
  </div>
`

const TERMINAL = `
  <div class="tty">
    <div class="tty-bar" data-dl-skip><i></i><i></i><i></i><span>zsh &mdash; 80&times;24</span></div>
    <div class="tty-body">
      <div><b>$</b> npm i delamin8r</div>
      <div>added 1 package in <em>412ms</em></div>
      <div><b>$</b> node -e "import('delamin8r')"</div>
      <div>ready</div>
      <div><b>$</b> <span>&#9608;</span></div>
    </div>
  </div>
`

const PASS = `
  <div class="pass-stage">
  <div class="pass">
    <div class="pass-main">
      <div class="pass-route">
        <strong>FLT</strong><span>&rarr;</span><strong>3D</strong>
      </div>
      <div class="pass-grid">
        <p><span>gate</span>B12</p>
        <p><span>seat</span>21A</p>
        <p><span>boards</span>18:40</p>
      </div>
    </div>
    <div class="pass-stub">
      <b>boarding</b>
      <em>8</em>
    </div>
  </div>
  </div>
`

const PIECES: Array<[string, string, string, DelaminateOptions]> = [
  ['np', 'Now playing', NOW_PLAYING, { mode: 'tilt', tilt: 15 }],
  ['tty', 'A terminal', TERMINAL, { mode: 'window' }],
  ['pass', 'A boarding pass', PASS, { mode: 'tilt', tilt: 10 }],
]

const showcase: Page = {
  slug: 'showcase',
  title: 'Showcase',
  nav: 'Showcase',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>Ordinary markup that stopped <em>looking</em> ordinary.</h1>
        <p class="lede">
          None of these author depth. There is no per-layer <code>--depth</code>, no
          <code>translateZ</code>, no wrapper added to make a layer. Each is a card, a window and
          a ticket written the way you would write them anyway, with one call around the
          outside.
        </p>
      </div>
      ${PIECES.map(
        ([id, title, markup], i) => `
        <section>
          ${label(i + 1, title)}
          <div class="show" id="show-${id}">${markup}</div>
        </section>`,
      ).join('')}
      <section>
        ${label(4, 'where the depth came from')}
        <div class="prose">
          <p>
            There is no trick. Every plane above sits where the nesting already put it — a
            child a step in front of its parent, siblings together on one plane. Nothing here
            declares a depth, and nothing here is ordered by hand.
          </p>
        </div>
      </section>
    `

    // The bars carry their height as data, since a style attribute per bar is
    // exactly the per-layer authoring this library exists to avoid.
    for (const bar of root.querySelectorAll<HTMLElement>('.np-wave i')) {
      bar.style.height = `${bar.dataset.h}px`
    }

    const rig = new Rig()
    for (const [id, , , options] of PIECES) {
      rig.add($(`#show-${id}`, root).firstElementChild as HTMLElement, options)
    }
    rig.audit('showcase')
    return () => rig.destroy()
  },
}

export default showcase
