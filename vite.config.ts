import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import { CSS } from './src/styles.js'
import { highlight } from './site/highlight.js'

export default defineConfig({
  resolve: {
    alias: {
      delamin8r: resolve(__dirname, 'src/index.ts'),
      'delamin8r/react': resolve(__dirname, 'src/react.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
  },
  build: {
    lib: {
      entry: { delamin8r: resolve(__dirname, 'src/index.ts'), react: resolve(__dirname, 'src/react.ts') },
      formats: ['es'],
    },
    rollupOptions: { external: ['react'] },
  },
  plugins: [
    highlight(),
    dts({ include: ['src'], rollupTypes: false }),
    {
      name: 'delamin8r:emit-css',
      closeBundle() {
        writeFileSync(resolve(__dirname, 'dist/delamin8r.css'), CSS.trimStart())
      },
    },
  ],
})
