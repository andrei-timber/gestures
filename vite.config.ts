import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// Served under andreitim.com/apps/gestures (Cloudflare Workers Static Assets).
// One canonical subpath: `base` sets the asset URLs, `outDir` mirrors it on disk so the
// built layout matches the served route 1:1 (wrangler serves `dist/`, deploy-notes.md).
const SUBPATH = 'apps/gestures'

// https://vite.dev/config/
export default defineConfig({
  base: `/${SUBPATH}/`,
  build: { outDir: `dist/${SUBPATH}` },
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
