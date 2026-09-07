import home from './pages/home.js'
import depth from './pages/depth.js'
import modes from './pages/modes.js'
import flattening from './pages/flattening.js'
import drivers from './pages/drivers.js'
import showcase from './pages/showcase.js'
import recipes from './pages/recipes.js'
import api from './pages/api.js'

export interface Page {
  /** '' is home. */
  slug: string
  title: string
  nav: string
  /** Skipped by the smoke test when it cannot run without a real engine. */
  headless?: false
  render(root: HTMLElement): () => void
}

export const pages: Page[] = [home, depth, modes, flattening, drivers, showcase, recipes, api]
