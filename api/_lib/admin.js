// Lo que hace el backoffice más allá de la puerta: asistentes, ventas, stock,
// import y métricas.
//
// Vive en un módulo y no en rutas propias porque `api/` ya tiene 12 funciones,
// que es el tope del plan Hobby de Vercel: una ruta más y el deploy no sale.
// Todo entra por `api/backoffice.js?r=<recurso>`, que además deja la superficie
// protegida por `rejectSinSesion` en un solo archivo fácil de auditar.
import { db, stockDisponible } from './db.js'
import { json, esMailValido, formatARS } from './http.js'
import { DIAS, esDiaConocido, habilitaDia } from './puerta.js'
import { desglose } from './precios.js'
import { reenviarEntrada } from './acreditar.js'
import { importar } from './importar.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* -------------------------------------------------------------------------- */
/* Asistentes                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * La lista entera, sin filtro de día.
 *
 * A diferencia de `/api/puerta`, acá SÍ viaja el `token` de cada entrada: es lo
 * que hace falta para copiar el link, mostrar el QR y reenviar el mail, que son
 * las tres cosas que se piden cuando alguien dice "no me llegó". La sección está
 * detrás del mismo PIN y no se abre en la fila de entrada.
 */
export async function asistentes(res) {
  const [{ data: filas, error }, { data: ambos, error: errAmbos }] = await Promise.all([
    db().from('acreditacion').select('*'),
    db().from('acreditacion_ambos_canales').select('email, origenes'),
  ])
  if (error) throw error
  // Se tira, no se ignora: si esta vista falla y seguimos, la pantalla dice
  // «nadie pagó dos veces», que es una respuesta y no un error. El aviso de pago
  // doble desaparecería del backoffice entero sin que nadie se entere.
  if (errAmbos) throw errAmbos

  const dobles = new Set(
    (ambos || [])
      .filter(p => (p.origenes || '').includes('web') && (p.origenes || '').includes('startupgrind'))
      .map(p => p.email),
  )

  json(res, 200, {
    personas: (filas || []).map(f => ({
      id: f.id,
      origen: f.origen,
      nombre: f.nombre,
      email: f.email,
      telefono: f.telefono,
      empresa: f.empresa,
      entrada: f.entrada,
      dias: f.dias,
      token: f.token,
      usadaEn: f.usada_en,
      registradoEn: f.registrado_en,
      pagoDoble: dobles.has(f.email),
      // Que la pantalla pueda avisar por qué esta persona no aparece en ninguna
      // puerta, en vez de dejar que se descubra el día del evento.
      sinDia: !esDiaConocido(f.dias),
    })),
  })
}

/**
 * Corregir los datos de una persona.
 *
 * `acreditacion` es una vista y no se puede escribir: hay que ir a la tabla de
 * origen, que es distinta según el canal.
 *
 *   web       → el nombre es del asistente (`entradas`), el contacto es del
 *               COMPRADOR (`orders`) y lo comparten todas las entradas de esa
 *               compra. Corregirle el mail a uno se lo corrige a los tres, que
 *               es lo correcto: es el mail al que llegó la compra.
 *   los demás → `asistentes_externos`, todo en la misma fila.
 */
