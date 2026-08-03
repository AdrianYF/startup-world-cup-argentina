#!/usr/bin/env node
/**
 * Compila los templates de mail de `.tsx` a `.js`.
 *
 *   npm run build:emails
 *
 * Hace falta porque `api/` en Vercel corre en Node pelado, y Node no puede
 * cargar un `.tsx`: tira `ERR_UNKNOWN_FILE_EXTENSION`. En local no se notaba
 * porque las funciones las sirve el plugin de Vite, que transpila al vuelo — el
 * import moría recién en producción, y se llevaba puesta toda la cadena:
 * `backoffice.js` → `admin.js` → `acreditar.js` → `email.tsx`. O sea el
 * check-in entero, por un template de mail que ni se usa al acreditar.
 *
 * El `.js` que sale de acá se commitea. Es output de build en el repo, que no
 * es lindo, pero la alternativa —generarlo en el build de Vercel— depende de
 * que Vercel levante archivos que aparecieron durante el build, y eso no lo
 * puedo probar sin acceso al proyecto. Con el archivo en git no hay nada que
 * probar. Igual se regenera en cada `npm run build`, así que si alguien edita
 * el `.tsx` y no corre esto, lo que se despliega sale del `.tsx` igual.
 *
 * Los `.tsx` siguen siendo la fuente: se editan esos, nunca el `.js`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Los dos templates. Se compilan por separado y no en un bundle para que el
 * `.js` mantenga la misma forma que el `.tsx` y se pueda leer al lado.
 */
const ARCHIVOS = [
  'api/_lib/email.tsx',
  'api/_lib/emails/entrada.tsx',
]

const OPCIONES = {
  // `react-jsx` para no tener que importar React en cada template.
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  // Sólo transpila: no chequea tipos ni resuelve imports, que es justo lo que
  // queremos. Los specifiers salen tal cual entraron, por eso los `.tsx`
  // importan entre sí con extensión `.js`.
  isolatedModules: true,
}

const AVISO = '// Generado por scripts/build-emails.mjs — no editar. La fuente es el .tsx de al lado.\n'

let cambiados = 0

for (const rel of ARCHIVOS) {
  const entrada = resolve(RAIZ, rel)
  const salida = entrada.replace(/\.tsx$/, '.js')

  const fuente = await readFile(entrada, 'utf8')
  const { outputText } = ts.transpileModule(fuente, {
    compilerOptions: OPCIONES,
    fileName: entrada,
  })

  const nuevo = AVISO + outputText
  const viejo = await readFile(salida, 'utf8').catch(() => null)

  if (viejo === nuevo) {
    console.log(`  = ${rel.replace(/\.tsx$/, '.js')}`)
    continue
  }

  await writeFile(salida, nuevo)
  cambiados++
  console.log(`  ✓ ${rel.replace(/\.tsx$/, '.js')}`)
}

console.log(cambiados ? `\n  ${cambiados} template(s) compilado(s).\n` : '\n  Sin cambios.\n')
