import './site.css'
import { chrome, markCurrent } from './chrome.js'
import { $ } from './lib/dom.js'
import { pages } from './registry.js'

const outlet = $('#outlet')
const nav = $('#nav')
const bar = $('#bar')

chrome(nav, bar)

let teardown: () => void = () => {}

function route(): void {
  const slug = location.hash.replace(/^#\/?/, '')
  const page = pages.find((p) => p.slug === slug) ?? pages[0]!

  // Always before the outlet is emptied: a detached stage keeps its listeners.
  teardown()
  teardown = () => {}
  outlet.textContent = ''

  document.title = page.slug ? `${page.title} — delamin8r` : 'delamin8r'
  markCurrent(nav, page.slug)
  teardown = page.render(outlet)
  outlet.focus({ preventScroll: true })
  if (slug) scrollTo({ top: 0 })
}

addEventListener('hashchange', route)
route()
