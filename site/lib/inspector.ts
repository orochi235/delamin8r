import type { DelaminateHandle } from 'delamin8r'

/** The class an author wrote, not the ones we added. */
function name(el: HTMLElement): string {
  const own = String(el.className)
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('dl-'))[0]
  return el.tagName.toLowerCase() + (own ? `.${own}` : '')
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/**
 * The plane list beside a subject. Hovering a row outlines the element it
 * stands for, which is the only way to tell two rows of `div.row` apart.
 */
export function inspector(host: HTMLElement) {
  const readout = document.createElement('p')
  readout.className = 'readout'
  const list = document.createElement('ol')
  list.className = 'planes'
  list.setAttribute('data-dl-skip', '')
  host.append(readout, list)

  const rows = new WeakMap<HTMLElement, HTMLElement>()
  let spotted: HTMLElement | null = null

  const unspot = () => {
    spotted?.classList.remove('spot')
    spotted = null
  }

  const over = (e: Event) => {
    const row = (e.target as HTMLElement).closest('li')
    if (!row) return
    unspot()
    const target = rows.get(row)
    if (!target) return
    target.classList.add('spot')
    spotted = target
  }

  list.addEventListener('pointerover', over)
  list.addEventListener('pointerleave', unspot)

  return {
    update(handle: DelaminateHandle) {
      unspot()
      const flat = handle.diagnose()
      const worst = flat[0]
      list.textContent = ''
      for (const plane of handle.planes) {
        const li = document.createElement('li')
        const bad = flat.some((f) => f.el === plane.el)
        if (bad) li.className = 'is-flat'
        // Right-aligned to a fixed width, so the column reads down.
        li.innerHTML =
          `<span>${'  '.repeat(plane.level - 1)}${esc(name(plane.el))}</span>` +
          `<b>${plane.z.toFixed(1).padStart(7, ' ')}</b>`
        rows.set(li, plane.el)
        list.append(li)
      }
      readout.className = flat.length ? 'readout readout--bad' : 'readout'
      readout.innerHTML = flat.length
        ? `<b>${flat.length}</b> flattened &middot; ${esc(worst!.cause)} on ${esc(name(worst!.culprit))}`
        : `<b>${handle.planes.length}</b> planes &middot; all in 3D`
    },
    /** Nothing is delaminated right now, so there is nothing to report. */
    clear() {
      unspot()
      list.textContent = ''
      readout.className = 'readout'
      readout.innerHTML = '<b>0</b> planes &middot; not wrapped'
    },
    destroy() {
      unspot()
      list.removeEventListener('pointerover', over)
      list.removeEventListener('pointerleave', unspot)
      readout.remove()
      list.remove()
    },
  }
}
