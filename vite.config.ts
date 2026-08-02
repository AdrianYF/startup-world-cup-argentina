import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-expect-error — plugin propio en .mjs, sin tipos
import { apiFunctions } from './scripts/vite-plugin-api.mjs'

/**
 * En dev, `/puerta` (sin barra final) cae al fallback de la SPA y sirve el
 * index.html del sitio: el html fallback de Vite sólo prueba `puerta.html` y
 * `/puerta/index.html`, en ese orden, y con la barra. En Vercel lo resuelve el
 * rewrite de vercel.json; esto hace que local se comporte igual.
 */
function puertaConBarra(): Plugin {
  return {
    name: 'puerta-con-barra',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/puerta') {
          res.writeHead(302, { Location: '/puerta/' })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Ejecuta las funciones de api/ en el dev server. Sin esto, `/api/*` cae al
    // fallback de la SPA y un POST devuelve 404. Sólo dev: en Vercel las sirve
    // la plataforma.
    apiFunctions({ raiz: import.meta.dirname }),
    puertaConBarra(),
  ],
  // Dos apps, dos bundles, un solo deploy.
  //
  //   index.html        el sitio (React Router, Three.js, todo el landing)
  //   puerta/index.html la acreditación
  //
  // Separadas porque no comparten nada de UI y sí compiten por el peso: la
  // puerta se abre en la fila de entrada, con el 4G del venue, y no tiene por
  // qué bajar el bundle del landing para mostrar una lista de nombres.
  build: {
    rollupOptions: {
      input: {
        sitio: resolve(import.meta.dirname, 'index.html'),
        puerta: resolve(import.meta.dirname, 'puerta/index.html'),
      },
    },
  },
  // Una sola instancia de three (evita que el import de three/examples rompa r3f)
  resolve: {
    dedupe: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    // Permitir cualquier subdominio *.ngrok-free.app (y otros tunnels usuales)
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io', '.trycloudflare.com'],
  },
})