export async function editarPersona(res, body) {
  const id = String(body.id || '')
  const origen = String(body.origen || '')
  if (!UUID_RE.test(id)) return json(res, 400, { error: 'id_invalido' })

  const nombre = String(body.nombre ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const telefono = String(body.telefono ?? '').trim()
  const empresa = String(body.empresa ?? '').trim()

  if (nombre.length < 2) return json(res, 400, { error: 'nombre_requerido' })
  if (email && !esMailValido(email)) return json(res, 400, { error: 'email_invalido' })

  if (origen === 'web') {
    const { data: entrada, error } = await db()
      .from('entradas')
      .update({ nombre })
      .eq('id', id)
      .select('order_id')
      .maybeSingle()
    if (error) throw error
    if (!entrada) return json(res, 404, { error: 'persona_inexistente' })

    const { error: errOrden } = await db()
      .from('orders')
      .update({
        ...(email ? { buyer_email: email } : {}),
        buyer_telefono: telefono || null,
        buyer_empresa: empresa || null,
      })
      .eq('id', entrada.order_id)
    if (errOrden) throw errOrden
  } else {
    // `extra` es jsonb y se pisa entero: hay que leerlo para no perder lo que
    // trajo el CSV del canal (respuestas a preguntas custom, tipo de ticket…).
    const { data: previa, error: errLeer } = await db()
      .from('asistentes_externos')
      .select('extra')
      .eq('id', id)
      .maybeSingle()
    if (errLeer) throw errLeer
    if (!previa) return json(res, 404, { error: 'persona_inexistente' })

    const extra = { ...(previa.extra || {}) }
    if (empresa) extra.company = empresa
    else delete extra.company
    if (telefono) extra.phone = telefono
    else delete extra.phone

    const { error } = await db()
      .from('asistentes_externos')
      .update({ nombre, email: email || null, extra })
      .eq('id', id)
    if (error) throw error
  }

  json(res, 200, { ok: true })
}

/**
 * Dar de baja a alguien de un canal externo: deja de aparecer en la puerta.
 *
 * Sólo para los canales externos. Del lado web la unidad es la COMPRA y no la
 * persona: dar de baja una entrada de tres dejaría una orden paga a medias.
 * Eso se hace desde Ventas, marcando la orden, donde la consecuencia se ve.
 */
export async function bajaPersona(res, body) {
  const id = String(body.id || '')
  if (!UUID_RE.test(id)) return json(res, 400, { error: 'id_invalido' })
  if (String(body.origen) === 'web') return json(res, 400, { error: 'baja_web_no' })

  // El `.select().maybeSingle()` no es decoración: sin él, un id que no existe
  // —o el de una entrada web mandado con `origen: 'luma'`, que el chequeo de
  // arriba no atrapa porque confía en lo que dice el cliente— actualizaba cero
  // filas y contestaba `200 {ok:true}` igual. Del otro lado alguien creía haber
  // dado de baja a una persona que sigue entrando. `editarTier` ya lo hace así.
  const { data, error } = await db()
    .from('asistentes_externos')
    .update({ estado_norm: body.deshacer ? 'confirmado' : 'rechazado' })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) return json(res, 404, { error: 'persona_inexistente' })

  json(res, 200, { ok: true })
}

/**
 * Volver a mandar el mail de la entrada. Es el caso #1 de soporte.
 *
 * Acepta el id de la ORDEN o el de una ENTRADA: la pantalla de asistentes
 * trabaja con personas y lo que tiene a mano es la entrada, mientras que la de
 * ventas trabaja con compras. El mail es uno solo por compra, con una tarjeta
 * por asistente, así que los dos caminos terminan en la misma orden.
 */
export async function reenviar(res, body, baseUrl) {
  const ordenId = String(body.orden || '')
  const entradaId = String(body.entrada || '')

  let id = ordenId
  if (!id && UUID_RE.test(entradaId)) {
    const { data, error } = await db()
      .from('entradas')
      .select('order_id')
      .eq('id', entradaId)
      .maybeSingle()
    if (error) throw error
    if (!data) return json(res, 404, { error: 'entrada_inexistente' })
    id = data.order_id
  }

  if (!UUID_RE.test(id)) return json(res, 400, { error: 'id_invalido' })

  const { data: orden, error } = await db().from('orders').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!orden) return json(res, 404, { error: 'orden_inexistente' })
  if (orden.status !== 'paid') return json(res, 409, { error: 'orden_no_paga' })

  const enviado = await reenviarEntrada({ orden, baseUrl })
  if (!enviado) return json(res, 502, { error: 'mail_no_salio' })

  json(res, 200, { ok: true })
}

/* -------------------------------------------------------------------------- */
/* Ventas                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Las compras, con su plata ya resuelta.
 *
 * Vive aparte de `ordenes()` porque `metricas()` necesita exactamente las mismas
 * filas: si cada una las armara por su cuenta, las dos pantallas mostrarían
 * números que se parecen pero no son.
 */
