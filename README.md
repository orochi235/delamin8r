# reticulizer

Turn a DOM subtree into a parallax window: the elements already in it become
depth planes, and pointer movement swings them past each other inside one
perspective.

**Nothing is built yet.** This repo holds the idea and a pointer to the working
proof it came from.

## What it would do

You hand it a container. It reads the subtree you already wrote — z-order and
document order — and puts each element on a Z plane, then drives the whole stack
from the pointer. No `--depth` per element, no restructuring the markup, no
authoring a scene. The depth is already in the tree; it just isn't being used
for anything.

That's the bet. If it holds, an existing panel — a modal, a context menu, a
card, a sidebar — becomes a parallax window by being wrapped, not rewritten.

## The proof it comes from

slopboard's about-modal (`?` key) does this by hand:
`~/src/slopboard/src/ParallaxModal.tsx` and `src/parallax-modal.css`. Seven
planes, `--depth` and `--drift` written out one layer at a time. It works, and
these are the parts worth keeping:

- **One perspective on an outer stage, `transform-style: preserve-3d` on the
  deck that moves.** Each layer gets
  `translate3d(px * drift, py * drift, depth)` — a Z offset the deck's rotation
  turns into parallax, plus an in-plane drift that widens the spread past what
  the rotation alone gives.
- **Measure the container that doesn't rotate.** The deck's own
  `getBoundingClientRect()` is the *rotated* bounding box, so reading it per
  frame feeds the tilt back into itself. Measure the upright stage instead.
- **An eased rAF loop writing CSS custom properties** on one element — `--px`,
  `--py` normalized to ±1, plus a pointer position the surface sheen reads. The
  layers stay pure CSS; the loop never touches them.
- **`prefers-reduced-motion` drops the motion and keeps the Z.** The offsets are
  layout, not animation; flattening them changes the composition.

## What has to be decided before there is code

- **Depth from what, exactly.** z-index where it's set, document order where it
  isn't, is a sketch rather than a rule. Does an element with no `z-index`
  inherit its parent's plane? Do siblings tie, or fan?
- **The Z range.** The modal spans -260px to +110px against `perspective:
  900px`. A general function can't hard-code that — derive it from the
  container's size, or take it as an option.
- **What stays flat.** The modal's interactive layers re-enable
  `pointer-events`, and a rotated plane moves where a click lands. Text at depth
  is the other cost: subpixel rendering goes away on a transformed layer.
- **How it applies.** Inline styles per element, an injected stylesheet, or
  custom properties on the container plus one class. The last is closest to what
  the modal already does.
- **What drives it.** Pointer is the obvious source; device orientation is the
  one already asked for elsewhere (blitsklieg's phone mode), and scroll is a
  third. That argues for keeping the driver separable from the placement.
- **Shape.** A framework-agnostic function is what makes this a library; a React
  hook is what makes it usable in slopboard the same afternoon. Probably the
  function, with the hook as a thin wrapper over it.

## Why it isn't just a slopboard refactor

slopboard needs the lift regardless — its handoff queues "lift the parallax out
of the modal into a function over a DOM subtree" ahead of a right-click context
menu that would be the second caller. But nothing about the result is
slopboard-specific, and a second consumer inside one app is not the same as a
library.
