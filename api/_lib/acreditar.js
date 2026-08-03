// Acreditación de un pago: pasar una orden a `paid`, emitir el token de la
// entrada y mandar el mail.
//
// Vive acá y no dentro del webhook porque hay DOS caminos que llegan a esto:
//
//   1. El webhook, cuando Mercado Pago nos avisa. Es el camino normal.
//   2. La reconciliación, cuando el comprador vuelve al sitio y su orden sigue
//      pendiente. Ahí le preguntamos a MP directamente.
//
// El (2) no es un lujo: en local el webhook no llega nunca (MP no alcanza
// localhost), y en producción puede demorar o fallar. Sin esto, alguien que pagó
// se queda mirando una pantalla que dice "confirmando" para siempre.
//
// Los dos caminos son seguros por la misma razón: el estado del pago se lo
// pedimos a Mercado Pago con nuestro access token. El cliente nunca dice si pagó.
import crypto from 'node:crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { db } from './db.js'
import { credencialesMP } from './entorno.js'
// El `.js` lo genera scripts/build-emails.mjs a partir de `email.tsx`. Node no
// puede cargar un `.tsx`, y este import es estático: si falla, se cae todo
// `/api/backoffice` — el check-in incluido.
import { enviarEntrada } from './email.js'

// Async porque en desarrollo `credencialesMP()` le pregunta a Mercado Pago si la
// cuenta del token es de prueba — una vez por proceso, ver `entorno.js`.
async function cliente() {
  return new MercadoPagoConfig({ accessToken: (await credencialesMP()).accessToken })
}

/** Un pago puntual, por id. */
export async function traerPago(paymentId) {
  return new Payment(await cliente()).get({ id: String(paymentId) })
}

/**
 * El pago aprobado de una orden, si existe.
 *
 * Se busca por `external_reference`, que es el id de nuestra orden. Puede haber
 * varios intentos (rechazado, rechazado, aprobado): nos quedamos con el
 * aprobado; si no hay ninguno, con el más reciente, para poder mostrar por qué
 * falló.
 */
export async function buscarPagoDeOrden(ordenId) {
  const r = await new Payment(await cliente()).search({
    options: { external_reference: ordenId, sort: 'date_created', criteria: 'desc' },
  })
  const pagos = r?.results || []
  if (!pagos.length) return null
  return pagos.find(p => p.status === 'approved') || pagos[0]
}

/**
 * Aplica el pago a la orden. Idempotente: si otra ejecución llegó primero,
 * devuelve la orden ya acreditada sin volver a tocarla ni remandar el mail.
 *
 * `baseUrl` se usa para armar los links del mail.
 */
export async function acreditar({ orden, pago, baseUrl }) {
  const paymentId = String(pago.id)

  // Caso normal del reintento de MP: ya está hecha.
  if (orden.status === 'paid' && orden.mp_payment_id === paymentId) {
    return { orden, cambio: false }
  }

  // Una orden paga no vuelve atrás por un pago que NO es el que la pagó.
  //
  // Mercado Pago reintenta las notificaciones de los intentos viejos, y una
  // compra puede tener varios: rechazado, rechazado, aprobado. Si el reintento
  // del primer rechazo llega después de que el tercero acreditó, sin esto pisaba
  // el `paid` y dejaba la orden en `rejected`. Consecuencia concreta: esa fila
  // sale de la vista `acreditacion` y la persona desaparece de la lista de la
  // puerta el día del evento, con la entrada pagada en la mano.
  if (orden.status === 'paid' && pago.status !== 'approved') {
    return { orden, cambio: false }
  }

  if (pago.status !== 'approved') {
    // Los mismos cerrojos que la rama de abajo. `refunded` tampoco se pisa: lo
    // puso una persona a mano desde el backoffice y una notificación vieja no
    // tiene por qué deshacerlo.
    const { data, error } = await db()
      .from('orders')
      .update({
        status: pago.status === 'pending' || pago.status === 'in_process' ? 'pending' : 'rejected',
        mp_payment_id: paymentId,
        mp_status_detail: pago.status_detail || pago.status,
      })
      .eq('id', orden.id)
      .neq('status', 'paid')
      .neq('status', 'refunded')
      .select('*')
      .maybeSingle()

    // 23505 = ese `mp_payment_id` ya está en otra orden (el UNIQUE de la
    // migración 0001). No es un fallo nuestro: significa que esa notificación ya
    // se aplicó. Dejarlo tirar acá devuelve 500 y MP reintenta para siempre.
    if (error && error.code !== '23505') throw error

    // `cambio` dice si esto tocó algo de verdad — es lo que el webhook devuelve
    // como `idempotente`. Antes iba `true` fijo, aun cuando no se actualizó nada.
    return { orden: data || orden, cambio: Boolean(data) }
  }

  // Se compara lo cobrado con lo que la orden dice. Si no coincide se acredita
  // igual —la plata entró y no vamos a dejar sin entrada a quien pagó— pero
  // queda logueado para revisarlo a mano.
  const esperado =
    Math.round((orden.unit_price_ars * orden.quantity + Number(orden.service_fee_ars || 0)) * 100) / 100
  if (Number(pago.transaction_amount) !== esperado) {
    console.error(
      `[acreditar] monto distinto en la orden ${orden.id}:`,
      `cobrado ${pago.transaction_amount} vs esperado ${esperado}`,
    )
  }

  // El `.neq('status','paid')` es lo que hace que dos ejecuciones simultáneas no
  // acrediten las dos: sólo una encuentra la fila todavía sin pagar.
  //
  // `refunded` va por la misma razón que arriba: si alguien ya la reembolsó a
  // mano, una notificación que llega tarde no la vuelve a poner en la lista.
  const { data: acreditada, error } = await db()
    .from('orders')
    .update({
      status: 'paid',
      mp_payment_id: paymentId,
      mp_status_detail: pago.status_detail || 'accredited',
    })
    .eq('id', orden.id)
    .neq('status', 'paid')
    .neq('status', 'refunded')
    .select('*')
    .maybeSingle()

  // Ver la nota del 23505 en la rama de arriba: es «esto ya se aplicó», no un
  // fallo. Cae al re-read de abajo, que devuelve el estado real.
  if (error && error.code !== '23505') throw error

  if (!acreditada) {
    // Otra ejecución ganó la carrera. Se relee para devolver el estado real.
    const { data } = await db().from('orders').select('*').eq('id', orden.id).single()
    return { orden: data, cambio: false }
  }

  const entradas = await emitirTokens(acreditada.id)
  await mandarMail(acreditada, entradas, baseUrl)
  return { orden: acreditada, cambio: true }
}

