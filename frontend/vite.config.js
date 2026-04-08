import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dashboard API calls
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      // Simulator attack traffic — proxied through WAF
      '/search': { target: 'http://localhost:4000', changeOrigin: true },
      '/login':  { target: 'http://localhost:4000', changeOrigin: true },
      '/file':   { target: 'http://localhost:4000', changeOrigin: true },
      '/exec':   { target: 'http://localhost:4000', changeOrigin: true },
      '/fetch':  { target: 'http://localhost:4000', changeOrigin: true },
      '/test':   { target: 'http://localhost:4000', changeOrigin: true },
      '/wp-admin': { target: 'http://localhost:4000', changeOrigin: true },
    }
  }
})

