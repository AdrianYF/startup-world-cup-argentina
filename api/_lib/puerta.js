// Lo compartido por la pantalla de puerta: los días del evento y la sesión del
// staff.
//
// Vive en api/_lib/ (con guión bajo) para que Vercel no lo exponga como ruta.
// `scripts/lista-puerta.mjs` importa DIAS de acá para no tener su propia copia.
import crypto from 'node:crypto'
import { valorDe } from './entorno.js'

/**
 * Los días que atiende ESTA puerta.
 *
 * `label` es lo que hay que buscar dentro de `acreditacion.dias`, que es texto
 * libre ('Mié 5', 'Jue 6 + Vie 7') porque lo escribe cada canal. Es frágil, pero
 * es el formato que ya usan las migraciones y el importador.
 *
 * `fecha` es lo que se guarda en `checkins.dia`.
 */
export const DIAS = [
  { id: 'jue', fecha: '2026-08-06', label: 'Jue', nombre: 'Jueves 6' },
  { id: 'vie', fecha: '2026-08-07', label: 'Vie', nombre: 'Viernes 7' },
]

/**
 * Días del evento que esta puerta NO atiende.
 *
 * El miércoles 5 es un side event en otro venue, con su propia acreditación. Su
 * gente sigue entrando al padrón —el import de Luma es el mismo— pero no abre
 * una lista acá ni se le puede anotar un ingreso.
 *
 * Existen como constante en vez de borrarse por una sola razón: sin esto, cada
 * fila que dice «Mié 5» pasaría a no coincidir con ningún día y caería en
 * `sinDia`, que es el cartel rojo de «revisar el import». Esa alarma tiene que
 * seguir queriendo decir «este dato está roto», no «esta persona es del otro
 * evento».
 */
export const DIAS_AJENOS = [
  { id: 'mie', fecha: '2026-08-05', label: 'Mié', nombre: 'Miércoles 5' },
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

/** Todos los días del evento, los atienda esta puerta o no, en orden. */
export const DIAS_EVENTO = [...DIAS, ...DIAS_AJENOS]
  .sort((a, b) => a.fecha.localeCompare(b.fecha))

/**
 * El texto que espera `acreditacion.dias` para un día: 'Jue 6'.
 *
 * La convención está acá y no repetida en cada lado que la arma, porque el
 * match es un `includes` sobre texto libre: un «Jueves 6» o un «jue 6» no
 * coinciden con nada y esa persona no aparece en ninguna lista.
 */
export function etiquetaDia(d) {
  return `${d.label} ${Number(d.fecha.slice(-2))}`
}

/**
 * True si el texto libre cae en algún día del evento, lo atienda esta puerta o
 * no. Lo que devuelve false es lo que hay que ir a mirar: un CSV que exportó
 * «6/8» o «Jueves» y dejó a esa gente invisible en todos lados.
 */
export function esDiaConocido(dias) {
  return DIAS_EVENTO.some(d => habilitaDia(dias, d.label))
}

/* -------------------------------------------------------------------------- */
/* Sesión                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Cuánto dura una sesión, contada desde que se firma.
 *
 * Era una FECHA FIJA (`Date.UTC(2026, 7, 9)`) y eso tenía un final malo escrito
 * adentro: pasada esa fecha, `firmarSesion()` emitía tokens YA vencidos. O sea
 * que el backoffice no se quedaba sin sesión — se volvía imposible de abrir, con
 * 401 permanente y sin forma de entrar ni sabiendo el PIN. La única salida era
 * tocar el código.
 *
 * Y el backoffice no muere con el evento: los reembolsos, Ventas y Métricas se
 * miran la semana siguiente, que es justo cuando la fecha fija ya había pasado.
 *
 * Siete días desde cada login. Cubre los tres días del evento sin que a nadie se
 * le corte la sesión en el medio —quien entra el miércoles sigue adentro el
 * viernes— y acota lo que puede hacer un celular perdido: en esa pantalla queda
 * cacheada la lista entera, con el mail y el teléfono de cada persona.
 *
 * Para revocar todo de una sigue estando cambiar `PUERTA_SECRET`.
 */
const DURACION_MS = 7 * 24 * 60 * 60 * 1000

const b64 = buf => Buffer.from(buf).toString('base64url')

function secreto() {
  // `valorDe` ya tira nombrando la variable del entorno activo
  // (PUERTA_SECRET o PUERTA_TEST_SECRET), que es la mitad del problema cuando
  // esto falla en un preview.
  return valorDe('PUERTA_SECRET')
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
  const esperado = valorDe('PUERTA_PIN', { obligatoria: false })
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
export function firmarSesion(ahora = Date.now()) {
  const payload = b64(JSON.stringify({ exp: ahora + DURACION_MS }))
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
