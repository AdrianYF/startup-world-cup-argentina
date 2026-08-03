// Importar el CSV de asistentes de un canal externo.
//
// Vive en api/_lib/ y no en scripts/ porque lo usan LOS DOS: el CLI
// (`scripts/importar-asistentes.mjs`) y la sección Importar del backoffice. El
// día del evento, quien recibe el CSV por mail no siempre es quien tiene la
// terminal con las variables de entorno cargadas — pero el CLI sigue siendo el
// camino cómodo para un import grande, y las dos formas tienen que traer
// exactamente lo mismo.
import { db } from './db.js'
import { parseCSVObjetos } from './csv.js'
import { DIAS_EVENTO, esDiaConocido, etiquetaDia } from './puerta.js'

/**
 * Cada plataforma nombra las columnas y los estados a su manera. Todo lo
 * específico de un canal vive acá: sumar uno nuevo es agregar una entrada.
 */
export const CANALES = {
  luma: {
    // A propósito SIN `dias` por defecto: Luma corre varios eventos del ciclo en
    // días distintos, así que no hay uno que esté bien la mayoría de las veces.
    // Con un default acá, importar el CSV del jueves sin tocar nada etiquetaba a
    // toda esa gente con el día del otro evento: no aparecían en ninguna lista,
    // no disparaban la alarma de `sinDia` —porque el día existe— y el problema
    // se descubría con la persona parada en la puerta.
    columnas: {
      externo_id: ['api_id', 'guest_api_id', 'id'],
      nombre: ['name', 'full_name', 'nombre'],
      email: ['email', 'email_address'],
      estado: ['approval_status', 'status'],
      ticket: ['ticket_name', 'ticket_type'],
      registrado_en: ['created_at', 'registered_at'],
      checkin_en: ['checked_in_at', 'checkin_at'],
    },
    confirmado: ['approved', 'going', 'attending'],
    rechazado: ['declined', 'rejected', 'cancelled', 'canceled'],
  },
  startupgrind: {
    dias: 'Jue 6 + Vie 7',
    columnas: {
      externo_id: ['order_id', 'order', 'ticket_id', 'id'],
      // Startup Grind exporta nombre y apellido por separado; si no hay una
      // columna de nombre completo, se arma más abajo con first + last.
      nombre: ['name', 'full_name', 'attendee_name'],
      email: ['email', 'email_address', 'attendee_email'],
      estado: ['status', 'order_status', 'payment_status'],
      ticket: ['ticket_type', 'ticket', 'ticket_name'],
      registrado_en: ['order_date', 'created', 'created_at', 'purchase_date'],
      checkin_en: ['checked_in', 'checkin_date', 'checked_in_at'],
    },
    confirmado: ['completed', 'complete', 'paid', 'confirmed', 'attending', 'active'],
    rechazado: ['refunded', 'cancelled', 'canceled', 'failed', 'declined'],
  },
}

const NOMBRE_PARTIDO = {
  nombre: ['first_name', 'firstname', 'given_name'],
  apellido: ['last_name', 'lastname', 'surname', 'family_name'],
}

const norm = s => s.toLowerCase().replace(/[\s-]+/g, '_')

/**
 * Qué columna del archivo corresponde a cada campo.
 *
 * Devuelve también `faltante` cuando un `--map` apunta a una columna que no
 * existe: el CLI corta ahí, y la pantalla lo muestra en vez de importar mal.
 */
export function detectar(columnas, alias, forzado = {}) {
  const porNombre = new Map(columnas.map(c => [norm(c), c]))
  // Las claves salen de `alias` en runtime, así que el compilador no las puede
  // inferir del literal vacío. Anotarlo es lo que deja ver los `_nombre` /
  // `_apellido` que se agregan más abajo.
  /** @type {Record<string, string>} */
  const mapa = {}

  for (const [destino, nombres] of Object.entries(alias)) {
    if (forzado[destino]) {
      const real = porNombre.get(norm(forzado[destino]))
      if (!real) return { error: `la columna "${forzado[destino]}" no está en el archivo` }
      mapa[destino] = real
      continue
    }
    const hit = nombres.find(a => porNombre.has(a))
    if (hit) mapa[destino] = porNombre.get(hit)
  }

  // Nombre partido en dos columnas.
  if (!mapa.nombre) {
    const n = NOMBRE_PARTIDO.nombre.find(a => porNombre.has(a))
    const ap = NOMBRE_PARTIDO.apellido.find(a => porNombre.has(a))
    if (n) mapa._nombre = porNombre.get(n)
    if (ap) mapa._apellido = porNombre.get(ap)
  }

  return { mapa }
}

function fecha(v) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Traduce el estado de la plataforma al vocabulario único de la vista. */
export function normalizarEstado(valor, canal) {
  const v = (valor || '').toLowerCase().trim()
  // Sin columna de estado, todo lo exportado se toma por bueno: varias
  // plataformas sólo dejan exportar las órdenes ya completadas.
  if (!v) return 'confirmado'
  if (canal.confirmado.some(x => v.includes(x))) return 'confirmado'
  if (canal.rechazado.some(x => v.includes(x))) return 'rechazado'
  return 'pendiente'
}

