/**
 * La acreditación, contra Postgres de verdad.
 *
 * Es donde la plata se convierte en entrada: pasar la orden a `paid`, emitir un
 * token por asistente y mandar el mail. Tenía tests unitarios con un doble que
 * registra la cadena de llamadas — o sea que probaban que el código PIDIERA
 * `.neq('status','paid')`, no que Postgres lo respetara.
 *
 * Acá se prueba lo que sólo la base puede contestar: que el cerrojo del UPDATE
 * condicional realmente impida la doble acreditación, que el UNIQUE de
 * `mp_payment_id` haga lo suyo, y que dos ejecuciones simultáneas emitan UN
 * token y no dos.
 *
 * Mercado Pago va mockeado: `acreditar()` recibe el pago ya resuelto, que es
 * justamente su contrato — el estado se lo pregunta el caller a MP.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, mailDePrueba, prepararEntorno, supabaseLocal } from './ayuda.js'

const supa = supabaseLocal()
const solo = supa ? describe : describe.skip

/* El mail no sale: sin RESEND key `enviarEntrada` avisa y devuelve false. Se
   mockea igual para poder contar cuántas veces se intentó mandar. */
const mailEnviado = vi.fn(async () => true)
vi.mock('../../api/_lib/email.js', () => ({ enviarEntrada: (...a) => mailEnviado(...a) }))
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class { },
  Payment: class { get() { throw new Error('no se usa') } search() { throw new Error('no se usa') } },
}))

let acreditar
let base

beforeAll(async () => {
  if (!supa) return
  prepararEntorno(supa)
  base = db(supa)
  acreditar = (await import('../../api/_lib/acreditar.js')).acreditar
})

afterAll(async () => { if (supa) await base.preparar() })

/** Crea una orden pendiente con sus entradas, como la dejaría el checkout. */
async function ordenPendiente({ cantidad = 1 } = {}) {
  const [orden] = await base.escribir('orders', {
    tier_id: 'general',
    quantity: cantidad,
    unit_price_ars: 35000,
    service_fee_ars: 1952.27,
    buyer_name: 'Persona De Prueba',
    buyer_email: mailDePrueba(),
    status: 'pending',
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  })
  await base.escribir('entradas', Array.from({ length: cantidad }, (_, i) => ({
    order_id: orden.id, numero: i + 1, nombre: `Asistente ${i + 1}`,
  })))
  return orden
}

const pagoAprobado = (id = String(Date.now())) => ({
  id, status: 'approved', status_detail: 'accredited', transaction_amount: 36952.27,
})

solo('acreditar · el camino normal', () => {
  beforeEach(async () => {
    mailEnviado.mockClear()
    await base.preparar({ stock: 50 })
  })

  it('pasa la orden a paid y emite un token por asistente', async () => {
    const orden = await ordenPendiente({ cantidad: 3 })
    const r = await acreditar({ orden, pago: pagoAprobado(), baseUrl: 'https://x.test' })

    expect(r.cambio).toBe(true)
    expect(r.orden.status).toBe('paid')

    const entradas = await base.leer(`entradas?order_id=eq.${orden.id}&select=numero,token&order=numero`)
    expect(entradas).toHaveLength(3)
    expect(entradas.every(e => e.token && e.token.length >= 20)).toBe(true)
    // Tres tokens DISTINTOS: cada asistente tiene el suyo, y quien tiene el
    // token tiene la entrada.
    expect(new Set(entradas.map(e => e.token)).size).toBe(3)
  })

  it('recién acreditada aparece en la lista de la puerta, y antes no', async () => {
    // La vista `acreditacion` filtra por `status = 'paid'`, así que es lo que
    // separa «compró» de «puede entrar». Se consulta por el id de la ENTRADA,
    // que es lo que `checkins` referencia.
    const orden = await ordenPendiente()
    const [entrada] = await base.leer(`entradas?order_id=eq.${orden.id}&select=id`)

    const antes = await base.leer(`acreditacion?id=eq.${entrada.id}&select=origen`)
    expect(antes).toHaveLength(0)

    await acreditar({ orden, pago: pagoAprobado(), baseUrl: 'https://x.test' })

    const despues = await base.leer(`acreditacion?id=eq.${entrada.id}&select=origen,nombre,dias,token`)
    expect(despues).toHaveLength(1)
    expect(despues[0].origen).toBe('web')
    expect(despues[0].nombre).toBe('Asistente 1')
    // Los dos días del evento: es lo que la puerta busca con un `includes`.
    expect(despues[0].dias).toBe('Jue 6 + Vie 7')
    expect(despues[0].token).toBeTruthy()
  })
})

