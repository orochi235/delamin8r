import type { LiftRule, Plane, ReticuleOptions } from './types.js'

export const DEFAULT_LIFT: LiftRule[] = [
  { match: 'button, [role="button"], a[href], input, select, textarea, summary', lift: 1.5 },
  { match: '[data-badge], .badge, mark, kbd, [role="status"]', lift: 2.5 },
]

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'BR'])

interface Raw {
  el: HTMLElement
  raw: number
  parentRaw: number
  level: number
}

function liftFor(el: HTMLElement, rules: LiftRule[]): number {
  const own = el.dataset.rzLift
  if (own !== undefined) {
    const n = Number(own)
    if (Number.isFinite(n)) return n
  }
  let best = 0
  for (const rule of rules) {
    if (el.matches(rule.match) && rule.lift > best) best = rule.lift
  }
  return best
}

/**
 * Siblings tie unless something actually separates them. Document order alone
 * does not: four rows in a list do not overlap, so the order the browser paints
 * them in carries no depth. An explicit `z-index` does, and lifts each declared
 * sibling one step clear of the tied plane in the order it declared.
 */
function separate(children: HTMLElement[]): Array<{ el: HTMLElement; step: number }> {
  const declared: Array<{ i: number; z: number }> = []
  const zs = children.map((el, i) => {
    const raw = getComputedStyle(el).zIndex
    if (raw === 'auto' || raw === '') return 0
    const z = Number.parseInt(raw, 10)
    if (!Number.isFinite(z)) return 0
    declared.push({ i, z })
    return z
  })
  declared.sort((a, b) => (a.z !== b.z ? a.z - b.z : a.i - b.i))
  const bump = new Map<number, number>()
  declared.forEach((d, rank) => bump.set(d.i, rank + 1))
  return children.map((el, i) => ({ el, step: zs[i] === 0 && !bump.has(i) ? 0 : (bump.get(i) ?? 0) }))
}

function eligible(parent: HTMLElement, skip: string | undefined): HTMLElement[] {
  const out: HTMLElement[] = []
  for (const child of parent.children) {
    if (!(child instanceof HTMLElement) && !(child instanceof SVGElement)) continue
    const el = child as HTMLElement
    if (SKIP_TAGS.has(el.tagName)) continue
    if (el.hasAttribute('data-rz-skip')) continue
    if (skip && el.matches(skip)) continue
    out.push(el)
  }
  return out
}

/**
 * Walk the subtree and place every element on a plane. Depth runs the same way
 * paint order does - later siblings and deeper descendants come toward the
 * viewer - because a child pushed behind its own parent disappears into that
 * parent's background. Each level's spacing shrinks by `falloff` so a deep tree
 * does not run away from the container.
 */
export function collect(
  root: HTMLElement,
  opts: Required<Pick<ReticuleOptions, 'falloff' | 'maxDepth' | 'fan'>> & Pick<ReticuleOptions, 'skip'> & { lift: LiftRule[] },
): Raw[] {
  const out: Raw[] = []
  const walk = (parent: HTMLElement, parentRaw: number, level: number, spacing: number) => {
    if (level > opts.maxDepth) return
    separate(eligible(parent, opts.skip)).forEach(({ el, step }, i) => {
      const raw = parentRaw + (1 + step + opts.fan * i + liftFor(el, opts.lift)) * spacing
      out.push({ el, raw, parentRaw, level })
      walk(el, raw, level + 1, spacing * opts.falloff)
    })
  }
  walk(root, 0, 1, 1)
  return out
}

/**
 * Map accumulated order onto real Z. Zero is the container's own plane, so the
 * whole stack rises in front of it; `origin` slides that fraction of the span
 * back behind the container, which only makes sense when it is transparent.
 */
export function fit(raws: Raw[], span: number, origin: number, step: number | undefined): Plane[] {
  if (raws.length === 0) return []
  let hi = 0
  for (const r of raws) if (r.raw > hi) hi = r.raw
  if (hi === 0) hi = 1
  const total = step !== undefined ? step * hi : span
  const k = total / hi
  const at = (raw: number) => k * raw - origin * total

  return raws.map((r) => ({
    el: r.el,
    z: at(r.raw),
    // The container itself is never translated or scaled, so level 1 sits
    // against a true zero however far `origin` slides the rest back.
    parentZ: r.level === 1 ? 0 : at(r.parentRaw),
    level: r.level,
    flattened: false,
  }))
}