/**
 * Lee el CSV y arma las filas, sin tocar la base.
 *
 * Separado de la escritura porque es exactamente lo que necesita el `--dry` del
 * CLI y la vista previa del backoffice: poder mirar qué va a pasar antes de que
 * pase.
 */
export function preparar({ csv, origen, evento, dias, forzado = {} }) {
  const canal = CANALES[String(origen || '').toLowerCase()]
  if (!canal) {
    return { error: `canal desconocido "${origen}" (conocidos: ${Object.keys(CANALES).join(', ')})` }
  }
  if (!evento) return { error: 'falta el id del evento' }

  const { columnas, filas } = parseCSVObjetos(csv)
  if (!filas.length) return { error: 'el CSV no tiene filas' }

  const r = detectar(columnas, canal.columnas, forzado)
  if (r.error) return r
  const mapa = r.mapa

  if (!mapa.email) {
    return {
      error: 'no se encontró la columna de email, que es la única imprescindible',
      columnas,
    }
  }

  // Los días se validan ACÁ y no sólo en la pantalla: el CLI entra por la misma
  // puerta, y una etiqueta que no matchea ningún día del evento deja a toda la
  // tanda invisible en la acreditación sin que nada falle.
  const diasFinal = (dias || canal.dias || '').trim()
  const etiquetas = DIAS_EVENTO.map(etiquetaDia)
  if (!diasFinal) {
    return {
      error: `falta indicar los días: este canal corre más de un evento y no tiene uno por defecto (opciones: ${etiquetas.join(', ')})`,
    }
  }
  if (!esDiaConocido(diasFinal)) {
    return {
      error: `«${diasFinal}» no contiene ningún día del evento, así que esa gente no aparecería en ninguna lista (esperado: ${etiquetas.join(', ')})`,
    }
  }

  const mapeadas = new Set(Object.values(mapa))
  const porEmail = new Map()
  let sinEmail = 0

  for (const f of filas) {
    const email = (f[mapa.email] || '').toLowerCase().trim()
    if (!email) { sinEmail++; continue }

    const nombre = mapa.nombre
      ? f[mapa.nombre]
      : [mapa._nombre && f[mapa._nombre], mapa._apellido && f[mapa._apellido]]
          .filter(Boolean).join(' ').trim()

    porEmail.set(email, {
      origen: String(origen).toLowerCase(),
      evento: String(evento),
      email,
      dias: diasFinal,
      externo_id: mapa.externo_id ? f[mapa.externo_id] || null : null,
      nombre: nombre || null,
      estado: mapa.estado ? f[mapa.estado] || null : null,
      estado_norm: normalizarEstado(mapa.estado ? f[mapa.estado] : '', canal),
      ticket: mapa.ticket ? f[mapa.ticket] || null : null,
      registrado_en: mapa.registrado_en ? fecha(f[mapa.registrado_en]) : null,
      checkin_en: mapa.checkin_en ? fecha(f[mapa.checkin_en]) : null,
      // Todo lo que no se mapeó, incluidas las preguntas custom del evento.
      extra: Object.fromEntries(
        Object.entries(f).filter(([k, v]) => !mapeadas.has(k) && v !== ''),
      ),
    })
  }

  const registros = [...porEmail.values()]

  return {
    mapa,
    columnas,
    dias: diasFinal,
    registros,
    resumen: {
      filas: filas.length,
      registros: registros.length,
      confirmados: registros.filter(r => r.estado_norm === 'confirmado').length,
      rechazados: registros.filter(r => r.estado_norm === 'rechazado').length,
      pendientes: registros.filter(r => r.estado_norm === 'pendiente').length,
      sinEmail,
      repetidos: Math.max(0, filas.length - registros.length - sinEmail),
    },
  }
}

/**
 * Prepara y, si no es en seco, escribe.
 *
 * El upsert es por `(origen, evento, email)`: reimportar el mismo CSV actualiza
 * en vez de duplicar, que es lo que permite volver a bajarlo a mitad del evento
 * para traer las ventas nuevas.
 */
// `forzado` con default, igual que `preparar()` y `detectar()`: lo manda sólo el
// CLI (`scripts/importar-asistentes.mjs`), donde se pueden mapear columnas a
// mano. Desde el backoffice no viaja — esa pantalla muestra el mapeo detectado
// pero no deja cambiarlo — y sin el default la firma decía que era obligatorio.
export async function importar({ csv, origen, evento, dias, seco = false, forzado = {} }) {
  const previa = preparar({ csv, origen, evento, dias, forzado })
  if (previa.error) return previa

  if (seco) return { ...previa, escrito: false }

  const { error } = await db()
    .from('asistentes_externos')
    .upsert(previa.registros, { onConflict: 'origen,evento,email' })
  if (error) return { error: error.message }

  return { ...previa, escrito: true }
}