async function traerOrdenes() {
  const { data, error } = await db()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const ahora = Date.now()
  return (data || []).map(o => {
    const d = desglose(o.unit_price_ars, o.quantity)
    return {
      id: o.id,
      tier: o.tier_id,
      cantidad: o.quantity,
      nombre: o.buyer_name,
      email: o.buyer_email,
      telefono: o.buyer_telefono,
      empresa: o.buyer_empresa,
      status: o.status,
      detalle: o.mp_status_detail,
      // El cargo congelado en la orden manda sobre la fórmula de hoy: es lo que
      // la persona efectivamente pagó.
      subtotal: d.subtotal,
      cargo: Number(o.service_fee_ars ?? d.cargo),
      total: Math.round((d.subtotal + Number(o.service_fee_ars ?? d.cargo)) * 100) / 100,
      pagoId: o.mp_payment_id,
      mailEnviado: o.email_sent_at,
      creadaEn: o.created_at,
      venceEn: o.expires_at,
      reservaCupo: o.status === 'pending' && Date.parse(o.expires_at) > ahora,
    }
  })
}

/** Cómo se llama cada canal en pantalla. */
const NOMBRE_CANAL = {
  web: 'Venta propia',
  startupgrind: 'Startup Grind',
  luma: 'Luma',
  puerta: 'Alta en puerta',
}

/**
 * La plata, contada UNA vez.
 *
 * La usan Ventas y Métricas. Antes cada pantalla sumaba lo suyo, y bastaba con
 * que una tratara distinto a una orden reembolsada para que las dos pestañas
 * dieran cifras distintas sin que nadie supiera cuál creer.
 *
 * `recaudado` son los TRES canales, no sólo el nuestro. Con 4 entradas propias
 * y 37 vendidas por Startup Grind, un cartel que dice "Recaudado" y muestra
 * sólo lo que pasó por Mercado Pago contesta otra pregunta que la que promete:
 * el evento movió cinco veces eso. Lo que cobró el sitio sigue estando, en
 * `propia`, que es el número que importa para conciliar la cuenta de Mercado
 * Pago.
 *
 * Un canal sin `precio_ars` NO suma cero: suma nada y se dice en `sinPrecio`.
 * Cero es "esa entrada fue gratis"; ausente es "no sabemos cuánto salió", y
 * mezclarlos convierte un import incompleto en un evento que no recaudó.
 */
export function totalesVentas(filas, externos = []) {
  const pagadas = filas.filter(o => o.status === 'paid')
  const propia = Math.round(pagadas.reduce((a, o) => a + o.total, 0) * 100) / 100
  const entradasPropias = pagadas.reduce((a, o) => a + o.cantidad, 0)

  const confirmados = externos.filter(e => e.estado_norm === 'confirmado')
  const porCanal = new Map()
  for (const e of confirmados) {
    const c = porCanal.get(e.origen) || { monto: 0, entradas: 0, sinPrecio: 0 }
    if (e.precio_ars === null || e.precio_ars === undefined) c.sinPrecio++
    else c.monto += Number(e.precio_ars)
    c.entradas++
    porCanal.set(e.origen, c)
  }

  const canales = [
    { id: 'web', monto: propia, entradas: entradasPropias, sinPrecio: 0 },
    ...[...porCanal].map(([id, c]) => ({ ...c, id, monto: Math.round(c.monto * 100) / 100 })),
  ].map(c => ({
    ...c,
    nombre: NOMBRE_CANAL[c.id] || c.id,
    montoTexto: formatARS(c.monto, { centavos: true }),
  }))

  const recaudado = Math.round(canales.reduce((a, c) => a + c.monto, 0) * 100) / 100

  return {
    // Venta propia: es la que se concilia contra Mercado Pago.
    pagadas: pagadas.length,
    entradas: entradasPropias,
    pendientes: filas.filter(o => o.reservaCupo).length,
    propia,
    propiaTexto: formatARS(propia, { centavos: true }),
    // Los tres canales.
    recaudado,
    // Formateado del lado del server para que la pantalla no tenga que
    // conocer la moneda ni el locale.
    recaudadoTexto: formatARS(recaudado, { centavos: true }),
    entradasTotales: canales.reduce((a, c) => a + c.entradas, 0),
    sinPrecio: canales.reduce((a, c) => a + c.sinPrecio, 0),
    canales,
  }
}

