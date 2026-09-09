import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tsd-portal/',
  build: {
    outDir: '../public/tsd-portal',
    emptyOutDir: true,
    minify: false
  }
})
