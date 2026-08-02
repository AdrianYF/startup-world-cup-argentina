import { useMemo, useState } from 'react'
import Tabla, { type Columna } from '../ui/Tabla'
import { Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { mensajeDeError } from '../lib/api'
import {
  accionOrden, fechaCorta, pesos, reenviarMail, traerOrdenes, useRecurso, type Orden,
} from '../lib/admin'

/**
 * Las compras de la venta propia.
 *
 * Hasta ahora esto no existía en ninguna pantalla: ver una orden era una query
 * en el SQL Editor, y destrabar una que Mercado Pago aprobó pero el webhook no
 * acreditó dependía de que el comprador volviera solo al sitio. Si no volvía,
 * no la destrababa nadie.
 */
const ESTADOS: Record<Orden['status'], { label: string; tono: 'ok' | 'warn' | 'coral' | 'neutro' }> = {
  paid: { label: 'pagada', tono: 'ok' },
  pending: { label: 'pendiente', tono: 'warn' },
  rejected: { label: 'rechazada', tono: 'coral' },
  expired: { label: 'vencida', tono: 'neutro' },
  refunded: { label: 'reembolsada', tono: 'neutro' },
}

type Filtro = 'todas' | 'paid' | 'pending' | 'problema'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'paid', label: 'Pagadas' },
  { id: 'pending', label: 'Reservando cupo' },
  { id: 'problema', label: 'Con problema' },
]

function Ventas({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerOrdenes, onSinSesion)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [abierta, setAbierta] = useState<Orden | null>(null)

  // En un memo: `|| []` devuelve un array nuevo en cada render y `visibles`
  // se recalcularía siempre.
  const ordenes = useMemo(() => datos?.ordenes || [], [datos])

  const visibles = useMemo(() => {
    if (filtro === 'paid') return ordenes.filter(o => o.status === 'paid')
    if (filtro === 'pending') return ordenes.filter(o => o.reservaCupo)
    // Lo que alguien tiene que mirar: pagada sin mail confirmado, o rechazada.
    if (filtro === 'problema') {
      return ordenes.filter(o => o.status === 'rejected' || (o.status === 'paid' && !o.mailEnviado))
    }
    return ordenes
  }, [ordenes, filtro])

  const columnas: Columna<Orden>[] = useMemo(() => [
    { clave: 'nombre', titulo: 'Comprador', orden: o => o.nombre, celda: o => o.nombre },
    { clave: 'email', titulo: 'Email', orden: o => o.email, celda: o => o.email, soloTabla: true },
    { clave: 'tier', titulo: 'Tier', orden: o => o.tier, celda: o => o.tier },
    { clave: 'cantidad', titulo: 'Entradas', orden: o => o.cantidad, celda: o => o.cantidad, numerica: true },
    { clave: 'total', titulo: 'Total', orden: o => o.total, celda: o => pesos(o.total), numerica: true },
    {
      clave: 'status',
      titulo: 'Estado',
      orden: o => o.status,
      celda: o => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Chip tono={ESTADOS[o.status].tono}>{ESTADOS[o.status].label}</Chip>
          {o.reservaCupo && <Chip tono="warn">reserva cupo</Chip>}
          {o.status === 'paid' && !o.mailEnviado && <Chip tono="coral">sin mail</Chip>}
        </span>
      ),
    },
    {
      clave: 'creadaEn',
      titulo: 'Fecha',
      orden: o => o.creadaEn,
      celda: o => fechaCorta(o.creadaEn),
      soloTabla: true,
    },
  ], [])

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  const t = datos?.totales

  return (
    <>
      <Tarjetas>
        <Tarjeta label="Recaudado" valor={t?.recaudadoTexto || '—'} detalle="cargo de servicio incluido" tono="ok" />
        <Tarjeta label="Compras pagadas" valor={t?.pagadas ?? 0} />
        <Tarjeta label="Entradas vendidas" valor={t?.entradas ?? 0} detalle="por la web" />
        <Tarjeta
          label="Reservando cupo"
          valor={t?.pendientes ?? 0}
          tono={t?.pendientes ? 'warn' : undefined}
          detalle="pendientes sin vencer"
        />
      </Tarjetas>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTROS.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
              f.id === filtro ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Tabla
        columnas={columnas}
        filas={visibles}
        claveDe={o => o.id}
        onFila={setAbierta}
        vacio="No hay compras con ese filtro."
      />

      {abierta && (
        <FichaOrden
          orden={abierta}
          onCerrar={() => setAbierta(null)}
          onCambio={() => { setAbierta(null); recargar() }}
        />
      )}
    </>
  )
}

