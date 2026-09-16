import { label } from '../lib/dom.js'
import type { Page } from '../registry.js'

const OPTIONS: Array<[string, string, string]> = [
  ['mode', "'window'", "'window' moves the viewpoint and injects nothing. 'tilt' rotates an inner deck."],
  ['step', 'derived', 'Z between adjacent planes, in px. Taken from the container when unset.'],
  ['falloff', '0.5', 'How much the spacing shrinks at each level of nesting.'],
  ['maxDepth', '∞', 'How many levels below the container become planes.'],
  ['origin', '0', "Fraction of the stack sliding behind the container. Only sensible when it's transparent."],
  ['perspective', 'derived', 'The projection. Scales with the container unless you set it.'],
  ['swing', 'derived', 'How far the viewpoint travels at full deflection, in px.'],
  ['tilt', '12°', 'How far the deck turns at full deflection. Tilt mode only.'],
  ['scaleCompensate', 'true', 'Keep every plane at its unwrapped size and position, so nothing resizes at rest.'],
  ['drift', 'derived', 'In-plane movement per unit of depth, on top of the perspective. false turns it off.'],
  ['ease', '0.09', 'Fraction of the gap closed per 60Hz frame. Lower is heavier.'],
  ['skip', '—', 'Selector for elements to leave flat, subtree included.'],
  ['lift', 'semantic', 'Replaces the built-in lift rules rather than adding to them.'],
  ['driver', "'auto'", "'auto', 'pointer', 'orientation', 'scroll', a Driver you wrote, or false."],
  ['recenterOnLeave', 'true', 'Return to center when the pointer leaves. false tracks the whole window.'],
  ['pauseOffscreen', 'true', 'Detach the driver and leave the frame loop while the container is out of view.'],
  ['injectStyles', 'true', 'false if you import delamin8r.css yourself.'],
]

const HANDLE: Array<[string, string]> = [
  ['stage', 'The element you passed. It never rotates, so its rect is the safe one to measure.'],
  ['planes', 'Every plane, with its z, its parent&rsquo;s z, its level, and whether it is flattened.'],
  ['refresh()', 'Re-read the subtree. Structure and watched attributes are already observed; call this after anything else.'],
  ['setDriver(d)', 'Swap the source. false detaches it.'],
  ['set(x, y)', 'Push a deflection in directly. Both clamp to ±1.'],
  ['enableOrientation()', 'Ask for the accelerometer. Must be inside a user gesture on iOS; resolves true without prompting elsewhere.'],
  ['calibrate()', "Take the device's current attitude as level."],
  ['diagnose()', 'Every plane that will not render at depth, with the property and the element flattening it.'],
  ['destroy()', 'Put the DOM back exactly as it was, including any injected deck.'],
]

const PROPS: Array<[string, string]> = [
  ['--dl-px, --dl-py', 'The deflection, ±1. Written on the container every frame.'],
  ['--dl-mx, --dl-my', 'Pointer position over the container as percentages, for a surface sheen.'],
  ['--dl-z', "A plane's Z offset in px. Written per plane."],
  ['--dl-s, --dl-o', 'The counter-scale and its origin, when scaleCompensate is on.'],
  ['--dl-d', 'In-plane drift per unit of deflection.'],
  ['--dl-perspective, --dl-swing, --dl-tilt', 'The projection, on the container.'],
]

const api: Page = {
  slug: 'api',
  title: 'API',
  nav: 'API',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>Everything, <em>once</em>.</h1>
        <p class="lede">
          One function and one handle. <code>delaminate(container, options)</code> returns the
          handle; <code>useDelaminate(options)</code> from <code>delamin8r/react</code> is the
          same thing behind a ref.
        </p>
      </div>

      <section>
        ${label(1, 'options')}
        <table>
          <thead><tr><th>option</th><th>default</th><th>what it does</th></tr></thead>
          <tbody>
            ${OPTIONS.map(([k, d, t]) => `<tr><td><code>${k}</code></td><td class="num"><code>${d}</code></td><td>${t}</td></tr>`).join('')}
          </tbody>
        </table>
      </section>

      <section>
        ${label(2, 'the handle')}
        <table>
          <thead><tr><th>member</th><th>what it does</th></tr></thead>
          <tbody>
            ${HANDLE.map(([k, t]) => `<tr><td><code>${k}</code></td><td>${t}</td></tr>`).join('')}
          </tbody>
        </table>
      </section>

      <section>
        ${label(3, 'custom properties')}
        <table>
          <thead><tr><th>property</th><th>what it carries</th></tr></thead>
          <tbody>
            ${PROPS.map(([k, t]) => `<tr><td><code>${k}</code></td><td>${t}</td></tr>`).join('')}
          </tbody>
        </table>
        <p class="note">
          Nothing per-element is hard-coded. If you want to react to the deflection yourself —
          a sheen, a shadow, a parallax background — read these in your own CSS.
        </p>
      </section>

      <section>
        ${label(4, 'authoring attributes')}
        <table>
          <thead><tr><th>attribute</th><th>effect</th></tr></thead>
          <tbody>
            <tr><td><code>data-dl-lift="3"</code></td><td>Pull this element forward by that many steps, whatever the rules say.</td></tr>
            <tr><td><code>data-dl-skip</code></td><td>Leave this element and its subtree flat.</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        ${label(5, 'what it changes')}
        <div class="prose">
          <p>
            Planes get <code>translate</code>, <code>scale</code>,
            <code>transform-origin</code> and <code>transform-style: preserve-3d</code>.
            <strong>Your <code>transform</code> is left alone</strong> — depth is written
            through the individual transform properties instead. A transformed element is a
            containing block for <code>fixed</code> and <code>absolute</code> descendants, which
            it may not have been before.
          </p>
          <p>
            The stylesheet injects itself into the container's shadow root when that is where it
            lives, so a component that carries its own styles is handled. Pass
            <code>injectStyles: false</code> if you would rather import
            <code>delamin8r/delamin8r.css</code> yourself.
          </p>
        </div>
      </section>
    `
    return () => {}
  },
}

export default api
