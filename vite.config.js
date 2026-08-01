import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/voto-informado/',
  server: {
    proxy: {
      '/api/senado': {
        target: 'https://tramitacion.senado.cl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/senado/, '/wspublico'),
        headers: { 'User-Agent': 'VotoInformado/1.0' },
      },
      '/api/camara': {
        target: 'https://opendata.camara.cl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/camara/, ''),
        headers: { 'User-Agent': 'VotoInformado/1.0' },
      },
    },
  },
})
