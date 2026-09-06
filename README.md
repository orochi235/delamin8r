# reticul8r

Turn a DOM subtree into a parallax window. The elements already in it become
depth planes, and pointer movement — or the phone's accelerometer — swings them
past each other inside one perspective.

You don't author a scene. You wrap a container you already wrote.

```js
import { reticulize } from 'reticul8r'

const handle = reticulize(document.querySelector('.panel'))
```

That's the whole setup. The stylesheet injects itself, the pointer starts
driving it, and `handle.destroy()` puts the DOM back exactly as it was.

React:

```jsx
import { useReticule } from 'reticul8r/react'

function Panel() {
  const { ref } = useReticule()
  return <div ref={ref}>{/* whatever you already had */}</div>
}
```

## How depth is decided

**Nesting makes depth. Siblings tie.**

A child sits one step in front of its parent, and each level of nesting steps by
half as much as the one above it. Siblings land on the same plane as each other
unless something actually separates them:

- **an explicit `z-index`** — each sibling that declares one is lifted a step
  clear of the tied plane, in the order it declared
- **a semantic lift** — buttons, links and form controls come forward a step and
  a half; badges, `mark` and `kbd` come forward two and a half
- **`data-rz-lift="3"`** on any element, to say it yourself

Document order does not fan siblings on its own. Four rows in a list do not
overlap, so the order the browser paints them in carries no depth, and
staircasing them looks like a bug. Set `fan: 1` if you want it anyway.

Depth runs *toward* the viewer, never away, because an element pushed behind its
own parent disappears into that parent's background.

Put `data-rz-skip` on anything that should stay flat. Its subtree stays flat too.

## The two modes

**`window`** (default) moves `perspective-origin` and rotates nothing. The
container you pass is the entire apparatus — no element is injected, no
`transform` of yours is touched, and the panel's own box stays square. It reads
like looking through a window as your head moves.

**`tilt`** rotates an inner deck, the way a card tips under the cursor. That
needs a second element: pass one as `deck`, or let it use the container's only
child, or it injects a wrapper and moves the children into it. The container
holds the perspective and so does not rotate, which means **your card's visible
surface has to be inside it**, not on it. The usual shape is a bare wrapper
around the card.

## What drives it

By default, the pointer and the accelerometer at the same time — whichever is
actually moving. A desktop has a pointer and a still sensor; a phone has a live
sensor and only fires `pointermove` mid-drag, so making you pick one means
making you guess the device. Each source accumulates a decaying measure of how
far it has moved and takes over when that crosses a threshold, which keeps
sensor drift from stealing control while a deliberate tilt claims it in a few
events.

On iOS the sensor half needs a permission call **from inside a user gesture, on
a secure origin**, so it can't join on its own:

```js
button.addEventListener('click', async () => {
  const ok = await handle.enableOrientation()
  if (!ok) tellThemItWasRefused()
})
```

Everywhere else it is already fused in and that call resolves true without
prompting. The first sensor reading becomes level; `handle.calibrate()` re-levels
to wherever the device is now. Landscape is handled.

`setDriver('pointer')`, `'orientation'` or `'scroll'` pins it to one source, and
`false` detaches it so you can call `handle.set(x, y)` with anything — both
values clamp to ±1. `fuse(a, b, …)` is exported, so a custom source can join the
same handover.

`prefers-reduced-motion: reduce` drops the driver and the motion. The Z offsets
stay, because they are the layout, not the animation.

## What it costs

**A subtree can be silently flattened.** `overflow` other than `visible`,
`opacity` below 1, `filter`, `clip-path`, `mask`, `mix-blend-mode`, `isolation`
and `contain` all force their children out of 3D — and the computed
`transform-style` still reads `preserve-3d`, so the failure is invisible.
`handle.diagnose()` names every flattened plane and the ancestor doing it.

**Text at depth loses subpixel rendering.** Every plane is a composited layer.
That is the price of the effect, and it is why `maxDepth` exists.

**Planes get `translate`, `scale`, `transform-origin` and a `preserve-3d`.**
Your `transform` is left alone — depth is written through the individual
transform properties. A transformed element is a containing block for `fixed`
and `absolute` descendants, which it may not have been before.

Everything else is a custom property on the container, so nothing per-element is
hard-coded: `--rz-px` and `--rz-py` are the deflection, ±1, and `--rz-mx` /
`--rz-my` track the pointer as percentages for a surface sheen.

## Options

| | |
|---|---|
| `mode` | `'window'` (default) or `'tilt'` |
| `step` | Z between adjacent planes in px. Derived from the container when unset |
| `falloff` | how much the spacing shrinks per level of nesting — `0.5` |
| `fan` | steps of extra depth per sibling in document order — `0` |
| `maxDepth` | levels below the container that become planes — unlimited |
| `origin` | fraction of the stack sliding behind the container — `0`. Only for a transparent one |
| `perspective`, `swing`, `tilt` | the projection and how far it swings |
| `scaleCompensate` | keep every plane at its unwrapped size and position — `true` |
| `drift` | in-plane movement per unit of depth, on top of the perspective |
| `ease` | fraction of the gap closed per frame — `0.09` |
| `skip` | selector for elements to leave flat, subtree included |
| `lift` | replaces the semantic lift rules |
| `driver` | `'auto'` (default: pointer and accelerometer fused), `'pointer'`, `'scroll'`, `'orientation'`, a custom `Driver`, or `false` |
| `recenterOnLeave` | return to center when the pointer leaves — `true`. `false` tracks the whole window |

`scaleCompensate` scales each plane about the stage center — the same point the
perspective projects from — so the two cancel exactly. A wrapped panel is
pixel-identical to an unwrapped one until something moves.

## Running the demo

```
npm install && npm run dev
```

Two copies of the same card side by side, one wrapped, with the plane list and
the flattening diagnostic live in the panel.

## Where it came from

slopboard's about-modal (`?` key) does this by hand across seven layers with
`--depth` written out one at a time: `~/src/slopboard/src/ParallaxModal.tsx`.
The easing, the drift-on-top-of-rotation, and measuring the upright stage rather
than the rotated deck all come from there.
