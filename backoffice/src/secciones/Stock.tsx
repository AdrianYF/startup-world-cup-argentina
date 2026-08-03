import { useState } from 'react'
import { Boton } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Campo, Campos, Dato, Datos } from '../ui/Campos'
import { Barra, Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import { Recurso } from '../ui/Recurso'
import { mensajeDeError } from '../lib/api'
import { editarTier, pesos, traerTiers, useRecurso, type Tier } from '../lib/admin'

/**
 * El cupo y el precio de lo que se vende por Mercado Pago.
 *
 * Hasta hace poco esto era `update tiers set stock_total = 25` en el SQL Editor
 * de Supabase, que es exactamente lo que nadie quiere hacer un sábado a la
 * mañana con las entradas por agotarse.
 *
 * Es SÓLO el cupo de Mercado Pago. Luma y Startup Grind venden su propio stock
 * y los tres son independientes: agotar acá no cierra los otros dos.
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
    <Operacion
      contexto={
        <>
          <Bloque titulo="Cupo de Mercado Pago">
            <Datos>
              <Dato label="Total">{t?.total ?? 0}</Dato>
              <Dato label="Tomado" tono="warn">{t?.tomado ?? 0}</Dato>
              <Dato label="Libre" tono={t?.libre === 0 ? 'coral' : 'ok'}>{t?.libre ?? 0}</Dato>
              <Dato label="Tiers activos">{t?.activos ?? 0}</Dato>
            </Datos>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              «Tomado» son las compras pagadas más las pendientes que todavía no vencieron:
              esas le están reservando una entrada a alguien que quizá no pague.
            </p>
          </Bloque>

          <Bloque titulo="Qué NO cambia" className="mt-6">
            <Datos>
              <Dato label="Compras hechas">quedan como están</Dato>
              <Dato label="Precio cobrado">congelado en cada orden</Dato>
              <Dato label="Stock de Luma y SG">independiente</Dato>
            </Datos>
          </Bloque>

          <Limite>
            Cortar la venta de un tier lo saca del sitio, pero no toca lo ya vendido ni
            devuelve plata. Los reembolsos se marcan desde «Ventas» y se pagan en Mercado
            Pago.
          </Limite>
        </>
      }
    >
      <Tarjetas>
        <Tarjeta label="Cupo Mercado Pago" valor={t?.total ?? 0} detalle="total" />
        <Tarjeta label="Tomado" valor={t?.tomado ?? 0} detalle="pagadas + pendientes sin vencer" />
        <Tarjeta label="Libre" valor={t?.libre ?? 0} tono={t?.libre === 0 ? 'coral' : 'ok'} />
        <Tarjeta label="Tiers activos" valor={t?.activos ?? 0} />
      </Tarjetas>

      <div className="flex flex-col gap-3">
        {tiers.map(tier => <FilaTier key={tier.id} tier={tier} onCambio={recargar} />)}
      </div>
    </Operacion>
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
      <Recurso
        titulo={tier.nombre}
        subtitulo={`${tier.disponible} libres · ${pesos(tier.precio)} + ${pesos(tier.cargo, true)} de cargo = ${pesos(tier.total, true)}`}
        valor={`${tomadas} / ${tier.stockTotal}`}
        detalle="tomadas"
        tono={tier.activo ? 'accent' : 'neutro'}
        chips={
          <>
            <Chip tono={tier.activo ? 'ok' : 'neutro'}>{tier.activo ? 'a la venta' : 'cortado'}</Chip>
            {tier.activo && tier.disponible === 0 && <Chip tono="coral">agotado</Chip>}
          </>
        }
      />

      <div className="mt-3">
        <Barra valor={tomadas} maximo={tier.stockTotal} tono={tier.disponible === 0 ? 'ok' : 'accent'} />
      </div>

      <div className="mt-4 max-w-md">
        <Campos>
          <Campo
            id={`tier-stock-${tier.id}`}
            label="Cupo total"
            value={stock}
            onChange={e => setStock(e.target.value)}
            inputMode="numeric"
            className="tabular-nums"
          />
          <Campo
            id={`tier-precio-${tier.id}`}
            label="Precio (ARS)"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            inputMode="numeric"
            className="tabular-nums"
          />
        </Campos>
      </div>

      {/* Bajar el cupo por debajo de lo ya tomado no rompe nada —`stock_disponible`
          devuelve negativo y el checkout lo lee como agotado— pero conviene
          decirlo antes de que alguien crea que canceló ventas. */}
      {Number(stock) < tomadas && (
        <Aviso tono="warn" className="mt-3 max-w-md">
          Menor a las {tomadas} ya tomadas: la venta queda cerrada, pero las compras hechas
          siguen valiendo.
        </Aviso>
      )}

      {error && <Aviso tono="error" className="mt-3 max-w-md">{error}</Aviso>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Boton
          tam="sm"
          disabled={!sucio}
          onClick={() => correr('guardar', {
            id: tier.id,
            stockTotal: Number(stock),
            precio: Number(precio),
          })}
          ocupado={ocupado === 'guardar' ? 'Guardando…' : undefined}
        >
          Guardar
        </Boton>
        <Boton
          tono="fantasma"
          tam="sm"
          onClick={() => correr('activo', { id: tier.id, activo: !tier.activo })}
          ocupado={ocupado === 'activo' ? '…' : undefined}
        >
          {tier.activo ? 'Cortar la venta' : 'Volver a vender'}
        </Boton>
      </div>
    </div>
  )
}

export default Stock
