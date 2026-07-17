/* -------- short links (sin backend) --------
 * Hash (FNV-1a) del path → semilla de un PRNG (xorshift32) que emite N letras
 * A–Z → /swc/<CODE>. Código opaco, solo-texto y del largo que se quiera. Como no
 * es reversible, cada sección resuelve con su propia tabla code→src.
 *
 * El algoritmo está replicado en api/og.js (los bots no ejecutan JS): si tocás
 * algo acá, tocá también allá.
 */

export const CODE_LEN = 6

function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function codeFromSrc(src: string): string {
  let h = fnv1a(src) || 1
  let out = ''
  for (let i = 0; i < CODE_LEN; i++) {
    // xorshift32 para más entropía que los 32 bits del hash
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    h >>>= 0
    out += String.fromCharCode(65 + (h % 26)) // A–Z
  }
  return out
}

const SITE = typeof window !== 'undefined' ? window.location.origin : ''

/** Link minimizado con ruta propia: /swc/<CODE> (ruta en main.tsx + OG en /api/og). */
export const shortLink = (src: string) => `${SITE}/swc/${codeFromSrc(src)}`

/** Tabla code→src para resolver un short link dentro de una sección. */
export function codeTable(srcs: string[]): Record<string, string> {
  return Object.fromEntries(srcs.map(s => [codeFromSrc(s), s]))
}

/** Código presente en la URL, ya sea por ruta (/swc/CODE, /g/CODE) o query (?g=, ?c=). */
export function codeFromUrl(queryKey: string): string | null {
  const fromPath = window.location.pathname.match(/^\/(?:swc|g)\/([A-Za-z]+)\/?$/i)
  if (fromPath) return fromPath[1]
  return new URLSearchParams(window.location.search).get(queryKey)
}
