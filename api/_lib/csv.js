/**
 * Parser de CSV (RFC 4180).
 *
 * Escrito a mano y no con `split(',')` porque los nombres reales traen comas
 * ("Perez, Ana"), las respuestas a preguntas custom traen saltos de línea, y las
 * comillas se escapan duplicándolas. Un split parte esas filas al medio y
 * corre todas las columnas siguientes, en silencio.
 */

/** Filas como array de arrays, respetando comillas y saltos embebidos. */
export function parseCSV(texto) {
  // BOM: Excel lo mete al guardar y se pega al nombre de la primera columna.
  //
  // Escapado como \uFEFF y no con el carácter literal, que es como estaba: el
  // literal es INVISIBLE en el editor —la regex parece un `/^/` que no matchea
  // nada— y cualquier herramienta que normalice espacios se lo lleva puesto sin
  // que nadie lo note. Sería un bug mudo: los CSV de Excel dejarían de importar.
  const s = texto.replace(/^\uFEFF/, '')
  const filas = []
  let fila = []
  let campo = ''
  let enComillas = false

  for (let i = 0; i < s.length; i++) {
    const c = s[i]

    if (enComillas) {
      if (c === '"') {
        // Dos comillas seguidas son una comilla literal.
        if (s[i + 1] === '"') {
          campo += '"'
          i++
        } else {
          enComillas = false
        }
      } else {
        campo += c
      }
      continue
    }

    if (c === '"') {
      enComillas = true
    } else if (c === ',') {
      fila.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      // \r\n cuenta como un solo salto.
      if (c === '\r' && s[i + 1] === '\n') i++
      fila.push(campo)
      filas.push(fila)
      fila = []
      campo = ''
    } else {
      campo += c
    }
  }

  // Último campo, si el archivo no termina en salto de línea.
  if (campo !== '' || fila.length) {
    fila.push(campo)
    filas.push(fila)
  }

  // Se descartan las filas totalmente vacías (el salto final del archivo).
  return filas.filter(f => f.some(v => v.trim() !== ''))
}

/** Filas como objetos, usando la primera fila como encabezado. */
export function parseCSVObjetos(texto) {
  const filas = parseCSV(texto)
  if (!filas.length) return { columnas: [], filas: [] }

  const columnas = filas[0].map(h => h.trim())
  return {
    columnas,
    filas: filas.slice(1).map(f =>
      Object.fromEntries(columnas.map((c, i) => [c, (f[i] ?? '').trim()])),
    ),
  }
}

/** Serializa a CSV, escapando lo que haga falta. */
export function aCSV(columnas, filas) {
  const escapar = v => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    columnas.map(escapar).join(','),
    ...filas.map(f => columnas.map(c => escapar(f[c])).join(',')),
  ].join('\n')
}
