import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: path.join(import.meta.dirname, 'renderer'),
  base: './',
  build: {
    outDir: path.join(import.meta.dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  plugins: [react()],
  server: {
    port: 3000
  }
})
