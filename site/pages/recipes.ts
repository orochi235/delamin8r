import { codeblock } from '../lib/codeblock.js'
import { label } from '../lib/dom.js'
import type { Example } from '../lib/example.js'
import type { Page } from '../registry.js'
import hoverCard from '../demos/recipes/hover-card.js'
import sheen from '../demos/recipes/sheen.js'
import dialog from '../demos/recipes/dialog.js'
import scrollBand from '../demos/recipes/scroll-band.js'
import quietText from '../demos/recipes/quiet-text.js'

const EXAMPLES: Example[] = [hoverCard, sheen, dialog, scrollBand, quietText]

const recipes: Page = {
  slug: 'recipes',
  title: 'Recipes',
  nav: 'Recipes',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>Patterns to <em>paste</em>.</h1>
        <p class="lede">
          Each block below is the running module beside it, not a transcription of one. They are
          read out of the source at build time, so a snippet that has drifted is a snippet that
          no longer compiles.
        </p>
      </div>
      ${EXAMPLES.map(
        (ex, i) => `
        <section>
          ${label(i + 1, ex.title)}
          <div class="recipe">
            <div class="rc" id="host-${ex.id}"></div>
            <div class="stack">
              ${codeblock(ex.source, ex.id + '.ts')}
              <p class="blurb">${ex.note}</p>
            </div>
          </div>
        </section>`,
      ).join('')}
    `

    const downs = EXAMPLES.map((ex) => ex.mount(root.querySelector(`#host-${ex.id}`) as HTMLElement))
    return () => {
      for (const down of downs) down()
    }
  },
}

export default recipes
