/**
 * Acreditar un pago, y sobre todo NO desacreditarlo.
 *
 * Mercado Pago reintenta las notificaciones, y una compra puede tener varios
 * intentos: rechazado, rechazado, aprobado. Todo lo de acá abajo es sobre qué
 * pasa cuando esos reintentos llegan desordenados, que es como llegan.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

/* El mail y las credenciales no participan de lo que se prueba acá. */
vi.mock('../api/_lib/email.js', () => ({ enviarEntrada: vi.fn(async () => true) }))
vi.mock('../api/_lib/entorno.js', () => ({
  credencialesMP: vi.fn(async () => ({ accessToken: 'TEST-x' })),
}))

/**
 * Un doble de `supabase-js` que registra la cadena en vez de ejecutarla.
 *
 * Alcanza para lo que importa: qué tabla se tocó, con qué cambios y —lo que este
 * archivo existe para vigilar— con qué cerrojos.
 */
const llamadas = []
let respuesta = { data: null, error: null }

function query(tabla) {
  const registro = { tabla, op: 'select', cambios: null, filtros: [] }
  llamadas.push(registro)
  const q = {
    update(cambios) { registro.op = 'update'; registro.cambios = cambios; return q },
    insert(cambios) { registro.op = 'insert'; registro.cambios = cambios; return q },
    select() { return q },
    eq(col, val) { registro.filtros.push(`eq:${col}=${val}`); return q },
    neq(col, val) { registro.filtros.push(`neq:${col}=${val}`); return q },
    is(col, val) { registro.filtros.push(`is:${col}=${val}`); return q },
    order() { return q },
    maybeSingle: async () => respuesta,
    single: async () => respuesta,
    then: (res) => Promise.resolve(respuesta).then(res),
  }
  return q
}

vi.mock('../api/_lib/db.js', () => ({
  db: () => ({ from: tabla => query(tabla) }),
}))

const { acreditar } = await import('../api/_lib/acreditar.js')

/** Una orden ya acreditada, como la que dejaría el pago aprobado. */
const ordenPaga = {
  id: 'o-1',
  status: 'paid',
  mp_payment_id: '999',
  quantity: 1,
  unit_price_ars: 35000,
  service_fee_ars: 1952.27,
  tier_id: 'general',
  email_sent_at: '2026-08-01T10:00:00Z',
}

const updates = () => llamadas.filter(l => l.op === 'update')

beforeEach(() => {
  llamadas.length = 0
  respuesta = { data: null, error: null }
})

describe('acreditar · una orden paga no vuelve atrás', () => {
  it('el reintento de un rechazo VIEJO no la pasa a rejected', () => {
    // El bug: el early return de arriba sólo cubría el MISMO payment_id, así que
    // la notificación reintentada del primer intento —rechazado, con otro id—
    // caía en la rama de abajo y pisaba el `paid`. Consecuencia concreta: la fila
    // sale de la vista `acreditacion` y esa persona desaparece de la lista de la
    // puerta el día del evento, con la entrada pagada en la mano.
    return acreditar({
      orden: ordenPaga,
      pago: { id: '111', status: 'rejected', status_detail: 'cc_rejected' },
      baseUrl: 'https://x.test',
    }).then(r => {
      expect(r.orden.status).toBe('paid')
      expect(r.cambio).toBe(false)
      expect(updates()).toHaveLength(0)
    })
  })

  it('tampoco la pasa a pending si llega una notificación in_process vieja', async () => {
    const r = await acreditar({
      orden: ordenPaga,
      pago: { id: '222', status: 'in_process' },
      baseUrl: 'https://x.test',
    })
    expect(r.orden.status).toBe('paid')
    expect(updates()).toHaveLength(0)
  })

  it('el reintento del MISMO pago aprobado no remanda el mail', async () => {
    const r = await acreditar({
      orden: ordenPaga,
      pago: { id: '999', status: 'approved' },
      baseUrl: 'https://x.test',
    })
    expect(r.cambio).toBe(false)
    expect(llamadas).toHaveLength(0)
  })
})

describe('acreditar · una orden pendiente sí se actualiza, con cerrojos', () => {
  it('un rechazo sobre una pendiente la marca, sin poder pisar paid ni refunded', async () => {
    respuesta = { data: { ...ordenPaga, status: 'rejected' }, error: null }

    await acreditar({
      orden: { ...ordenPaga, status: 'pending', mp_payment_id: null },
      pago: { id: '111', status: 'rejected', status_detail: 'cc_rejected_bad_fill' },
      baseUrl: 'https://x.test',
    })

    const u = updates()[0]
    expect(u.tabla).toBe('orders')
    expect(u.cambios.status).toBe('rejected')
    // Los dos cerrojos. Sin ellos, esta misma llamada corriendo tarde pisa una
    // orden que mientras tanto se pagó o se reembolsó a mano.
    expect(u.filtros).toContain('neq:status=paid')
    expect(u.filtros).toContain('neq:status=refunded')
  })

  it('`cambio` dice si de verdad cambió algo, y no que sí siempre', async () => {
    // Es lo que el webhook devuelve como `idempotente`. Antes iba `true` fijo,
    // aun cuando el update no tocaba ninguna fila.
    respuesta = { data: null, error: null }
    const r = await acreditar({
      orden: { ...ordenPaga, status: 'pending', mp_payment_id: null },
      pago: { id: '111', status: 'rejected' },
      baseUrl: 'https://x.test',
    })
    expect(r.cambio).toBe(false)
  })

  it('un 23505 del UNIQUE de mp_payment_id no se propaga como fallo', async () => {
    // Significa «esa notificación ya se aplicó», no «se rompió algo». Si tira,
    // el webhook devuelve 500 y Mercado Pago reintenta para siempre.
    respuesta = { data: null, error: { code: '23505', message: 'duplicate key' } }
    await expect(acreditar({
      orden: { ...ordenPaga, status: 'pending', mp_payment_id: null },
      pago: { id: '111', status: 'rejected' },
      baseUrl: 'https://x.test',
    })).resolves.toMatchObject({ cambio: false })
  })

  it('un error de base que NO es 23505 sí se propaga', async () => {
    respuesta = { data: null, error: { code: '08006', message: 'connection failure' } }
    await expect(acreditar({
      orden: { ...ordenPaga, status: 'pending', mp_payment_id: null },
      pago: { id: '111', status: 'rejected' },
      baseUrl: 'https://x.test',
    })).rejects.toMatchObject({ code: '08006' })
  })
})
