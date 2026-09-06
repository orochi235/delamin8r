import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { CSS } from './src/styles.js'

export default defineConfig({
  resolve: {
    alias: {
      reticul8r: resolve(__dirname, 'src/index.ts'),
      'reticul8r/react': resolve(__dirname, 'src/react.ts'),
    },
  },
  build: {
    lib: {
      entry: { reticul8r: resolve(__dirname, 'src/index.ts'), react: resolve(__dirname, 'src/react.ts') },
      formats: ['es'],
    },
    rollupOptions: { external: ['react'] },
  },
  plugins: [
    dts({ include: ['src'], rollupTypes: false }),
    {
      name: 'reticul8r:emit-css',
      closeBundle() {
        writeFileSync(resolve(__dirname, 'dist/reticul8r.css'), CSS.trimStart())
      },
    },
  ],
})
