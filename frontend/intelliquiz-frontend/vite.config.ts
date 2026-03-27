import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import it

const enableHttps = process.env.VITE_DEV_HTTPS === 'true'
const backendTarget = process.env.VITE_BACKEND_TARGET || 'http://127.0.0.1:8090'

const httpsConfig = enableHttps
  ? {
      key: fs.readFileSync('./certs/localhost-key.pem'),
      cert: fs.readFileSync('./certs/localhost-cert.pem'),
    }
  : undefined

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    https: httpsConfig,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: backendTarget,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
})