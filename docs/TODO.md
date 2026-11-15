# TODO

## Teardown removes host values instead of restoring them

`destroy` and `clear` in `src/delaminate.ts` remove the `dl-*` classes and `--dl-*` custom
properties they set on the stage, the deck, and each plane, without recording what was there
first. A host that set one of those itself (a `--dl-tilt` in its own inline style, say) loses it
on detach, even though the README promises the DOM comes back exactly as it was. What a second
`delaminate` call on the same container does is not defined (not tested). Wanted: each owned element's prior value, priority, and class membership recorded at
attach and restored at detach, only where the value is still the one this instance wrote, and a
second attach either refused or handed the existing handle. (filed 2026-11-15 from automated review)
