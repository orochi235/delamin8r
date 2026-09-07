# delamin8r doc site

How `site/` is put together, for whoever adds a page or a demo to it next.

The site is also the library's largest demo: its nav, its section cards and its
code blocks are delaminated, so a change that breaks depth breaks the site
visibly rather than quietly.

## Shape

One HTML file. Hash routes. No framework — React reconciliation would fight the
class and inline-style writes `delaminate()` makes on every plane, and the plain
DOM case is the one the library is advertising.

```
site/
  index.html
  vite.config.ts      aliases delamin8r → ../src, so the site builds from source
  highlight.ts        the ?highlight plugin, shared with the root vitest config
  main.ts             router
  chrome.ts           nav and the bar it delaminates
  registry.ts         the page list
  site.css
  env.d.ts
  pages/*.ts          one per route
  snippets/*          standalone files shown on the site, so every snippet compiles
  demos/
    specimen.ts       the card the labs measure
    recipes/*.ts      one Example each
  lib/
    rig.ts            every handle a page made, and the one call that ends them
    codeblock.ts      build-time-highlighted source
    inspector.ts      plane-list widget
    optionsnip.ts     live `delaminate(el, {…})` snippet
    example.ts        the Example shape
    dom.ts
```

`npm run dev` serves it. `npm run build:site` emits `site/dist`, which is
gitignored and never published — `package.json` `files` whitelists `dist` only.

## Pages and teardown

```ts
interface Page {
  slug: string                            // '' is home
  title: string
  nav: string
  headless?: boolean                      // false: skip in the smoke test
  render(root: HTMLElement): () => void   // returns teardown
}
```

The router tears down the previous page before rendering the next, and the
teardown a page returns must `destroy()` every handle it made. This is load
bearing, not hygiene: emptying a container that holds delaminated regions leaves
their pointer listeners and frame ticks alive, and `pauseOffscreen` does not
collect them because a detached node's IntersectionObserver never fires.

## Two kinds of demo

**Examples** are short, contain nothing but library usage, and their own source
is the teaching material — imported with `?highlight` and shown verbatim. Every
recipe is one. A recipe module also holds the plumbing that mounts it here, so
only the part between `// #region recipe` and `// #endregion` is shown.

**Labs** are instruments: the depth inspector, the flattening trap. Their source
is mostly control wiring and teaches nothing, so a lab shows the call it
currently represents instead — a live `delaminate(el, { falloff: 0.35 })`
snippet that tracks the controls. That is the line a reader would actually
paste.

## Highlighting

A Vite plugin resolves `?highlight` by running Shiki at build time and returning
HTML. It lives in `site/highlight.ts` rather than inside the site's config
because the root config needs it too — the smoke test imports pages that use it.
No highlighter reaches the bundle, and `shiki` stays a devDependency.
Labs' live snippets are generated from a known shape, so `optionsnip.ts` emits
their spans directly rather than reaching for a general highlighter.

## Routes

| | |
|---|---|
| `/` | the pitch, install, one showcase piece |
| `/depth` | the inspector lab; also the wrap/unwrap proof of `scaleCompensate` |
| `/modes` | window and tilt side by side, with a deliberately broken tilt beside the fixed one |
| `/flattening` | drop `overflow`/`opacity`/`filter`/`contain` on an ancestor and watch `diagnose()` fill |
| `/drivers` | pointer, orientation, scroll, `fuse`, a custom driver, reduced motion |
| `/showcase` | set pieces that are only eye candy, each still ordinary markup |
| `/recipes` | examples to paste |
| `/api` | options, handle methods, custom properties, exports |

## The site is the first thing that hits the bug

One `overflow: hidden` on a section wrapper silently flattens everything inside
it, which is the failure the site exists to explain. So in dev, after each route
renders, the site runs `diagnose()` across its own handles and logs anything
flattened. A site that quietly stopped demonstrating depth would otherwise look
merely a bit flat.

## Testing

One smoke test mounts every registry page in jsdom, runs its teardown, and
asserts no `dl-` classes and no live frame ticks survive — the leak the router
exists to prevent. A page that cannot run headless sets `headless: false`.