solo('acreditar · no se acredita dos veces', () => {
  beforeEach(async () => {
    mailEnviado.mockClear()
    await base.preparar({ stock: 50 })
  })

  it('el reintento del MISMO pago no reemite tokens ni remanda el mail', async () => {
    // Mercado Pago reintenta las notificaciones. Acreditar dos veces
    // descontaría el cupo dos veces y mandaría el mail repetido.
    const orden = await ordenPendiente()
    const pago = pagoAprobado()

    const primera = await acreditar({ orden, pago, baseUrl: 'https://x.test' })
    const [antes] = await base.leer(`entradas?order_id=eq.${orden.id}&select=token`)

    const segunda = await acreditar({ orden: primera.orden, pago, baseUrl: 'https://x.test' })
    const [despues] = await base.leer(`entradas?order_id=eq.${orden.id}&select=token`)

    expect(segunda.cambio).toBe(false)
    // El token NO cambia: si cambiara, el QR ya mandado por mail dejaría de abrir.
    expect(despues.token).toBe(antes.token)
    expect(mailEnviado).toHaveBeenCalledTimes(1)
  })

  it('dos ejecuciones simultáneas acreditan UNA sola vez', async () => {
    // Es el caso real: el webhook y la reconciliación de /api/orden llegando
    // juntos. El `.neq('status','paid')` es lo que hace que sólo una gane, y eso
    // sólo lo puede probar Postgres.
    const orden = await ordenPendiente()
    const pago = pagoAprobado()

    const [a, b] = await Promise.all([
      acreditar({ orden, pago, baseUrl: 'https://x.test' }),
      acreditar({ orden, pago, baseUrl: 'https://x.test' }),
    ])

    expect([a.cambio, b.cambio].filter(Boolean)).toHaveLength(1)
    expect(a.orden.status).toBe('paid')
    expect(b.orden.status).toBe('paid')
    expect(mailEnviado).toHaveBeenCalledTimes(1)

    const entradas = await base.leer(`entradas?order_id=eq.${orden.id}&select=token`)
    expect(entradas.filter(e => e.token)).toHaveLength(1)
  })
})

solo('acreditar · una orden paga no vuelve atrás', () => {
  beforeEach(async () => {
    mailEnviado.mockClear()
    await base.preparar({ stock: 50 })
  })

  it('el reintento de un rechazo VIEJO no la despaga', async () => {
    // El bug que se arregló: el early return sólo cubría el mismo payment_id, así
    // que la notificación reintentada de un intento rechazado —con otro id— caía
    // en la rama de abajo y pisaba el `paid`. Esa fila salía de `acreditacion` y
    // la persona desaparecía de la puerta con la entrada pagada en la mano.
    const orden = await ordenPendiente()
    const { orden: paga } = await acreditar({
      orden, pago: pagoAprobado('999000111'), baseUrl: 'https://x.test',
    })
    expect(paga.status).toBe('paid')

    const r = await acreditar({
      orden: paga,
      pago: { id: '111000999', status: 'rejected', status_detail: 'cc_rejected' },
      baseUrl: 'https://x.test',
    })

    expect(r.orden.status).toBe('paid')
    expect(r.cambio).toBe(false)

    const [enBase] = await base.leer(`orders?id=eq.${orden.id}&select=status,mp_payment_id`)
    expect(enBase.status).toBe('paid')
    // Y el pago que la pagó sigue siendo el que la pagó.
    expect(enBase.mp_payment_id).toBe('999000111')

    const [entrada] = await base.leer(`entradas?order_id=eq.${orden.id}&select=token`)
    expect(entrada.token).toBeTruthy()
  })

  it('una reembolsada tampoco vuelve a paid por una notificación tardía', async () => {
    const orden = await ordenPendiente()
    await acreditar({ orden, pago: pagoAprobado('777'), baseUrl: 'https://x.test' })
    await base.parchar(`orders?id=eq.${orden.id}`, { status: 'refunded' })

    const [reembolsada] = await base.leer(`orders?id=eq.${orden.id}&select=*`)
    await acreditar({ orden: reembolsada, pago: pagoAprobado('888'), baseUrl: 'https://x.test' })

    const [final] = await base.leer(`orders?id=eq.${orden.id}&select=status`)
    expect(final.status).toBe('refunded')
  })
})

solo('acreditar · un pago no aprobado', () => {
  beforeEach(async () => {
    mailEnviado.mockClear()
    await base.preparar({ stock: 50 })
  })

  it('marca la orden rechazada, sin emitir tokens ni mandar mail', async () => {
    const orden = await ordenPendiente()
    const r = await acreditar({
      orden,
      pago: { id: '5551', status: 'rejected', status_detail: 'cc_rejected_bad_fill' },
      baseUrl: 'https://x.test',
    })

    expect(r.orden.status).toBe('rejected')
    expect(r.orden.mp_status_detail).toBe('cc_rejected_bad_fill')

    const entradas = await base.leer(`entradas?order_id=eq.${orden.id}&select=token`)
    expect(entradas.every(e => e.token === null)).toBe(true)
    expect(mailEnviado).not.toHaveBeenCalled()
  })

  it('un `in_process` la deja pendiente, no rechazada', async () => {
    const orden = await ordenPendiente()
    const r = await acreditar({
      orden, pago: { id: '5552', status: 'in_process' }, baseUrl: 'https://x.test',
    })
    expect(r.orden.status).toBe('pending')
  })

  it('el UNIQUE de mp_payment_id no revienta la acreditación', async () => {
    // Dos órdenes distintas no pueden compartir un payment_id (migración 0001).
    // Si eso llegara como excepción, el webhook devolvería 500 y Mercado Pago
    // reintentaría para siempre.
    const uno = await ordenPendiente()
    const dos = await ordenPendiente()
    const pago = pagoAprobado('repetido-123')

    await acreditar({ orden: uno, pago, baseUrl: 'https://x.test' })
    await expect(
      acreditar({ orden: dos, pago, baseUrl: 'https://x.test' }),
    ).resolves.toBeTruthy()

    const [segunda] = await base.leer(`orders?id=eq.${dos.id}&select=status`)
    expect(segunda.status).toBe('pending')
  })
})
