import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { highlight } from './highlight.js'

export default defineConfig({
  root: __dirname,
  base: './',
  resolve: {
    alias: {
      // The site builds from source, so a change that breaks the library
      // breaks the site on the next reload rather than at the next release.
      delamin8r: resolve(__dirname, '../src/index.ts'),
      'delamin8r/react': resolve(__dirname, '../src/react.ts'),
    },
  },
  server: { host: '::' },
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [highlight()],
})
