import { defineConfig } from 'vitest/config'

/**
 * Los tests.
 *
 * Dos proyectos porque son dos mundos: `api/` y `scripts/` corren en Node, y
 * `src/` y `backoffice/` en el navegador. Un solo runner para los dos porque la
 * suite tiene que cruzar el límite JS/TS —`api/_lib/csv.js` lo comparten Node, el
 * CLI y el bundle del browser— y eso `node --test` no lo puede cargar.
 *
 * Lo que este archivo NO cubre, y hay que tenerlo presente: en dev las funciones
 * las sirve el plugin de Vite y en Vercel corren en Node pelado. Que un test pase
 * acá no prueba que el módulo cargue allá. Eso lo prueba `npm run guardia:api`,
 * que es la otra mitad y la que va en CI al lado de esto.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/*.test.{js,ts}'],
        },
      },
      {
        // Contra el Postgres local. Se saltean solos si Supabase no está
        // levantado, así que `npm test` sigue andando en cualquier máquina.
        // Corren en serie: comparten una base y se pisarían el stock.
        test: {
          name: 'integracion',
          environment: 'node',
          include: ['test/integracion/**/*.test.{js,ts}'],
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
  },
})
