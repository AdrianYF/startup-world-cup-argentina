// Cliente de Supabase para las funciones serverless.
//
// Usa la SERVICE ROLE key, que saltea RLS. Este módulo vive en api/_lib/ (con
// guión bajo) justamente para que Vercel no lo exponga como ruta: nunca tiene
// que ser alcanzable desde afuera.
import { createClient } from '@supabase/supabase-js'
import { desglose } from './precios.js'

let cached = null

/** Cliente singleton. Se crea al primer uso para no romper el build si faltan envs. */
export function db() {
  if (cached) return cached

  const url = process.env.SUPABASE_URL
  // Supabase renombró las keys: la `service_role` (un JWT) pasó a llamarse
  // secret key y ahora empieza con `sb_secret_`. Se aceptan los dos nombres para
  // que sirva tanto lo que copiás del panel nuevo como una config vieja.
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY (ver .env.example)')
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

/**
 * Cupo libre de un tier: total menos las órdenes pagadas y las pendientes que
 * todavía no vencieron. El cálculo vive en la base (`stock_disponible`) para no
 * tener dos versiones de la misma regla.
 *
 * Devuelve 0 si el tier no existe: ante la duda, no hay stock.
 */
export async function stockDisponible(tierId) {
  const { data, error } = await db().rpc('stock_disponible', { p_tier: tierId })
  if (error) throw error
  return typeof data === 'number' ? data : 0
}

/**
 * Los tiers que se pueden comprar hoy, con su cupo libre y el desglose de una
 * entrada. El cargo lo calcula el servidor y viaja al front ya resuelto: si el
 * modal lo recalculara por su cuenta, podría mostrar un número distinto del que
 * se cobra.
 */
export async function tiersActivos() {
  const { data, error } = await db()
    .from('tiers')
    .select('id, nombre, price_ars, stock_total, activo')
    .eq('activo', true)
  if (error) throw error

  return Promise.all(
    (data || []).map(async t => {
      const d = desglose(t.price_ars, 1)
      return {
        id: t.id,
        nombre: t.nombre,
        precio: t.price_ars,
        cargo: d.cargoUnitario,
        total: d.total,
        disponible: await stockDisponible(t.id),
      }
    }),
  )
}
