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
          <Bloque titulo="Mercado Pago cap">
            <Datos>
              <Dato label="Total">{t?.total ?? 0}</Dato>
              <Dato label="Taken" tono="warn">{t?.tomado ?? 0}</Dato>
              <Dato label="Free" tono={t?.libre === 0 ? 'coral' : 'ok'}>{t?.libre ?? 0}</Dato>
              <Dato label="Active tiers">{t?.activos ?? 0}</Dato>
            </Datos>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              “Taken” is paid purchases plus the pending ones that haven't expired yet: those
              are holding a ticket for someone who may never pay.
            </p>
          </Bloque>

          <Bloque titulo="What does NOT change" className="mt-6">
            <Datos>
              <Dato label="Purchases made">stay as they are</Dato>
              <Dato label="Price charged">frozen on each order</Dato>
              <Dato label="Luma and SG stock">independent</Dato>
            </Datos>
          </Bloque>

          <Limite>
            Cutting off a tier takes it off the site, but it doesn't touch what's already
            sold and it doesn't refund anything. Refunds get marked from “Sales” and are paid
            in Mercado Pago.
          </Limite>
        </>
      }
    >
      <Tarjetas>
        <Tarjeta label="Mercado Pago cap" valor={t?.total ?? 0} detalle="total" />
        <Tarjeta label="Taken" valor={t?.tomado ?? 0} detalle="paid + pending not expired" />
        <Tarjeta label="Free" valor={t?.libre ?? 0} tono={t?.libre === 0 ? 'coral' : 'ok'} />
        <Tarjeta label="Active tiers" valor={t?.activos ?? 0} />
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
        subtitulo={`${tier.disponible} free · ${pesos(tier.precio)} + ${pesos(tier.cargo, true)} fee = ${pesos(tier.total, true)}`}
        valor={`${tomadas} / ${tier.stockTotal}`}
        detalle="taken"
        tono={tier.activo ? 'accent' : 'neutro'}
        chips={
          <>
            <Chip tono={tier.activo ? 'ok' : 'neutro'}>{tier.activo ? 'on sale' : 'cut off'}</Chip>
            {tier.activo && tier.disponible === 0 && <Chip tono="coral">sold out</Chip>}
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
            label="Total cap"
            value={stock}
            onChange={e => setStock(e.target.value)}
            inputMode="numeric"
            className="tabular-nums"
          />
          <Campo
            id={`tier-precio-${tier.id}`}
            label="Price (ARS)"
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
          Lower than the {tomadas} already taken: sales close, but the purchases already made
          still stand.
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
          ocupado={ocupado === 'guardar' ? 'Saving…' : undefined}
        >
          Save
        </Boton>
        <Boton
          tono="fantasma"
          tam="sm"
          onClick={() => correr('activo', { id: tier.id, activo: !tier.activo })}
          ocupado={ocupado === 'activo' ? '…' : undefined}
        >
          {tier.activo ? 'Cut off sales' : 'Sell again'}
        </Boton>
      </div>
    </div>
  )
}

export default Stock
