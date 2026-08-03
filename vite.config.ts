import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-expect-error — plugin propio en .mjs, sin tipos
import { apiFunctions } from './scripts/vite-plugin-api.mjs'

/**
 * En dev, todo lo que cuelga de `/backoffice` tiene que caer en su index.html.
 *
 * El fallback de Vite sólo prueba `backoffice.html` y `/backoffice/index.html`,
 * y siempre con la barra final: sin esto, `/backoffice` pelado y
 * `/backoffice/ventas` —que es una ruta del router propio, no un archivo— caen
 * al fallback de la SPA y sirven el index del sitio.
 *
 * `/puerta` sigue andando porque es el link que el staff tiene guardado desde
 * antes del rename. En Vercel lo resuelven los rewrites de vercel.json; esto
 * hace que local se comporte igual.
 */
function rutasDelBackoffice(): Plugin {
  return {
    name: 'swc:rutas-backoffice',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]

        if (url === '/puerta' || url === '/puerta/') {
          res.writeHead(302, { Location: '/backoffice/' })
          res.end()
          return
        }

        if (url === '/backoffice') {
          res.writeHead(302, { Location: '/backoffice/' })
          res.end()
          return
        }

        // `/backoffice/ventas` y compañía: son rutas del router, no archivos.
        if (url.startsWith('/backoffice/') && !url.includes('.')) {
          req.url = '/backoffice/index.html'
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
    rutasDelBackoffice(),
  ],
  // Dos apps, dos bundles, un solo deploy.
  //
  //   index.html            el sitio (React Router, Three.js, todo el landing)
  //   backoffice/index.html la puerta y el resto de la operación
  //
  // Separadas porque no comparten nada de UI y sí compiten por el peso: la
  // puerta se abre en la fila de entrada, con el 4G del venue, y no tiene por
  // qué bajar el bundle del landing para mostrar una lista de nombres.
  build: {
    rollupOptions: {
      input: {
        sitio: resolve(import.meta.dirname, 'index.html'),
        backoffice: resolve(import.meta.dirname, 'backoffice/index.html'),
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
