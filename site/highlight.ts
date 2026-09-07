import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import type { Plugin } from 'vite'
import { codeToHtml } from 'shiki'

const LANG: Record<string, string> = { '.ts': 'ts', '.tsx': 'tsx', '.js': 'js', '.css': 'css', '.html': 'html', '.sh': 'bash' }

/**
 * A demo module holds the recipe plus the plumbing that mounts it on this site.
 * Only the marked region is the teaching material, so only that is shown.
 */
function region(src: string): string {
  const start = src.indexOf('// #region recipe')
  if (start === -1) return src
  const from = src.indexOf('\n', start) + 1
  const to = src.indexOf('// #endregion', from)
  const body = src.slice(from, to === -1 ? undefined : to).replace(/\s+$/, '')
  const indent = Math.min(...body.split('\n').filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return body
    .split('\n')
    .map((l) => l.slice(indent))
    .join('\n')
}

/**
 * `import src from './x.ts?highlight'` returns highlighted HTML, produced here
 * rather than in the browser, so no highlighter reaches the bundle.
 */
export function highlight(): Plugin {
  return {
    name: 'delamin8r:highlight',
    async resolveId(source, importer) {
      if (!source.endsWith('?highlight')) return null
      const resolved = await this.resolve(source.slice(0, -'?highlight'.length), importer, { skipSelf: true })
      return resolved ? `${resolved.id}?highlight` : null
    },
    async load(id) {
      if (!id.endsWith('?highlight')) return null
      const path = id.slice(0, -'?highlight'.length)
      const code = region(await readFile(path, 'utf8')).trim()
      const html = await codeToHtml(code, { lang: LANG[extname(path)] ?? 'txt', theme: 'poimandres' })
      // Shiki paints its own ground inline, which only !important could beat.
      return `export default ${JSON.stringify(html.replace(/background-color:[^;"]*;?/, ''))}`
    },
  }
}
