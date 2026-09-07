export type SnipValue = string | number | boolean | undefined

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const value = (v: Exclude<SnipValue, undefined>): string =>
  typeof v === 'number'
    ? `<span class="n">${Number.isInteger(v) ? v : v.toFixed(2)}</span>`
    : typeof v === 'boolean'
      ? `<span class="k">${v}</span>`
      : `<span class="s">'${esc(v)}'</span>`

/**
 * The call a lab currently represents. Labs are mostly control wiring, so this
 * is the line worth reading rather than their own source.
 */
export function snip(target: string, opts: Record<string, SnipValue>): string {
  const given = Object.entries(opts).filter(([, v]) => v !== undefined) as Array<[string, Exclude<SnipValue, undefined>]>
  const body = given.length
    ? `, {\n${given.map(([k, v]) => `  ${k}<span class="p">:</span> ${value(v)},`).join('\n')}\n}`
    : ''
  return `<span class="f">delaminate</span><span class="p">(</span>${esc(target)}${body}<span class="p">)</span>`
}