/**
 * Emite la credencial de cada entrada de la orden y las devuelve todas.
 *
 * Un token por asistente, 32 bytes aleatorios cada uno — el mismo criterio que
 * tenía `orders.ticket_token`: quien lo tiene, tiene la entrada.
 *
 * El `.is('token', null)` cumple el rol que cumplía el `.neq('status','paid')`
 * de arriba: si esto corre dos veces, la segunda no reemplaza los tokens ya
 * emitidos y mandados por mail.
 */
async function emitirTokens(ordenId) {
  const { data: filas, error } = await db()
    .from('entradas')
    .select('id, numero, nombre, token')
    .eq('order_id', ordenId)
    .order('numero')

  if (error) throw error

  for (const entrada of filas || []) {
    if (entrada.token) continue
    const token = crypto.randomBytes(32).toString('base64url')
    const { data } = await db()
      .from('entradas')
      .update({ token })
      .eq('id', entrada.id)
      .is('token', null)
      .select('token')
      .maybeSingle()
    // Si otra ejecución llegó primero, vale el token de ella.
    entrada.token = data?.token || (await tokenDe(entrada.id))
  }

  return filas || []
}

async function tokenDe(entradaId) {
  const { data } = await db().from('entradas').select('token').eq('id', entradaId).single()
  return data?.token || null
}

/**
 * Vuelve a mandar el mail de una orden ya paga, aunque ya se haya mandado.
 *
 * Es el caso #1 de soporte —"no me llegó"— y hasta ahora la única salida era
 * poner `email_sent_at` en null a mano en Supabase y esperar a que algo
 * volviera a pasar por la acreditación. Lo usa el backoffice.
 */
export async function reenviarEntrada({ orden, baseUrl }) {
  const { data: entradas, error } = await db()
    .from('entradas')
    .select('id, numero, nombre, token')
    .eq('order_id', orden.id)
    .order('numero')
  if (error) throw error

  return mandarMail(orden, entradas || [], baseUrl, true)
}

/**
 * Mail de confirmación, una sola vez. Su fallo no invalida la acreditación: el
 * pago ya entró y el comprador siempre puede ver su entrada en el sitio.
 *
 * `forzar` saltea el "una sola vez": es el reenvío manual desde el backoffice,
 * donde justamente lo que se pide es mandarlo de nuevo.
 */
async function mandarMail(orden, entradas, baseUrl, forzar = false) {
  if (orden.email_sent_at && !forzar) return false

  const { data: tier } = await db()
    .from('tiers')
    .select('nombre')
    .eq('id', orden.tier_id)
    .single()

  // Un solo mail al comprador, con una tarjeta por asistente. Mandar N mails
  // separados exigiría un mail por persona, que el checkout no pide.
  const enviado = await enviarEntrada({
    orden,
    tierNombre: tier?.nombre || orden.tier_id,
    entradas: entradas
      .filter(e => e.token)
      .map(e => ({
        nombre: e.nombre,
        ticketUrl: `${baseUrl}/entrada/${e.token}`,
        pdfUrl: `${baseUrl}/api/entrada-pdf?t=${e.token}`,
        qrUrl: `${baseUrl}/api/entrada-qr?t=${e.token}`,
      })),
  })

  if (enviado) {
    await db()
      .from('orders')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', orden.id)
  }

  return enviado
}
