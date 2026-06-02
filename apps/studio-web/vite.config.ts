import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['../..', '../../packages']
    },
    watch: {
      usePolling: true
    }
  },
  optimizeDeps: {
    exclude: [
      '@quatrain/log',
      '@quatrain/core',
      '@quatrain/api',
      '@quatrain/api-client',
      '@quatrain/backend',
      '@quatrain/studio'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/packages/, /node_modules/],
      transformMixedEsModules: true
    }
  },
  resolve: {
    preserveSymlinks: true,
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: [
       { find: '@quatrain/log/src/index.ts', replacement: path.resolve(__dirname, '../../../Core/packages/log/src/index.ts') },
       { find: '@quatrain/log', replacement: path.resolve(__dirname, '../../../Core/packages/log/src/index.ts') },
       { find: '@quatrain/core', replacement: path.resolve(__dirname, '../../../Core/packages/core/src/index.ts') },
       { find: '@quatrain/api', replacement: path.resolve(__dirname, '../../../Core/packages/api/src/index.ts') },
       { find: '@quatrain/api-client', replacement: path.resolve(__dirname, '../../../Core/packages/api-client/src/index.ts') },
       { find: '@quatrain/backend', replacement: path.resolve(__dirname, '../../../Core/packages/backend/src/index.ts') },
       { find: '@quatrain/studio', replacement: path.resolve(__dirname, '../../../Core/packages/studio/src/index.ts') },
       { find: '@quatrain/ux', replacement: path.resolve(__dirname, '../../../CoreUX/packages/ux/src/index.ts') },
       { find: '@quatrain/ux-form-react', replacement: path.resolve(__dirname, '../../../CoreUX/packages/ux-form-react/src/index.ts') },
       { find: '@quatrain/ux-list-react', replacement: path.resolve(__dirname, '../../../CoreUX/packages/ux-list-react/src/index.ts') },
       { find: '@quatrain/i18n', replacement: path.resolve(__dirname, '../../../Core/packages/i18n/src/index.ts') },
       { find: '@quatrain/i18n-en', replacement: path.resolve(__dirname, '../../../Core/packages/i18n-en/src/index.ts') },
       { find: '@quatrain/i18n-fr', replacement: path.resolve(__dirname, '../../../Core/packages/i18n-fr/src/index.ts') }
    ]
  }
})