/** Los externos confirmados, con lo que pagaron. Para `totalesVentas`. */
async function traerExternos() {
  const { data, error } = await db()
    .from('asistentes_externos')
    .select('id, origen, nombre, email, ticket, precio_ars, estado_norm, checkin_en')
  if (error) throw error
  return data || []
}

/** El cupo, contado una vez. La usan Stock y Métricas. */
export function totalesCupo(filas) {
  const total = filas.reduce((a, t) => a + t.stockTotal, 0)
  const libre = filas.reduce((a, t) => a + t.disponible, 0)
  return {
    total,
    // Lo que ya no se puede vender: pagadas más pendientes sin vencer.
    tomado: total - libre,
    libre,
    activos: filas.filter(t => t.activo).length,
  }
}

/**
 * Las compras, con su estado y su plata.
 *
 * Las `pending` que todavía no vencieron RESERVAN cupo (ver `stock_disponible`):
 * por eso viaja `expires_at` y por eso se las puede liberar a mano. Hasta ahora
 * una orden abandonada se comía una entrada hasta que vencía sola, y no había
 * dónde verlo.
 */
/**
 * Todas las entradas del evento, vengan de donde vengan: una fila por entrada.
 *
 * Existe porque la lista de Ventas mostraba `orders` —9 filas— debajo de un
 * total que dice 148 entradas, y leído de corrido parecían faltar 139. No
 * faltaban: Startup Grind y Luma no generan una orden nuestra, sólo la persona.
 *
 * La unidad es la ENTRADA y no la compra, que es como cuenta el número de
 * arriba: una compra de dos entradas son dos filas, con su nombre cada una.
 * Las compras que nunca se pagaron no emitieron entrada, así que van igual pero
 * marcadas — son las que cuentan cuánta gente quiso comprar y no pudo.
 */
async function traerVentas(ordenesWeb, externos) {
  const { data: entradas, error } = await db()
    .from('entradas')
    .select('id, order_id, numero, nombre, usada_en')
  if (error) throw error

  const filas = []

  for (const o of ordenesWeb) {
    const suyas = (entradas || []).filter(e => e.order_id === o.id)
    if (o.status === 'paid' && suyas.length) {
      // El total de la compra repartido: dos entradas de una compra de $73.904
      // son $36.952 cada una, y así la columna suma el mismo recaudado.
      const unitario = Math.round((o.total / (o.cantidad || 1)) * 100) / 100
      for (const e of suyas) {
        filas.push({
          id: e.id,
          canal: 'MP',
          nombre: e.nombre || `${o.nombre} (${e.numero})`,
          email: o.email,
          entrada: o.tier === 'vip' ? 'Entrada VIP' : 'Última tanda',
          monto: unitario,
          emitida: true,
          estado: 'pagada',
          usadaEn: e.usada_en,
          ordenId: o.id,
        })
      }
    } else {
      filas.push({
        id: o.id,
        canal: 'MP',
        nombre: o.nombre,
        email: o.email,
        entrada: o.tier === 'vip' ? 'Entrada VIP' : 'Última tanda',
        monto: o.status === 'paid' ? o.total : 0,
        emitida: false,
        estado: o.reservaCupo ? 'reservando' : ESTADO_ORDEN[o.status] || o.status,
        usadaEn: null,
        ordenId: o.id,
      })
    }
  }

  for (const e of externos.filter(x => x.estado_norm === 'confirmado')) {
    filas.push({
      id: e.id,
      canal: e.origen,
      nombre: e.nombre,
      email: e.email,
      entrada: e.ticket || 'Entrada',
      // `null` viaja como null: la pantalla lo muestra como "sin dato" y no
      // como $0, que significaría que esa entrada fue gratis.
      monto: e.precio_ars === null || e.precio_ars === undefined ? null : Number(e.precio_ars),
      emitida: true,
      estado: 'confirmada',
      usadaEn: e.checkin_en,
      ordenId: null,
    })
  }

  return filas.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
}

const ESTADO_ORDEN = {
  pending: 'sin pagar',
  expired: 'sin pagar',
  rejected: 'rechazada',
  refunded: 'reembolsada',
}

