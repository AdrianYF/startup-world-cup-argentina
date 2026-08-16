/**
 * Los tipos de `vip.js`.
 *
 * Mismo motivo que `csv.d.ts`: el módulo es JS plano porque lo comparten el
 * bundle del backoffice (browser) y los scripts del CLI (Node), y pasarlo a
 * TypeScript obligaría a compilar toda la carpeta `api/`.
 */
export declare function esVIP(entrada: unknown): boolean
