import { delaminate } from 'delamin8r'
import type { DriverName, DelaminateHandle } from 'delamin8r'

const CARD = `
  <div class="card__sheen" data-dl-skip></div>
  <div class="card__head">
    <h3 class="card__title">deploy 4f2a91c</h3>
    <span class="badge">staged</span>
  </div>
  <p class="card__lede">
    Seven checks ran against the branch. Nothing here was authored for depth &mdash;
    the tree already had it.
  </p>
  <dl class="rows">
    <div class="row"><dt>build</dt><dd class="row__val">42s</dd></div>
    <div class="row"><dt>typecheck</dt><dd class="row__val">clean</dd></div>
    <div class="row"><dt>unit</dt><dd class="row__val">318 / 318</dd></div>
    <div class="row"><dt>bundle</dt><dd class="row__val">21.4 kB</dd></div>
  </dl>
  <div class="card__foot">
    <button class="btn btn--go" type="button">promote</button>
    <button class="btn" type="button">logs</button>
  </div>
`

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const cls = (el: HTMLElement) => {
  const first = String(el.className).split(' ').filter((c) => c && !c.startsWith('dl-'))[0]
  return first ? `.${first}` : ''
}

const control = $('control')
const subject = $('subject')
control.innerHTML = CARD
;(subject.firstElementChild as HTMLElement).innerHTML = CARD

let handle: DelaminateHandle | null = null

function build() {
  handle?.destroy()
  handle = delaminate(subject, {
    mode: ($('mode') as HTMLSelectElement).value as 'window' | 'tilt',
    origin: Number(($('origin') as HTMLInputElement).value),
    falloff: Number(($('falloff') as HTMLInputElement).value),
    scaleCompensate: ($('scale') as HTMLInputElement).checked,
    driver: driverValue(),
  })
  report()
}

function driverValue(): DriverName | false {
  const v = ($('driver') as HTMLSelectElement).value
  return v === 'false' ? false : (v as DriverName)
}

function report() {
  if (!handle) return
  const flat = handle.diagnose()
  const list = $('planes')
  list.innerHTML = handle.planes
    .map((p) => {
      const name = p.el.tagName.toLowerCase() + (cls(p.el))
      const bad = flat.some((f) => f.el === p.el)
      return `<li class="${bad ? 'flat' : ''}"><span>${' '.repeat((p.level - 1) * 2)}${name}</span><b>${p.z.toFixed(0)}</b></li>`
    })
    .join('')
  $('note').textContent = flat.length
    ? `${flat.length} plane(s) flattened by ${flat[0]!.cause} on ${flat[0]!.culprit.tagName.toLowerCase()}`
    : `${handle.planes.length} planes, all in 3D`
}

for (const id of ['mode', 'scale', 'origin', 'falloff']) {
  $(id).addEventListener('input', () => {
    $('originOut').textContent = Number(($('origin') as HTMLInputElement).value).toFixed(2)
    $('falloffOut').textContent = Number(($('falloff') as HTMLInputElement).value).toFixed(2)
    build()
  })
}

$('driver').addEventListener('change', () => handle?.setDriver(driverValue()))

// iOS only grants the sensor from inside a user gesture, so this has to be a
// real click rather than anything the page does on its own.
$('tilt').addEventListener('click', async () => {
  const ok = await handle?.enableOrientation()
  $('note').textContent = ok
    ? 'accelerometer fused in - tilt the device, or move the pointer'
    : 'accelerometer refused - needs a tap on iOS, over https'
})

build()