export async function ordenes(res) {
  const [filas, externos] = await Promise.all([traerOrdenes(), traerExternos()])
  const ventas = await traerVentas(filas, externos)
  json(res, 200, { ordenes: filas, ventas, totales: totalesVentas(filas, externos) })
}

/**
 * Acciones sobre una orden: reconciliar contra Mercado Pago, liberar el cupo que
 * reserva, o marcarla reembolsada.
 *
 * Reconciliar no es un botón de conveniencia: hoy la única forma de destrabar
 * una orden paga que el webhook no acreditó es que el comprador vuelva al sitio.
 * Si no vuelve, no la destraba nadie.
 */
export async function accionOrden(res, body, baseUrl) {
  const id = String(body.id || '')
  const accion = String(body.accion || '')
  if (!UUID_RE.test(id)) return json(res, 400, { error: 'id_invalido' })

  const { data: orden, error } = await db().from('orders').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!orden) return json(res, 404, { error: 'orden_inexistente' })

  if (accion === 'reconciliar') {
    // Estos dos se importan acá y no arriba sólo por cercanía: son lo único que
    // usa esta rama. NO es un import perezoso —`acreditar.js` ya entra estático
    // en la línea 12 y se trae el SDK de Mercado Pago con él— y decir que lo era
    // hacía creer que las otras acciones no lo pagaban. Lo pagan.
    const { buscarPagoDeOrden, acreditar } = await import('./acreditar.js')
    const { ErrorDeEntorno } = await import('./entorno.js')

    // El chequeo lo hace `credencialesMP()` adentro de `buscarPagoDeOrden`, que
    // sabe qué variable mira cada entorno: en desarrollo es MP_TEST_ACCESS_TOKEN
    // y mirar la de producción a mano daba 503 con todo bien configurado.
    let pago
    try {
      pago = await buscarPagoDeOrden(orden.id)
    } catch (err) {
      if (!(err instanceof ErrorDeEntorno)) throw err
      console.error('[admin:reconciliar]', err.message)
      return json(res, 503, { error: 'mp_no_configurado' })
    }
    if (!pago) return json(res, 404, { error: 'sin_pagos_en_mp' })

    const r = await acreditar({ orden, pago, baseUrl })
    return json(res, 200, { ok: true, status: r.orden.status, cambio: r.cambio })
  }

  if (accion === 'liberar') {
    if (orden.status !== 'pending') return json(res, 409, { error: 'orden_no_pendiente' })
    // Vencerla es lo mismo que liberar el cupo: `stock_disponible` sólo cuenta
    // las pendientes con `expires_at > now()`. No se borra nada.
    const { error: err } = await db()
      .from('orders')
      .update({ status: 'expired', expires_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending')
    if (err) throw err
    return json(res, 200, { ok: true })
  }

  if (accion === 'reembolsar') {
    // El reembolso se hace en Mercado Pago, no acá: esto sólo deja constancia y
    // saca a esas entradas de la lista de la puerta.
    //
    // Sólo sobre una orden PAGA, como `liberar` sólo actúa sobre una pendiente.
    // Marcar reembolsada una `pending` o una `expired` no describe nada que haya
    // pasado, y sobre una ya reembolsada pisaba el detalle de la primera vez.
    const { data, error: err } = await db()
      .from('orders')
      .update({
        status: 'refunded',
        // Queda escrito cuándo, porque la pregunta llega siempre una semana
        // después. El quién necesita una columna propia — está anotado para
        // después del evento.
        mp_status_detail: `reembolsada a mano ${new Date().toISOString()}`,
      })
      .eq('id', id)
      .eq('status', 'paid')
      .select('id')
      .maybeSingle()
    if (err) throw err
    if (!data) return json(res, 409, { error: 'orden_no_paga' })
    return json(res, 200, { ok: true })
  }

  json(res, 400, { error: 'accion_invalida' })
}

/* -------------------------------------------------------------------------- */
/* Stock                                                                       */
/* -------------------------------------------------------------------------- */

/** Los tiers con su cupo libre. Los comparten `tiers()` y `metricas()`. */
async function traerTiers() {
  const { data, error } = await db()
    .from('tiers')
    .select('id, nombre, price_ars, stock_total, activo')
    .order('price_ars')
  if (error) throw error

  return Promise.all((data || []).map(async t => {
    const d = desglose(t.price_ars, 1)
    return {
      id: t.id,
      nombre: t.nombre,
      precio: t.price_ars,
      cargo: d.cargoUnitario,
      total: d.total,
      stockTotal: t.stock_total,
      activo: t.activo,
      disponible: await stockDisponible(t.id),
    }
  }))
}

export async function tiers(res) {
  const filas = await traerTiers()
  json(res, 200, { tiers: filas, totales: totalesCupo(filas) })
}

export async function editarTier(res, body) {
  const id = String(body.id || '')
  if (!id) return json(res, 400, { error: 'id_invalido' })

  const cambios = { updated_at: new Date().toISOString() }

  if (body.stockTotal !== undefined) {
    const n = Number(body.stockTotal)
    if (!Number.isInteger(n) || n < 0) return json(res, 400, { error: 'stock_invalido' })
    cambios.stock_total = n
  }
  if (body.precio !== undefined) {
    const n = Number(body.precio)
    if (!Number.isInteger(n) || n <= 0) return json(res, 400, { error: 'precio_invalido' })
    cambios.price_ars = n
  }
  if (body.activo !== undefined) cambios.activo = Boolean(body.activo)

  const { data, error } = await db()
    .from('tiers')
    .update(cambios)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) return json(res, 404, { error: 'tier_inexistente' })

  json(res, 200, { ok: true })
}

