/**
 * `POST /api/checkout` contra Postgres de verdad.
 *
 * Es el handler que más cambió en la tanda de arreglos —~245 líneas— y el único
 * del camino de la plata que no tenía test propio. Lo que se prueba acá no lo
 * puede probar un unitario con un doble: que el CHECK de `quantity` exista, que
 * `stock_disponible()` cuente lo que dice contar, que una orden vencida libere el
 * cupo, y que la compensación deje la fila en el estado correcto.
 *
 * Mercado Pago va mockeado: `Preference.create` no sale a la red. La compra real
 * de punta a punta es una verificación manual (CHECKOUT.md), no un test.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { BASE, db, invocar, mailDePrueba, prepararEntorno, supabaseLocal } from './ayuda.js'

const supa = supabaseLocal()
const solo = supa ? describe : describe.skip
if (!supa) {
  console.warn('\n  ⚠ Supabase local apagado: se saltean los tests de integración.')
  console.warn('    Levantalo con `supabase start` (o `npm run dev:local`).\n')
}

/* Mercado Pago, mockeado. Se declara antes del import del handler. */
const preferenciaCreada = vi.fn(async () => ({ id: 'pref-de-prueba-123' }))
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class { },
  Preference: class { create(...args) { return preferenciaCreada(...args) } },
}))

let checkout
let base

beforeAll(async () => {
  if (!supa) return
  prepararEntorno(supa)
  base = db(supa)
  checkout = (await import('../../api/checkout.js')).default
})

afterAll(async () => { if (supa) await base.preparar() })

const comprar = (cuerpo) => invocar(checkout, { metodo: 'POST', ruta: '/api/checkout', cuerpo })

const compraValida = (extra = {}) => ({
  tier: 'general',
  quantity: 1,
  buyer: { nombre: 'Persona De Prueba', email: mailDePrueba() },
  asistentes: ['Persona De Prueba'],
  ...extra,
})

solo('checkout · el camino feliz', () => {
  beforeEach(async () => {
    preferenciaCreada.mockClear()
    preferenciaCreada.mockResolvedValue({ id: 'pref-de-prueba-123' })
    await base.preparar({ stock: 20 })
  })

  it('crea la orden pendiente, sus entradas y devuelve la preferencia', async () => {
    const r = await comprar(compraValida({
      quantity: 2,
      asistentes: ['Persona De Prueba', 'Su Acompañante'],
    }))

    expect(r.status).toBe(201)
    expect(r.body).toMatchObject({ preferenceId: 'pref-de-prueba-123' })

    const [orden] = await base.leer(`orders?id=eq.${r.body.orderId}&select=*`)
    expect(orden.status).toBe('pending')
    expect(orden.quantity).toBe(2)
    // El precio sale de la base, NUNCA del request: si viniera del body,
    // cualquiera compraría un VIP a $1 editando el fetch.
    expect(orden.unit_price_ars).toBe(35000)
    expect(orden.mp_preference_id).toBe('pref-de-prueba-123')

    // Una fila por asistente, con su nombre y todavía SIN token: la credencial
    // se emite recién cuando el pago se aprueba.
    const entradas = await base.leer(`entradas?order_id=eq.${orden.id}&select=numero,nombre,token&order=numero`)
    expect(entradas.map(e => e.nombre)).toEqual(['Persona De Prueba', 'Su Acompañante'])
    expect(entradas.every(e => e.token === null)).toBe(true)
  })

  it('le manda a Mercado Pago el desglose y la vuelta al sitio', async () => {
    const r = await comprar(compraValida())
    expect(r.status).toBe(201)

    const { body } = preferenciaCreada.mock.calls[0][0]
    // Dos ítems: la entrada y el cargo. Es lo que hace que el comprador vea el
    // desglose también adentro de Mercado Pago.
    expect(body.items).toHaveLength(2)
    expect(body.items[0].unit_price).toBe(35000)
    expect(body.items[1].unit_price).toBe(1952.27)
    expect(body.external_reference).toBe(r.body.orderId)
    // `PUBLIC_SITE_URL` inferida por el harness: con localhost el handler omite
    // `notification_url`, o sea que estaríamos probando otra rama.
    expect(body.back_urls.success).toBe(`${BASE}/?compra=${r.body.orderId}`)
    expect(body.notification_url).toBe(`${BASE}/api/mp-webhook`)
    expect(body.auto_return).toBe('approved')
  })
})

