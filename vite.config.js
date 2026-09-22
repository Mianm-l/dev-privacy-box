import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './', // Ensures relative asset paths for GitHub Pages deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
