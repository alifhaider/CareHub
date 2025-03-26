import { reactRouter } from '@react-router/dev/vite'
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
  plugins: [tsconfigPaths(), reactRouter()],
})
