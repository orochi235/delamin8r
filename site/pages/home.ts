import { codeblock } from '../lib/codeblock.js'
import { $, label } from '../lib/dom.js'
import { Rig } from '../lib/rig.js'
import { stage } from '../demos/specimen.js'
import type { Page } from '../registry.js'
import install from '../snippets/install.sh?highlight'
import basic from '../snippets/basic.ts?highlight'
import react from '../snippets/react.tsx?highlight'

const INDEX: Array<[string, string, string]> = [
  ['depth', 'How depth is decided', 'Nesting makes depth. Siblings tie. Move the controls and read the numbers.'],
  ['modes', 'Window and tilt', 'One moves the viewpoint, the other rotates a deck. Side by side.'],
  ['flattening', 'The silent failure', 'One CSS property upstream and the whole subtree stops being 3D.'],
  ['drivers', 'What drives it', 'Pointer and accelerometer fused, or scroll, or anything you write.'],
  ['showcase', 'Showcase', 'Ordinary markup that stopped looking ordinary.'],
  ['recipes', 'Recipes', 'Patterns to paste.'],
  ['api', 'API', 'Every option, every handle method, every custom property.'],
]

const home: Page = {
  slug: '',
  title: 'delamin8r',
  nav: 'Home',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>Turn a DOM subtree<br />into a <em>parallax window</em>.</h1>
        <p class="lede">
          The elements already in it become depth planes, and pointer movement — or the
          phone's accelerometer — swings them past each other inside one perspective.
          You don't author a scene. You wrap a container you already wrote.
        </p>

        <div class="grid2 spaced">
          ${codeblock(install, 'install')}
          ${codeblock(basic, 'that is the whole setup')}
        </div>
      </div>

      <section>
        ${label(1, 'the same markup, wrapped')}
        <div class="grid2">
          <div class="tagged">
            <p class="tag">unwrapped</p>
            ${stage()}
          </div>
          <div class="tagged" id="subject">
            <p class="tag tag--on">delaminated</p>
            ${stage()}
          </div>
        </div>
        <p class="note">
          Two copies of one card. The right-hand one has had <code>delaminate()</code> called on
          its wrapper and nothing else — no per-layer <code>--depth</code>, no markup change.
          At rest the two are pixel-identical; move the pointer and only one of them knows.
        </p>
      </section>

      <section>
        ${label(2, 'react')}
        <div class="grid2">
          ${codeblock(react, 'delamin8r/react')}
          <div class="prose">
            <p>
              <code>useDelaminate</code> is a thin wrapper: it hands you a ref, calls
              <code>delaminate()</code> when the node mounts and <code>destroy()</code> when it
              unmounts. Options are read once — change the container's <code>key</code> to
              rebuild with new ones.
            </p>
            <p>React is an optional peer dependency; the vanilla entry point never imports it.</p>
          </div>
        </div>
      </section>

      <section>
        ${label(3, 'the rest of this site')}
        <div class="grid2" id="index"></div>
      </section>

      <section>
        ${label(4, 'what this page is doing')}
        <div class="prose">
          <p>
            The bar at the top and the card above are delaminated. <strong>The text you are
            reading is not</strong> — every plane is a composited layer, and text on one loses
            subpixel rendering. That trade is why <code>maxDepth</code> exists, and running a
            whole page of prose through it would be a bad advertisement.
          </p>
          <p>
            All of it shares one animation frame. The loop is module-level, joins on input and
            stops itself once everything has settled, so six delaminated regions cost one
            <code>requestAnimationFrame</code>, not six.
          </p>
        </div>
      </section>
    `

    $('#index', root).innerHTML = INDEX.map(
      ([slug, title, blurb]) => `
        <a class="plate plate--link" href="#/${slug}">
          <h3>${title}</h3>
          <p class="blurb">${blurb}</p>
        </a>`,
    ).join('')

    const rig = new Rig()
    rig.add($('.stagewrap', $('#subject', root)))
    for (const plate of root.querySelectorAll<HTMLElement>('#index .plate')) {
      rig.add(plate, { step: 6, maxDepth: 2 })
    }
    rig.audit('home')
    return () => rig.destroy()
  },
}

export default home
