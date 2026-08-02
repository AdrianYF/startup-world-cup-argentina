// Lo compartido por la pantalla de puerta: los días del evento y la sesión del
// staff.
//
// Vive en api/_lib/ (con guión bajo) para que Vercel no lo exponga como ruta.
// `scripts/lista-puerta.mjs` importa DIAS de acá para no tener su propia copia.
import crypto from 'node:crypto'

/**
 * Los tres días del evento.
 *
 * `label` es lo que hay que buscar dentro de `acreditacion.dias`, que es texto
 * libre ('Mié 5', 'Jue 6 + Vie 7') porque lo escribe cada canal. Es frágil, pero
 * es el formato que ya usan las migraciones y el importador.
 *
 * `fecha` es lo que se guarda en `checkins.dia`.
 */
export const DIAS = [
  { id: 'mie', fecha: '2026-08-05', label: 'Mié', nombre: 'Miércoles 5' },
  { id: 'jue', fecha: '2026-08-06', label: 'Jue', nombre: 'Jueves 6' },
  { id: 'vie', fecha: '2026-08-07', label: 'Vie', nombre: 'Viernes 7' },
]

/** El día por su id ('jue'), o null. */
export function dia(id) {
  return DIAS.find(d => d.id === String(id || '').toLowerCase()) || null
}

/**
 * El día del evento que corresponde a hoy en Buenos Aires, o el primero si el
 * evento todavía no arrancó (o ya pasó): la puerta siempre abre en algo
 * razonable y el staff corrige con el selector si hace falta.
 */
export function diaDeHoy(ahora = new Date()) {
  const hoy = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  return DIAS.find(d => d.fecha === hoy) || DIAS[0]
}

/** Los días que habilita una fila de `acreditacion`, por su texto libre. */
export function habilitaDia(dias, label) {
  return String(dias || '').includes(label)
}

/* -------------------------------------------------------------------------- */
/* Sesión                                                                      */
/* -------------------------------------------------------------------------- */

// Después del evento la sesión no sirve para nada, así que no tiene sentido que
// siga viva.
const VENCE = Date.UTC(2026, 7, 9) // 9 de agosto de 2026, 00:00 UTC

const b64 = buf => Buffer.from(buf).toString('base64url')

function secreto() {
  const s = process.env.PUERTA_SECRET
  if (!s) throw new Error('falta PUERTA_SECRET (ver .env.example)')
  return s
}

function firmar(payload) {
  return crypto.createHmac('sha256', secreto()).update(payload).digest('base64url')
}

/** Comparación sin filtrar información por el tiempo que tarda. */
function igual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

/** True si el PIN es el correcto. False si no lo es o si no hay PIN configurado. */
export function pinValido(pin) {
  const esperado = process.env.PUERTA_PIN
  // Sin PIN configurado no se entra: un `if (!esperado) return true` acá dejaría
  // la lista de asistentes abierta en cuanto alguien olvide cargar la variable.
  if (!esperado || typeof pin !== 'string' || !pin) return false
  return igual(pin, esperado)
}

/**
 * Token de sesión: el vencimiento firmado, nada más.
 *
 * Sin estado en la base, igual que `ticket_token`: no hay usuarios que listar ni
 * sesiones que expirar a mano. Para revocar todo, se cambia `PUERTA_SECRET`.
 */
export function firmarSesion() {
  const payload = b64(JSON.stringify({ exp: VENCE }))
  return `${payload}.${firmar(payload)}`
}

/** True si el token es nuestro y no venció. */
export function sesionValida(token) {
  if (typeof token !== 'string') return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false

  let esperada
  try {
    esperada = firmar(payload)
  } catch {
    return false // falta PUERTA_SECRET
  }
  if (sig.length !== esperada.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperada))) return false

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return typeof exp === 'number' && Date.now() < exp
  } catch {
    return false
  }
}

/**
 * Corta si no hay sesión. Devuelve true si ya respondió — mismo contrato que
 * `rejectMethod` de http.js.
 */
export function rejectSinSesion(req, res) {
  const auth = req.headers?.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (sesionValida(token)) return false

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(401).send(JSON.stringify({ error: 'sin_sesion' }))
  return true
}
