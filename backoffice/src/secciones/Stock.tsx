import { useState } from 'react'
import { Barra, Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { mensajeDeError } from '../lib/api'
import { editarTier, pesos, traerTiers, useRecurso, type Tier } from '../lib/admin'

/**
 * El cupo y el precio de la venta propia.
 *
 * Hasta ahora esto era `update tiers set stock_total = 25` en el SQL Editor de
 * Supabase, que es exactamente lo que nadie quiere hacer un sábado a la mañana
 * con las entradas por agotarse.
 *
 * Es el cupo de la WEB: Startup Grind vende su propio stock y los dos son
 * independientes.
 */
function Stock({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerTiers, onSinSesion)

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  const tiers = datos?.tiers || []
  // Los totales los cuenta el servidor, no esta pantalla: son los mismos que
  // muestra Métricas, y sumarlos acá otra vez es la forma de que un día digan
  // cosas distintas.
  const t = datos?.totales

  return (
    <>
      <Tarjetas>
        <Tarjeta label="Cupo web total" valor={t?.total ?? 0} />
        <Tarjeta label="Tomado" valor={t?.tomado ?? 0} detalle="pagadas + pendientes sin vencer" />
        <Tarjeta
          label="Libre"
          valor={t?.libre ?? 0}
          tono={t?.libre === 0 ? 'coral' : 'ok'}
        />
        <Tarjeta label="Tiers activos" valor={t?.activos ?? 0} />
      </Tarjetas>

      <div className="flex flex-col gap-3">
        {tiers.map(t => <FilaTier key={t.id} tier={t} onCambio={recargar} />)}
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Es el cupo reservado para la venta por la web. Startup Grind vende su propio stock
        y los dos son independientes. El precio queda congelado en cada compra: cambiarlo
        acá no toca las órdenes ya hechas.
      </p>
    </>
  )
}

function FilaTier({ tier, onCambio }: { tier: Tier; onCambio: () => void }) {
  const [stock, setStock] = useState(String(tier.stockTotal))
  const [precio, setPrecio] = useState(String(tier.precio))
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState('')

  const tomadas = tier.stockTotal - tier.disponible
  const sucio = stock !== String(tier.stockTotal) || precio !== String(tier.precio)

  async function correr(que: string, datos: Parameters<typeof editarTier>[0]) {
    setOcupado(que)
    setError('')
    try {
      await editarTier(datos)
      onCambio()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setOcupado('')
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-swc-light">{tier.nombre}</h2>
          <Chip tono={tier.activo ? 'ok' : 'neutro'}>{tier.activo ? 'a la venta' : 'cortado'}</Chip>
          {tier.activo && tier.disponible === 0 && <Chip tono="coral">agotado</Chip>}
        </div>
        <p className="text-sm font-bold tabular-nums text-swc-muted">
          <span className="text-swc-light">{tomadas}</span> / {tier.stockTotal}
        </p>
      </div>

      <Barra valor={tomadas} maximo={tier.stockTotal} tono={tier.disponible === 0 ? 'ok' : 'accent'} />

      <p className="mt-2 text-xs text-gray-500">
        {tier.disponible} libres · {pesos(tier.precio)} + {pesos(tier.cargo, true)} de cargo
        = <span className="text-gray-300">{pesos(tier.total, true)}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted">
            Cupo total
          </span>
          <input
            value={stock}
            onChange={e => setStock(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-3 py-2 text-base tabular-nums text-swc-light outline-none focus:border-swc-accent"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted">
            Precio (ARS)
          </span>
          <input
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-3 py-2 text-base tabular-nums text-swc-light outline-none focus:border-swc-accent"
          />
        </label>
      </div>

      {/* Bajar el cupo por debajo de lo ya tomado no rompe nada —`stock_disponible`
          devuelve negativo y el checkout lo lee como agotado— pero conviene
          decirlo antes de que alguien crea que canceló ventas. */}
      {Number(stock) < tomadas && (
        <p className="mt-2 text-xs font-bold text-swc-warn">
          Menor a las {tomadas} ya tomadas: la venta queda cerrada, pero las compras hechas siguen valiendo.
        </p>
      )}

      {error && <p className="mt-2 text-xs font-bold text-swc-coral">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={!sucio || Boolean(ocupado)}
          onClick={() => correr('guardar', {
            id: tier.id,
            stockTotal: Number(stock),
            precio: Number(precio),
          })}
          className="rounded-full bg-swc-accent px-5 py-2 text-xs font-black text-swc-bg disabled:opacity-30"
        >
          {ocupado === 'guardar' ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          disabled={Boolean(ocupado)}
          onClick={() => correr('activo', { id: tier.id, activo: !tier.activo })}
          className="rounded-full border border-white/15 px-5 py-2 text-xs font-black text-swc-muted disabled:opacity-40"
        >
          {tier.activo ? 'Cortar la venta' : 'Volver a vender'}
        </button>
      </div>
    </div>
  )
}

export default Stock
