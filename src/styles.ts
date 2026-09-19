/**
 * The single source for the stylesheet. `dist/delamin8r.css` is emitted from
 * this at build time for consumers who would rather import it themselves.
 */
export const CSS = `
@property --dl-px { syntax: "<number>"; inherits: true; initial-value: 0; }
@property --dl-py { syntax: "<number>"; inherits: true; initial-value: 0; }

.dl-stage {
  --dl-mx: 50%;
  --dl-my: 50%;
  --dl-perspective: 900px;
  --dl-swing: 0px;
  --dl-tilt: 0deg;
  --dl-tilt-x: calc(var(--dl-tilt) * 0.72);
  --dl-recoil: 0px;
  perspective: var(--dl-perspective);
}

.dl-stage.dl-window {
  perspective-origin:
    calc(50% + var(--dl-px) * var(--dl-swing))
    calc(50% + var(--dl-py) * var(--dl-swing));
}

.dl-deck {
  transform-style: preserve-3d;
  transform:
    rotateX(calc(var(--dl-py) * -1 * var(--dl-tilt-x)))
    rotateY(calc(var(--dl-px) * var(--dl-tilt)))
    translate3d(calc(var(--dl-px) * var(--dl-recoil)), calc(var(--dl-py) * var(--dl-recoil)), 0);
}

.dl-plane {
  transform-style: preserve-3d;
  translate:
    calc(var(--dl-px) * var(--dl-d, 0px))
    calc(var(--dl-py) * var(--dl-d, 0px))
    var(--dl-z, 0px);
  scale: var(--dl-s, 1);
  transform-origin: var(--dl-o, 50% 50%);
}

/* A plane with no planes under it needs no 3D context of its own, and giving
   it one costs pointer accuracy: everything in the subtree is then hit-tested
   against a box the browser does not paint it at, so a slider thumb answers a
   pixel or two from where it looks. Its own Z is unaffected - transform-style
   governs its children, not itself. */
.dl-plane.dl-leaf {
  transform-style: flat;
}

/* The Z offsets stay - they are the layout, not the motion. What goes is the
   pointer response. */
@media (prefers-reduced-motion: reduce) {
  .dl-stage.dl-window { perspective-origin: 50% 50%; }
  .dl-deck { transform: none; }
  .dl-plane { translate: 0 0 var(--dl-z, 0px); }
}
`

/** Wherever a stylesheet can land: a document, or a shadow root that has to carry its own. */
export type StyleRoot = Document | ShadowRoot

const injected = new WeakSet<StyleRoot>()

const asDocument = (root: StyleRoot): Document | null => (root.nodeType === 9 ? (root as Document) : null)

/** The scope `el`'s styles resolve in, which for an element in a shadow tree is not its document. */
export function styleRootFor(el: Element): StyleRoot {
  const root = el.getRootNode()
  if (root.nodeType === 9) return root as Document
  return 'host' in root ? (root as ShadowRoot) : el.ownerDocument
}

export function injectStyles(root: StyleRoot = document): void {
  if (injected.has(root)) return
  injected.add(root)
  const doc = asDocument(root) ?? (root as ShadowRoot).ownerDocument
  // The sheet has to be constructed in the target document's own realm; one
  // built here is rejected on adoption into an iframe.
  const view = doc.defaultView
  if (view && 'adoptedStyleSheets' in root && typeof view.CSSStyleSheet !== 'undefined') {
    try {
      const sheet = new view.CSSStyleSheet()
      sheet.replaceSync(CSS)
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
      return
    } catch {
      /* fall through to a style tag */
    }
  }
  const tag = doc.createElement('style')
  tag.dataset.delamin8r = ''
  tag.textContent = CSS
  ;(asDocument(root)?.head ?? root).appendChild(tag)
}
