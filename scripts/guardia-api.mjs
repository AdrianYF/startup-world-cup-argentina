#!/usr/bin/env node
/**
 * Que `api/` siga siendo desplegable. Dos preguntas, las dos baratas:
 *
 *   1. ¿Sigue habiendo 12 funciones o menos?
 *   2. ¿Las levanta Node pelado?
 *
 * Las dos existen porque sus fallas son silenciosas hasta que ya es tarde.
 *
 * El TOPE de 12 es el del plan Hobby de Vercel. Pasarse no rompe nada local ni
 * tira ningún error: simplemente el deploy no sale. El 6 de agosto eso quiere
 * decir que la app de puerta no existe. Hoy lo único que lo defiende es un
 * comentario en `api/backoffice.js`.
 *
 * El IMPORT es la otra mitad. En dev las funciones las sirve el plugin de Vite,
 * que transpila y resuelve distinto que Node; en Vercel corren en Node pelado.
 * Ya pasó: `api/_lib/email.tsx` cargaba perfecto en local y en producción tiraba
 * ERR_UNKNOWN_FILE_EXTENSION, y se llevó puesto `/api/backoffice` entero — el
 * check-in incluido — por un template de mail. Ver scripts/build-emails.mjs.
 *
 *   node scripts/guardia-api.mjs
 */
import { readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API = resolve(RAIZ, 'api')

/** El tope del plan Hobby de Vercel. */
const TOPE = 12

/**
 * Toda extensión que Vercel convierte en función, no sólo `.js`.
 *
 * Con `.js` solo, el día que un handler pase a TypeScript esto contaría CERO,
 * imprimiría `0/12` y pasaría en verde — la única defensa automática del tope
 * volviéndose un test que aprueba siempre, justo mientras te pasás. A Vercel la
 * extensión del fuente le da igual: la función la cuenta lo mismo.
 */
const EXTENSIONES = ['.js', '.mjs', '.ts', '.mts', '.tsx']

const archivos = (await readdir(API, { withFileTypes: true }))
  .filter(e => e.isFile() && EXTENSIONES.some(ext => e.name.endsWith(ext)))
  .map(e => e.name)
  .sort()

let mal = 0

console.log(`\n  funciones   ${archivos.length}/${TOPE}`)

// Cero handlers no es «todo bien», es que este script está mirando donde no es.
// Sin esto, cualquier cosa que le rompa la búsqueda —un rename, mover la
// carpeta— lo deja pasando en verde para siempre.
if (archivos.length === 0) {
  console.error('\n  ✗ No encontré ninguna función en api/. Esto no puede estar bien:')
  console.error('    o se movió la carpeta, o cambiaron las extensiones. Revisá este script.\n')
  process.exit(1)
}
if (archivos.length > TOPE) {
  console.error(`\n  ✗ ${archivos.length} funciones en api/, y Vercel Hobby banca ${TOPE}.`)
  console.error('    El deploy no va a salir. Lo compartido va a api/_lib/ (el guión bajo')
  console.error('    hace que no se rutee) y los endpoints nuevos detrás del ?r= de')
  console.error('    api/backoffice.js.\n')
  mal++
}

// El `.env.local` no se carga a propósito: esto prueba que el MÓDULO cargue, no
// que esté configurado. Las funciones resuelven sus credenciales adentro del
// handler justamente para que importarlas no dependa del entorno.
for (const nombre of archivos) {
  try {
    const mod = await import(pathToFileURL(resolve(API, nombre)).href)
    if (typeof mod.default !== 'function') {
      console.error(`  ✗ api/${nombre} no exporta un handler por default`)
      mal++
      continue
    }
    console.log(`  ✓ api/${nombre}`)
  } catch (err) {
    console.error(`  ✗ api/${nombre} no carga en Node: ${err.message}`)
    mal++
  }
}

if (mal) {
  console.error(`\n  ${mal} problema(s).\n`)
  process.exit(1)
}
console.log('\n  api/ desplegable.\n')