function FichaOrden({ orden, onCerrar, onCambio }: {
  orden: Orden
  onCerrar: () => void
  onCambio: () => void
}) {
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState('')

  async function correr(que: string, fn: () => Promise<unknown>, exito?: string) {
    setOcupado(que)
    setError('')
    setAviso('')
    try {
      await fn()
      if (exito) setAviso(exito)
      else onCambio()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setOcupado('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Cerrar" />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-swc-accent/30 bg-swc-surface px-5 pt-6 pb-8 sm:rounded-2xl sm:border">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black text-swc-light">{orden.nombre}</h2>
          <Chip tono={ESTADOS[orden.status].tono}>{ESTADOS[orden.status].label}</Chip>
        </div>
        <p className="mb-5 text-sm text-swc-muted">{orden.email}</p>

        <dl className="mb-5 text-sm">
          <Dato label="Tier" valor={orden.tier} />
          <Dato label="Entradas" valor={String(orden.cantidad)} />
          <Dato label="Subtotal" valor={pesos(orden.subtotal, true)} />
          <Dato label="Cargo de servicio" valor={pesos(orden.cargo, true)} />
          <Dato label="Total" valor={pesos(orden.total, true)} />
          <Dato label="Creada" valor={fechaCorta(orden.creadaEn)} />
          {orden.status === 'pending' && <Dato label="Vence" valor={fechaCorta(orden.venceEn)} />}
          {orden.pagoId && <Dato label="Pago en MP" valor={orden.pagoId} />}
          {orden.detalle && <Dato label="Detalle" valor={orden.detalle} />}
          <Dato label="Mail de la entrada" valor={orden.mailEnviado ? fechaCorta(orden.mailEnviado) : 'no salió'} />
        </dl>

        {error && (
          <p className="mb-4 rounded-xl border border-swc-coral/40 bg-swc-coral/10 px-4 py-3 text-sm font-bold text-swc-coral">{error}</p>
        )}
        {aviso && (
          <p className="mb-4 rounded-xl border border-swc-ok/40 bg-swc-ok/10 px-4 py-3 text-sm font-bold text-swc-ok">{aviso}</p>
        )}

        <div className="flex flex-col gap-2">
          {/* Preguntarle a Mercado Pago por esta orden y acreditarla si el pago
              está aprobado. Es idempotente: si ya estaba, no vuelve a mandar el
              mail ni a emitir tokens. */}
          {orden.status !== 'paid' && (
            <button
              disabled={Boolean(ocupado)}
              onClick={() => correr('rec', () => accionOrden(orden.id, 'reconciliar'))}
              className="w-full rounded-full bg-swc-accent px-6 py-3.5 text-sm font-black text-swc-bg disabled:opacity-40"
            >
              {ocupado === 'rec' ? 'Preguntando a Mercado Pago…' : 'Reconciliar contra Mercado Pago'}
            </button>
          )}

          {orden.status === 'paid' && (
            <button
              disabled={Boolean(ocupado)}
              onClick={() => correr('mail', () => reenviarMail({ orden: orden.id }), 'Mail reenviado.')}
              className="w-full rounded-full border border-swc-accent/40 px-6 py-3 text-sm font-black text-swc-accent disabled:opacity-40"
            >
              {ocupado === 'mail' ? 'Enviando…' : 'Reenviar el mail de la entrada'}
            </button>
          )}

          {/* Liberar = vencerla. `stock_disponible` sólo cuenta las pendientes
              con `expires_at > now()`, así que con esto el cupo vuelve a la
              venta. No se borra nada. */}
          {orden.reservaCupo && (
            <button
              disabled={Boolean(ocupado)}
              onClick={() => correr('lib', () => accionOrden(orden.id, 'liberar'))}
              className="w-full rounded-full border border-white/20 px-6 py-3 text-sm font-black text-gray-300 disabled:opacity-40"
            >
              {ocupado === 'lib' ? 'Liberando…' : 'Liberar el cupo que reserva'}
            </button>
          )}

          {orden.status === 'paid' && (
            <button
              disabled={Boolean(ocupado)}
              onClick={() => correr('ree', () => accionOrden(orden.id, 'reembolsar'))}
              className="w-full rounded-full border border-swc-coral/40 px-6 py-3 text-sm font-black text-swc-coral disabled:opacity-40"
            >
              {ocupado === 'ree' ? 'Marcando…' : 'Marcar como reembolsada'}
            </button>
          )}
        </div>

        {orden.status === 'paid' && (
          <p className="mt-3 text-xs text-gray-500">
            Marcarla reembolsada saca sus {orden.cantidad === 1 ? 'entrada' : `${orden.cantidad} entradas`} de
            la lista de la puerta y devuelve el cupo. La plata se devuelve en Mercado Pago, no acá.
          </p>
        )}

        <button
          onClick={onCerrar}
          className="mt-5 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/5 py-1.5 first:border-t-0">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">{label}</dt>
      <dd className="text-right break-all text-swc-light">{valor}</dd>
    </div>
  )
}

export default Ventas
