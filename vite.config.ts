import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const MODE = process.env.NODE_ENV

export default defineConfig({
  build: {
    cssMinify: MODE === 'production',

    rollupOptions: {
      external: [/node:.*/, 'fsevents'],
    },

    assetsInlineLimit: (source: string) => {
      if (
        source.endsWith('sprite.svg') ||
        source.endsWith('favicon.svg') ||
        source.endsWith('apple-touch-icon.png')
      ) {
        return false
      }
    },

    sourcemap: true,
  },
  server: {
    watch: {
      ignored: ['**/playwright-report/**'],
    },
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
})