solo('checkout · el stock', () => {
  beforeEach(async () => {
    preferenciaCreada.mockClear()
    preferenciaCreada.mockResolvedValue({ id: 'pref-de-prueba-123' })
  })

  /**
   * El chequeo de CHECKOUT.md:296, y el que encontró el bug de sobreventa.
   *
   * Antes de la migración 0011 esto devolvía **201 los dos**: se vendía una
   * entrada que no existía. `checkout.js` leía el stock y después insertaba, sin
   * nada en el medio, así que dos compras simultáneas de la última entrada leían
   * las dos el mismo cupo libre y seguían las dos de largo.
   *
   * Ahora pasa por `crear_orden()`, que toma un lock por tier antes de contar.
   * Si alguien vuelve a mover esa lógica a JavaScript, este test lo agarra.
   */
  it('con la última entrada, dos compras simultáneas: una entra y la otra rebota', async () => {
    await base.preparar({ stock: 1 })

    const [a, b] = await Promise.all([comprar(compraValida()), comprar(compraValida())])
    const estados = [a.status, b.status].sort()

    expect(estados).toEqual([201, 409])
    const rebotada = a.status === 409 ? a : b
    expect(rebotada.body.error).toBe('sin_stock')
    expect(rebotada.body).toHaveProperty('disponible')
  })

  it('en secuencia sí rebota: la orden pendiente reserva el cupo', async () => {
    // La otra mitad del mismo chequeo, y ésta el código SÍ la cumple. Sirve para
    // que quede claro que lo que falla es la carrera, no la reserva.
    await base.preparar({ stock: 1 })
    expect((await comprar(compraValida())).status).toBe(201)

    const segunda = await comprar(compraValida())
    expect(segunda.status).toBe(409)
    expect(segunda.body.error).toBe('sin_stock')
    expect(segunda.body.disponible).toBe(0)
  })

  it('una orden vencida devuelve su cupo', async () => {
    // `stock_disponible()` sólo cuenta las pendientes con `expires_at > now()`,
    // así que la reserva se cura sola. Es la razón por la que el cupo trabado del
    // defecto 3 duraba 30 minutos y no para siempre.
    await base.preparar({ stock: 1 })

    const primera = await comprar(compraValida())
    expect(primera.status).toBe(201)
    expect((await comprar(compraValida())).status).toBe(409)

    await base.parchar(`orders?id=eq.${primera.body.orderId}`, {
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    })

    expect((await comprar(compraValida())).status).toBe(201)
  })

  it('no vende más de lo que queda aunque la compra sea de varias', async () => {
    await base.preparar({ stock: 2 })
    const r = await comprar(compraValida({
      quantity: 3,
      asistentes: ['Uno Prueba', 'Dos Prueba', 'Tres Prueba'],
    }))
    expect(r.status).toBe(409)
    expect(r.body.disponible).toBe(2)
  })
})

solo('checkout · si algo falla, el cupo se libera', () => {
  beforeEach(async () => {
    preferenciaCreada.mockClear()
    await base.preparar({ stock: 1 })
  })

  it('Mercado Pago se cae y la orden queda vencida, no reservando', async () => {
    // El defecto 3. Sin la compensación, esa orden se quedaba `pending` con
    // media hora de vida y nadie podía comprar la última entrada — por un
    // timeout de un tercero.
    preferenciaCreada.mockRejectedValue(new Error('MP no responde'))

    const r = await comprar(compraValida())
    expect(r.status).toBe(500)

    const ordenes = await base.leer(
      `orders?buyer_email=like.*@integracion.test&select=id,status,expires_at&order=created_at.desc&limit=1`,
    )
    expect(ordenes[0].status).toBe('expired')
    expect(Date.parse(ordenes[0].expires_at)).toBeLessThanOrEqual(Date.now())

    // Y la prueba de que sirvió: el cupo volvió y se puede comprar.
    preferenciaCreada.mockResolvedValue({ id: 'pref-ok' })
    expect((await comprar(compraValida())).status).toBe(201)
  })
})

