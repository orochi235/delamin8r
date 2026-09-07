export const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document): T => root.querySelector(sel) as T
export const $$ = <T extends HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll(sel)) as T[]

/** Build a detached element from a trusted template string. */
export function el<T extends HTMLElement>(markup: string): T {
  const t = document.createElement('template')
  t.innerHTML = markup.trim()
  return t.content.firstElementChild as T
}

/** A drafting label: `01 — DEPTH`, then a rule to the edge. */
export const label = (n: number, text: string) =>
  `<p class="label"><b>${String(n).padStart(2, '0')}</b>${text}</p>`
