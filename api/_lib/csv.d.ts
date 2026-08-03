/**
 * Los tipos de `csv.js`.
 *
 * El módulo es JS plano porque lo comparten tres consumidores: las funciones de
 * `api/` (Node), los scripts del CLI y —desde el export de Inscriptos— el
 * bundle del backoffice (browser). Es puro manejo de strings, sin nada de Node,
 * así que se puede importar de los tres lados.
 *
 * Los tipos viven en un `.d.ts` al lado en vez de convertir el archivo a TS:
 * pasarlo a TypeScript obligaría a compilar toda la carpeta `api/`, que hoy
 * corre tal cual la escribe uno.
 */
export declare function parseCSV(texto: string): string[][]

export declare function parseCSVObjetos(texto: string): {
  columnas: string[]
  filas: Record<string, string>[]
}

export declare function aCSV(
  columnas: string[],
  filas: Record<string, unknown>[],
): string