/* -------------------------------------------------------------------------- */
/* Importar                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * El CSV de un canal externo, desde el navegador.
 *
 * Lo mismo que hace `scripts/importar-asistentes.mjs`, que sigue existiendo:
 * comparten `_lib/importar.js`. La versión web está porque el día del evento
 * quien tiene el CSV en el mail no siempre es quien tiene la terminal con las
 * variables de entorno cargadas.
 */
export async function importarCSV(res, body) {
  const csv = String(body.csv || '')
  if (!csv.trim()) return json(res, 400, { error: 'csv_vacio' })

  const r = await importar({
    csv,
    origen: String(body.origen || ''),
    evento: String(body.evento || ''),
    dias: body.dias ? String(body.dias) : undefined,
    seco: Boolean(body.seco),
  })

  json(res, r.error ? 400 : 200, r)
}

/* -------------------------------------------------------------------------- */
/* Métricas                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * El pulso del evento: cuántos entraron, por día, por canal y por puerta.
 *
 * Se agrupa acá y no en el cliente porque son los tres días juntos, y bajar
 * todos los check-ins del evento a un celular para contarlos sería absurdo.
 */
export async function metricas(res) {
  // Las cuatro fuentes de una vez: acreditación, plata y cupo. Es lo que
  // convierte a esta pantalla en "cómo viene el evento" en lugar de obligar a
  // abrir tres pestañas y sumar de cabeza.
  const [
    { data: checkins, error },
    { data: filas, error: errFilas },
    compras,
    cupos,
    externos,
  ] = await Promise.all([
    // `entrada_id` / `externo_id` es a QUIÉN pertenece el ingreso: sin eso se
    // pueden contar ingresos pero no personas, y "cuántos vinieron los tres
    // días" es exactamente una pregunta sobre personas.
    db().from('checkins')
      .select('dia, origen, por, creado_en, entrada_id, externo_id')
      .is('anulado_en', null),
    db().from('acreditacion').select('id, origen, dias, entrada'),
    traerOrdenes(),
    traerTiers(),
    traerExternos(),
  ])
  if (error) throw error
  if (errFilas) throw errFilas

  const porDia = DIAS.map(d => {
    const delDia = (checkins || []).filter(c => c.dia === d.fecha)
    const esperados = (filas || []).filter(f => habilitaDia(f.dias, d.label)).length
    return {
      id: d.id,
      nombre: d.nombre,
      esperados,
      entraron: delDia.length,
      // Ritmo de la fila: cuántos ingresos por hora, en hora de Buenos Aires.
      porHora: agrupar(delDia, c =>
        new Date(c.creado_en).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          hour12: false,
          timeZone: 'America/Argentina/Buenos_Aires',
        }) + ':00',
      ),
      porCanal: agrupar(delDia, c => c.origen),
      porPuerta: agrupar(delDia, c => c.por || 'sin identificar'),
    }
  })

  json(res, 200, {
    porDia,
    porCanal: agrupar(filas || [], f => f.origen),
    total: (filas || []).length,
    // Los que no caen en ningún día: no aparecen en ninguna puerta y hasta ahora
    // no había forma de enterarse.
    sinDia: (filas || []).filter(f => !esDiaConocido(f.dias)).length,
    // Las MISMAS cuentas que sirven Ventas y Stock, no unas parecidas.
    ventas: totalesVentas(compras, externos),
    cupo: totalesCupo(cupos),
    // El cruce entre días, que es lo único que no se puede leer mirando un día
    // a la vez.
    resumen: cruzarDias(checkins || [], filas || []),
  })
}

