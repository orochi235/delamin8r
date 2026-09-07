import type { DelaminateHandle, Driver, DriverName } from 'delamin8r'
import { stage } from '../demos/specimen.js'
import { $, label } from '../lib/dom.js'
import { Rig } from '../lib/rig.js'
import type { Page } from '../registry.js'

/** A driver is two methods. This one ignores input entirely and traces a figure. */
function lissajous(): Driver {
  let raf = 0
  return {
    start(ctx) {
      const step = (t: number) => {
        ctx.set(Math.sin(t / 900), Math.sin(t / 1400 + 1))
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    },
    stop() {
      cancelAnimationFrame(raf)
    },
  }
}

const signed = (n: number) => `${n < 0 ? '' : '+'}${n.toFixed(3)}`

const drivers: Page = {
  slug: 'drivers',
  title: 'What drives it',
  nav: 'Drivers',

  render(root) {
    root.innerHTML = `
      <div class="enter">
        <h1>The pointer and the phone, <em>at once</em>.</h1>
        <p class="lede">
          A desktop has a pointer and a still sensor; a phone has a live sensor and only fires
          <code>pointermove</code> mid-drag. Making you pick one means making you guess the
          device, so the default takes both and follows whichever is actually moving.
        </p>
      </div>

      <section>
        ${label(1, 'try each one')}
        <div class="grid2">
          <div class="tagged">
            <p class="tag tag--on" id="which">driver: auto</p>
            <div id="subject">${stage()}</div>
          </div>
          <div class="stack">
            <div class="controls">
              <p class="ctl"><label for="driver">source</label>
                <select id="driver">
                  <option value="auto">auto — pointer + sensor, fused</option>
                  <option value="pointer">pointer</option>
                  <option value="scroll">scroll</option>
                  <option value="orientation">orientation</option>
                  <option value="lissajous">a custom driver</option>
                  <option value="false">none — detached</option>
                </select>
                <output>&nbsp;</output></p>
            </div>
            <p class="readout" id="live"><b>&nbsp;</b></p>
            <div class="push-row">
              <button class="push" type="button" id="sensor">enable accelerometer</button>
              <button class="push" type="button" id="level">take as level</button>
              <button class="push" type="button" id="poke">push a deflection</button>
            </div>
            <p class="blurb" id="note">
              Each source keeps a decaying measure of how far it has moved and takes over when
              that crosses a threshold, which keeps sensor drift from stealing control while a
              deliberate tilt claims it in a few events.
            </p>
          </div>
        </div>
      </section>

      <section>
        ${label(2, 'the sensor needs asking')}
        <div class="prose">
          <p>
            On iOS the accelerometer half needs a permission call <strong>from inside a user
            gesture, over HTTPS</strong>, so it cannot join on its own — that is what the button
            above is for. Everywhere else it is already fused in and the call resolves true
            without prompting.
          </p>
          <p>
            The first reading it sees becomes level, so however the device is being held when it
            starts is the neutral position. <code>calibrate()</code> re-levels to wherever it is
            now. Landscape is handled: the device's own axes rotate out from under you, and the
            driver rotates them back.
          </p>
        </div>
      </section>

      <section>
        ${label(3, 'writing your own')}
        <div class="prose">
          <p>
            A driver is <code>start(ctx)</code> and <code>stop()</code>. Call
            <code>ctx.set(x, y)</code> with anything — both values clamp to &plusmn;1 — and
            optionally <code>ctx.setSheen(mx, my)</code> with percentages for a surface
            highlight. <code>ctx.stage</code> is the element that never rotates, so its rect is
            the only one safe to measure.
          </p>
          <p>
            <code>fuse(a, b, …)</code> is exported, so a source you write can join the same
            handover the built-in pair uses rather than fighting it. The custom option above is
            a driver that ignores input entirely and traces a figure.
          </p>
        </div>
      </section>

      <section>
        ${label(4, 'reduced motion')}
        <div class="prose">
          <p>
            <code>prefers-reduced-motion: reduce</code> drops the driver and the motion, and the
            setting is watched while the page is open rather than read once. <strong>The Z
            offsets stay</strong>, because they are the layout, not the animation — the stack
            keeps its depth and simply stops swinging.
          </p>
        </div>
      </section>
    `

    const rig = new Rig()
    const subject = $('.stagewrap', $('#subject', root))
    const handle: DelaminateHandle = rig.now(subject)
    const live = $('#live', root)
    const note = $('#note', root)
    const which = $('#which', root)

    let raf = 0
    const read = () => {
      const px = Number(subject.style.getPropertyValue('--dl-px') || 0)
      const py = Number(subject.style.getPropertyValue('--dl-py') || 0)
      // Always signed, so the pair holds its width instead of jittering when
      // one of them crosses zero. HTML would collapse padding spaces anyway.
      live.innerHTML = `deflection <b>${signed(px)}</b> <b>${signed(py)}</b>`
      raf = requestAnimationFrame(read)
    }
    raf = requestAnimationFrame(read)

    const onDriver = () => {
      const v = $<HTMLSelectElement>('#driver', root).value
      which.textContent = `driver: ${v === 'false' ? 'none' : v === 'lissajous' ? 'a custom driver' : v}`
      handle.setDriver(v === 'false' ? false : v === 'lissajous' ? lissajous() : (v as DriverName))
    }
    $('#driver', root).addEventListener('change', onDriver)

    const onSensor = async () => {
      const ok = await handle.enableOrientation()
      note.textContent = ok
        ? 'Sensor fused in — tilt the device, or keep moving the pointer.'
        : 'Refused. On iOS this needs a tap on a page served over HTTPS.'
    }
    $('#sensor', root).addEventListener('click', onSensor)

    const onLevel = () => {
      handle.calibrate()
      note.textContent = 'Re-leveled: wherever the device is now counts as neutral.'
    }
    $('#level', root).addEventListener('click', onLevel)

    const onPoke = () => {
      handle.set(Math.random() * 2 - 1, Math.random() * 2 - 1)
      note.textContent = 'Pushed a deflection in directly. Both values clamp to ±1.'
    }
    $('#poke', root).addEventListener('click', onPoke)

    rig.audit('drivers')

    return () => {
      cancelAnimationFrame(raf)
      rig.destroy()
    }
  },
}

export default drivers
