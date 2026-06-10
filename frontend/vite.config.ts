import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      '/metadata': { target: 'http://localhost:8000', changeOrigin: true },
      '/predict': { target: 'http://localhost:8000', changeOrigin: true },
      '/figures': { target: 'http://localhost:8000', changeOrigin: true },
      '/content': { target: 'http://localhost:8000', changeOrigin: true },
      '/analytics': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