solo('checkout · la orden previa del mismo comprador', () => {
  beforeEach(async () => {
    preferenciaCreada.mockClear()
    preferenciaCreada.mockResolvedValue({ id: 'pref-de-prueba-123' })
    await base.preparar({ stock: 1 })
  })

  it('volver a «mis datos» y reenviar no se come otro cupo', async () => {
    // El defecto 4: cada edición creaba una orden nueva, cada una reservando lo
    // suyo. Con el tope de 5 por compra, un comprador indeciso agotaba la tanda.
    const email = mailDePrueba()
    const uno = await comprar(compraValida({ buyer: { nombre: 'Indeciso Prueba', email } }))
    expect(uno.status).toBe(201)

    const dos = await comprar(compraValida({
      buyer: { nombre: 'Indeciso Prueba', email },
      ordenPrevia: uno.body.orderId,
    }))
    expect(dos.status).toBe(201)

    const [previa] = await base.leer(`orders?id=eq.${uno.body.orderId}&select=status`)
    expect(previa.status).toBe('expired')
  })

  it('NO se puede liberar la orden de otro: el mail tiene que coincidir', async () => {
    // El id de la orden viaja en la URL de vuelta de Mercado Pago (`?compra=`),
    // y este endpoint es público. Sin el filtro por mail, cualquiera con ese id
    // podía vencerle la reserva a otro.
    const victima = await comprar(compraValida({
      buyer: { nombre: 'Victima Prueba', email: mailDePrueba() },
    }))
    expect(victima.status).toBe(201)

    // Un cupo más para que el atacante pueda comprar lo suyo. Se SUMA en vez de
    // fijar un total: lo que ya está tomado depende de qué haya en esta base.
    const [t] = await base.leer('tiers?id=eq.general&select=stock_total')
    await base.parchar('tiers?id=eq.general', { stock_total: t.stock_total + 1 })

    const atacante = await comprar(compraValida({
      buyer: { nombre: 'Atacante Prueba', email: mailDePrueba() },
      ordenPrevia: victima.body.orderId,
    }))
    expect(atacante.status).toBe(201)

    const [previa] = await base.leer(`orders?id=eq.${victima.body.orderId}&select=status`)
    expect(previa.status).toBe('pending')
  })
})

solo('checkout · lo que rechaza', () => {
  beforeEach(async () => {
    preferenciaCreada.mockClear()
    preferenciaCreada.mockResolvedValue({ id: 'pref-de-prueba-123' })
    await base.preparar({ stock: 20 })
  })

  it.each([
    ['sin tier', { tier: '' }, 400, 'tier_requerido'],
    ['cantidad 0', { quantity: 0 }, 400, 'cantidad_invalida'],
    ['cantidad 6', { quantity: 6 }, 400, 'cantidad_invalida'],
    ['cantidad decimal', { quantity: 1.5 }, 400, 'cantidad_invalida'],
    ['mail inválido', { buyer: { nombre: 'Che Prueba', email: 'no-es-un-mail' } }, 400, 'email_invalido'],
    ['nombre de una letra', { buyer: { nombre: 'X', email: 'x@integracion.test' } }, 400, 'nombre_requerido'],
  ])('%s → %s', async (_, extra, status, error) => {
    const r = await comprar(compraValida(extra))
    expect(r.status).toBe(status)
    expect(r.body.error).toBe(error)
  })

  it('falta el nombre de un acompañante', async () => {
    const r = await comprar(compraValida({ quantity: 2, asistentes: ['Persona De Prueba', ''] }))
    expect(r.status).toBe(400)
    expect(r.body.error).toBe('asistente_requerido')
  })

  it('un tier que no está a la venta', async () => {
    await base.preparar({ stock: 20, activo: false })
    const r = await comprar(compraValida())
    expect(r.status).toBe(404)
    expect(r.body.error).toBe('tier_no_disponible')
  })

  it('con la venta cerrada corta antes de tocar la base', async () => {
    process.env.VENTA_PROPIA = 'off'
    try {
      const r = await comprar(compraValida())
      expect(r.status).toBe(403)
      expect(r.body.error).toBe('venta_cerrada')
      expect(preferenciaCreada).not.toHaveBeenCalled()
    } finally {
      process.env.VENTA_PROPIA = 'on'
    }
  })

  it('un GET no crea nada', async () => {
    const r = await invocar(checkout, { ruta: '/api/checkout' })
    expect(r.status).toBe(405)
    expect(r.headers.get('allow')).toBe('POST')
  })

  it('ninguna de las rechazadas dejó una orden colgada', async () => {
    const ordenes = await base.leer('orders?buyer_email=like.*@integracion.test&select=id')
    expect(ordenes).toHaveLength(0)
  })
})
