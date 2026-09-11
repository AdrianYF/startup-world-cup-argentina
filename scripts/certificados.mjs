#!/usr/bin/env node
/**
 * Publica certificados de participación a partir de sus PDFs.
 *
 *   node scripts/certificados.mjs <carpeta-con-pdfs>
 *
 * Por cada PDF de la carpeta lee el rol y el nombre del texto del certificado,
 * copia el PDF tal cual a `public/certificados/<slug>.pdf`, genera la preview
 * JPG al lado y suma (o pisa, si ya estaba) la entrada en
 * `src/content/certificados.json`, que es lo que lista `/certificados`.
 *
 * Es idempotente por slug: correrlo dos veces con la misma carpeta deja todo
 * igual, y correrlo con una carpeta nueva agrega sin borrar lo anterior.
 *
 * Necesita poppler (`brew install poppler`): `pdftotext` para leer el texto y
 * `pdftoppm` para la preview.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CARPETA_PUBLICA = join(RAIZ, 'public', 'certificados')
const ARCHIVO_JSON = join(RAIZ, 'src', 'content', 'certificados.json')

/**
 * Un nombre impreso todo en mayúsculas («FRANCIS PERELMAN») pasa a Título
 * palabra por palabra. El resto queda exactamente como está en el PDF: la
 * plantilla no fija cómo se escribe el nombre, y no hay forma de reconstruir
 * un «McDonald» o un «de la Cruz» a partir de las mayúsculas.
 */
export function tituloSiMayusculas(nombre) {
  if (/\p{Ll}/u.test(nombre)) return nombre
  return nombre
    .toLocaleLowerCase('es')
    .replace(/(^|\s)(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase('es'))
}

/** Lo que va en la URL: minúsculas, sin acentos ni ñ, y guiones entre palabras. */
export function slugify(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Saca `{ nombre, rol }` del texto crudo de `pdftotext` (sin `-layout`).
 *
 * La plantilla del certificado pone el rol en la primera línea con texto
 * después de «DE PARTICIPACIÓN» y el nombre en la primera después de
 * «SE OTORGA A:». Si alguno de los dos marcadores no está, el PDF no es de
 * esta plantilla y es mejor cortar que publicar un certificado sin nombre.
 */
export function parsearCertificado(texto) {
  const lineas = texto.split(/\r?\n/).map(l => l.normalize('NFC').trim())
  const despuesDe = marcador => {
    const i = lineas.indexOf(marcador)
    if (i === -1) throw new Error(`No encontré «${marcador}» en el texto del certificado`)
    const valor = lineas.slice(i + 1).find(Boolean)
    if (!valor) throw new Error(`No hay nada después de «${marcador}» en el texto del certificado`)
    return valor
  }
  return {
    rol: despuesDe('DE PARTICIPACIÓN').toLocaleLowerCase('es'),
    nombre: tituloSiMayusculas(despuesDe('SE OTORGA A:')),
  }
}

function requerir(bin) {
  try {
    execFileSync(bin, ['-v'], { stdio: 'ignore' })
  } catch (e) {
    if (e.code !== 'ENOENT') return
    console.error(`Falta \`${bin}\`. Es parte de poppler: brew install poppler`)
    process.exit(1)
  }
}

function main(carpeta) {
  if (!carpeta) {
    console.error('Uso: node scripts/certificados.mjs <carpeta-con-pdfs>')
    process.exit(1)
  }
  requerir('pdftotext')
  requerir('pdftoppm')

  const dir = resolve(carpeta)
  const pdfs = readdirSync(dir).filter(f => /\.pdf$/i.test(f)).sort()
  if (!pdfs.length) {
    console.error(`No hay PDFs en ${dir}`)
    process.exit(1)
  }

  mkdirSync(CARPETA_PUBLICA, { recursive: true })
  const lista = existsSync(ARCHIVO_JSON) ? JSON.parse(readFileSync(ARCHIVO_JSON, 'utf8')) : []

  for (const archivo of pdfs) {
    const origen = join(dir, archivo)
    const texto = execFileSync('pdftotext', [origen, '-'], { encoding: 'utf8' })
    const { nombre, rol } = parsearCertificado(texto)
    const slug = slugify(nombre)

    copyFileSync(origen, join(CARPETA_PUBLICA, `${slug}.pdf`))
    // `-singlefile` escribe `<slug>.jpg` sin el sufijo de página que pdftoppm
    // agrega por defecto; el certificado es de una sola página.
    execFileSync('pdftoppm', [
      '-jpeg', '-r', '150', '-scale-to', '1600', '-singlefile', '-jpegopt', 'quality=85',
      origen, join(CARPETA_PUBLICA, slug),
    ], { stdio: 'inherit' })

    const entrada = { slug, nombre, rol, img: `/certificados/${slug}.jpg`, pdf: `/certificados/${slug}.pdf` }
    const i = lista.findIndex(c => c.slug === slug)
    // Al actualizar se conserva cualquier campo que se haya agregado a mano.
    if (i === -1) lista.push(entrada)
    else lista[i] = { ...lista[i], ...entrada }
    console.log(`${i === -1 ? 'nuevo      ' : 'actualizado'}  ${nombre} (${rol}) → ${slug}`)
  }

  // Por rol y después por nombre, así el JSON se lee igual que la página.
  lista.sort((a, b) => a.rol.localeCompare(b.rol, 'es') || a.nombre.localeCompare(b.nombre, 'es'))
  writeFileSync(ARCHIVO_JSON, JSON.stringify(lista, null, 2) + '\n')
  console.log(`${lista.length} certificados en ${ARCHIVO_JSON}`)
}

// Sólo corre cuando se invoca como script: los tests importan los helpers de
// arriba sin que esto se ejecute.
const esPrincipal = Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (esPrincipal) main(process.argv[2])