/**
 * Lo que sólo se ve mirando los tres días juntos.
 *
 * El resto de Métricas cuenta INGRESOS por día. Acá se cuentan PERSONAS a lo
 * largo del evento, que es otra pregunta: quien entró los tres días es un
 * ingreso en cada uno, pero una sola persona.
 */
function cruzarDias(checkins, filas) {
  // Persona → en qué días la vimos. `entrada_id` para la venta propia,
  // `externo_id` para los canales externos; los dos matchean `acreditacion.id`.
  const diasPorPersona = new Map()
  for (const c of checkins) {
    const ref = c.entrada_id || c.externo_id
    if (!ref) continue
    if (!diasPorPersona.has(ref)) diasPorPersona.set(ref, new Set())
    diasPorPersona.get(ref).add(c.dia)
  }

  const vino = ref => diasPorPersona.get(ref)?.size || 0

  // Cuánta gente vino 1, 2 o 3 días. En un evento de varios días es LA métrica
  // de si el contenido retuvo: mucha gente de un solo día es un evento que se
  // vació.
  const recurrencia = DIAS.map((_, i) => ({
    dias: i + 1,
    personas: filas.filter(f => vino(f.id) === i + 1).length,
  }))

  // Tasa de asistencia por canal: de los que cada canal trajo, cuántos
  // aparecieron. Es lo que dice dónde conviene vender el año que viene — un
  // canal que trae 200 inscriptos y 40 presentes vale menos que uno que trae 60
  // y vienen 55.
  const canales = [...new Set(filas.map(f => f.origen))].sort()
  const porCanalAsistencia = canales.map(clave => {
    const delCanal = filas.filter(f => f.origen === clave)
    const entraron = delCanal.filter(f => vino(f.id) > 0).length
    return {
      clave,
      esperados: delCanal.length,
      entraron,
      // Redondeada a entero: con estos volúmenes, un decimal es precisión falsa.
      tasa: delCanal.length ? Math.round((entraron / delCanal.length) * 100) : 0,
    }
  })

  const entraronAlguna = filas.filter(f => vino(f.id) > 0).length

  return {
    personas: filas.length,
    entraron: entraronAlguna,
    // En la lista y nunca aparecieron. Es el número que nadie quiere mirar y el
    // que más dice sobre cuánto se sobrevendió.
    noShow: filas.length - entraronAlguna,
    recurrencia,
    porCanal: porCanalAsistencia,
    // Los altas hechas en el check-in, por su motivo. Sale de `entrada`, que es
    // donde `puerta-agregar` deja el motivo elegido.
    altas: agrupar(filas.filter(f => f.origen === 'puerta'), f => f.entrada),
  }
}

/** `[{a},{a},{b}]` → `[{ clave: 'a', total: 2 }, { clave: 'b', total: 1 }]`. */
function agrupar(filas, clave) {
  const cuenta = new Map()
  for (const f of filas) {
    const k = clave(f)
    cuenta.set(k, (cuenta.get(k) || 0) + 1)
  }
  return [...cuenta.entries()]
    .map(([clave, total]) => ({ clave, total }))
    .sort((a, b) => a.clave.localeCompare(b.clave, 'es'))
}
