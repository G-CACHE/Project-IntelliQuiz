import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import it

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync('./certs/localhost-key.pem'),
      cert: fs.readFileSync('./certs/localhost-cert.pem'),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false, // Accept self-signed backend cert
      },
      '/ws': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        ws: true,
        secure: false, // Accept self-signed backend cert
      },
    },
  },
  define: {
    global: 'globalThis',
  },
})