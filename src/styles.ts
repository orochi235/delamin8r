/**
 * The single source for the stylesheet. `dist/reticul8r.css` is emitted from
 * this at build time for consumers who would rather import it themselves.
 */
export const CSS = `
@property --rz-px { syntax: "<number>"; inherits: true; initial-value: 0; }
@property --rz-py { syntax: "<number>"; inherits: true; initial-value: 0; }

.rz-stage {
  --rz-mx: 50%;
  --rz-my: 50%;
  --rz-perspective: 900px;
  --rz-swing: 0px;
  --rz-tilt: 0deg;
  --rz-tilt-x: calc(var(--rz-tilt) * 0.72);
  --rz-recoil: 0px;
  perspective: var(--rz-perspective);
}

.rz-stage.rz-window {
  perspective-origin:
    calc(50% + var(--rz-px) * var(--rz-swing))
    calc(50% + var(--rz-py) * var(--rz-swing));
}

.rz-deck {
  transform-style: preserve-3d;
  transform:
    rotateX(calc(var(--rz-py) * -1 * var(--rz-tilt-x)))
    rotateY(calc(var(--rz-px) * var(--rz-tilt)))
    translate3d(calc(var(--rz-px) * var(--rz-recoil)), calc(var(--rz-py) * var(--rz-recoil)), 0);
}

.rz-plane {
  transform-style: preserve-3d;
  translate:
    calc(var(--rz-px) * var(--rz-d, 0px))
    calc(var(--rz-py) * var(--rz-d, 0px))
    var(--rz-z, 0px);
  scale: var(--rz-s, 1);
  transform-origin: var(--rz-o, 50% 50%);
}

/* The Z offsets stay - they are the layout, not the motion. What goes is the
   pointer response. */
@media (prefers-reduced-motion: reduce) {
  .rz-stage.rz-window { perspective-origin: 50% 50%; }
  .rz-deck { transform: none; }
  .rz-plane { translate: 0 0 var(--rz-z, 0px); }
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
  tag.dataset.reticul8r = ''
  tag.textContent = CSS
  ;(asDocument(root)?.head ?? root).appendChild(tag)
}
