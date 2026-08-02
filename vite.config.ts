import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-expect-error — plugin propio en .mjs, sin tipos
import { apiFunctions } from './scripts/vite-plugin-api.mjs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Ejecuta las funciones de api/ en el dev server. Sin esto, `/api/*` cae al
    // fallback de la SPA y un POST devuelve 404. Sólo dev: en Vercel las sirve
    // la plataforma.
    apiFunctions({ raiz: import.meta.dirname }),
  ],
  // Una sola instancia de three (evita que el import de three/examples rompa r3f)
  resolve: {
    dedupe: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    // Permitir cualquier subdominio *.ngrok-free.app (y otros tunnels usuales)
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io', '.trycloudflare.com'],
  },
})
