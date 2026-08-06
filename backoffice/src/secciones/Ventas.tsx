import { useMemo, useState } from 'react'
import { Boton, Tabs, type Opcion } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Dato, Datos } from '../ui/Campos'
import { Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { Hoja } from '../ui/Hoja'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import { Recurso } from '../ui/Recurso'
import Tabla, { type Columna } from '../ui/Tabla'
import { mensajeDeError } from '../lib/api'
import {
  accionOrden, fechaCorta, pesos, reenviarMail, traerOrdenes, useRecurso, type Orden,
} from '../lib/admin'

/**
 * Las compras que entraron por Mercado Pago.
 *
 * Es uno de los tres canales del evento —los otros dos, Luma y Startup Grind,
 * cobran por su cuenta y sólo llegan acá como CSV—, así que esta sección es la
 * única donde hay plata que se puede destrabar, liberar o marcar reembolsada.
 *
 * Hasta hace poco esto no existía en ninguna pantalla: ver una orden era una
 * query en el SQL Editor, y destrabar una que Mercado Pago aprobó pero el
 * webhook no acreditó dependía de que el comprador volviera solo al sitio. Si no
 * volvía, no la destrababa nadie.
 */
const ESTADOS: Record<Orden['status'], { label: string; tono: 'ok' | 'warn' | 'coral' | 'neutro' }> = {
  paid: { label: 'pagada', tono: 'ok' },
  pending: { label: 'pendiente', tono: 'warn' },
  rejected: { label: 'rechazada', tono: 'coral' },
  expired: { label: 'vencida', tono: 'neutro' },
  refunded: { label: 'reembolsada', tono: 'neutro' },
}

type Filtro = 'todas' | 'paid' | 'pending' | 'problema'

function Ventas({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerOrdenes, onSinSesion)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [abierta, setAbierta] = useState<Orden | null>(null)

  // En un memo: `|| []` devuelve un array nuevo en cada render y `visibles`
  // se recalcularía siempre.
  const ordenes = useMemo(() => datos?.ordenes || [], [datos])

  /** Lo que alguien tiene que mirar: pagada sin mail confirmado, o rechazada. */
  const esProblema = (o: Orden) => o.status === 'rejected' || (o.status === 'paid' && !o.mailEnviado)

  const cuentas = useMemo(() => ({
    todas: ordenes.length,
    paid: ordenes.filter(o => o.status === 'paid').length,
    pending: ordenes.filter(o => o.reservaCupo).length,
    problema: ordenes.filter(esProblema).length,
  }), [ordenes])

  const visibles = useMemo(() => {
    if (filtro === 'paid') return ordenes.filter(o => o.status === 'paid')
    if (filtro === 'pending') return ordenes.filter(o => o.reservaCupo)
    if (filtro === 'problema') return ordenes.filter(esProblema)
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

  const filtros: Opcion<Filtro>[] = [
    { id: 'todas', label: 'Todas', cuenta: cuentas.todas },
    { id: 'paid', label: 'Pagadas', cuenta: cuentas.paid },
    { id: 'pending', label: 'Reservando cupo', cuenta: cuentas.pending },
    { id: 'problema', label: 'Con problema', cuenta: cuentas.problema },
  ]

  return (
    <>
      <Operacion
        contexto={
          <>
            <Bloque titulo="La caja">
              <Datos>
                <Dato label="Recaudado · todo el evento" tono="ok">{t?.recaudadoTexto || '—'}</Dato>
                {/* Los canales por separado: sin esto, «recaudado» es un número
                    que no se puede conciliar contra ninguna cuenta, porque
                    ninguna cuenta cobró ese total. */}
                {(t?.canales || []).filter(c => c.entradas > 0).map(c => (
                  <Dato key={c.id} label={`· ${c.nombre}`}>
                    {c.montoTexto} <span className="text-gray-500">· {c.entradas}</span>
                  </Dato>
                ))}
                <Dato label="Compras pagadas">{t?.pagadas ?? 0}</Dato>
                <Dato label="Reservando cupo" tono={t?.pendientes ? 'warn' : undefined}>
                  {t?.pendientes ?? 0}
                </Dato>
              </Datos>
            </Bloque>

            <Bloque titulo="Qué mirar primero" className="mt-6">
              <p className="text-xs leading-relaxed text-gray-500">
                «Con problema» junta las rechazadas y las pagadas cuyo mail nunca salió. Son
                las dos que tienen a alguien esperando del otro lado: una porque no pudo
                pagar y otra porque pagó y no recibió la entrada.
              </p>
              {cuentas.problema > 0 && (
                <Boton tono="secundario" tam="sm" className="mt-3" onClick={() => setFiltro('problema')}>
                  Ver las {cuentas.problema}
                </Boton>
              )}
            </Bloque>

            <Limite>
              Marcar una orden como reembolsada saca sus entradas de la lista y devuelve el
              cupo, pero <strong>no mueve plata</strong>: la devolución se hace en Mercado
              Pago.
            </Limite>
          </>
        }
      >
        <Tarjetas>
          <Tarjeta
            label="Recaudado"
            valor={t?.recaudadoTexto || '—'}
            detalle={`los ${t?.canales?.filter(c => c.entradas > 0).length ?? 0} canales · ${t?.entradasTotales ?? 0} entradas`}
            tono="ok"
          />
          <Tarjeta
            label="Por Mercado Pago"
            valor={t?.propiaTexto || '—'}
            detalle={`${t?.entradas ?? 0} entradas · lo que cobró el sitio`}
          />
          <Tarjeta label="Compras pagadas" valor={t?.pagadas ?? 0} detalle="venta propia" />
          <Tarjeta
            label="Reservando cupo"
            valor={t?.pendientes ?? 0}
            tono={t?.pendientes ? 'warn' : undefined}
            detalle="pendientes sin vencer"
          />
        </Tarjetas>

        <Tabs opciones={filtros} valor={filtro} onCambio={setFiltro} etiqueta="Filtrar las compras" />

        <div className="mt-4">
          <Tabla
            columnas={columnas}
            filas={visibles}
            claveDe={o => o.id}
            onFila={setAbierta}
            vacio="No hay compras con ese filtro."
          />
        </div>
      </Operacion>

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
    <Hoja
      titulo={orden.nombre}
      subtitulo={orden.email}
      onCerrar={onCerrar}
      chips={<Chip tono={ESTADOS[orden.status].tono}>{ESTADOS[orden.status].label}</Chip>}
    >
      <Recurso
        titulo={orden.tier}
        subtitulo={`${orden.cantidad} ${orden.cantidad === 1 ? 'entrada' : 'entradas'} · ${fechaCorta(orden.creadaEn)}`}
        valor={pesos(orden.total, true)}
        detalle="total"
        tono={orden.status === 'paid' ? 'ok' : 'accent'}
      />

      <div className="mt-5">
        <Datos>
          <Dato label="Subtotal">{pesos(orden.subtotal, true)}</Dato>
          <Dato label="Cargo de servicio">{pesos(orden.cargo, true)}</Dato>
          {orden.status === 'pending' && <Dato label="Vence">{fechaCorta(orden.venceEn)}</Dato>}
          {orden.pagoId && <Dato label="Pago en MP">{orden.pagoId}</Dato>}
          {orden.detalle && <Dato label="Detalle">{orden.detalle}</Dato>}
          <Dato label="Mail de la entrada" tono={orden.mailEnviado ? undefined : 'coral'}>
            {orden.mailEnviado ? fechaCorta(orden.mailEnviado) : 'no salió'}
          </Dato>
        </Datos>
      </div>

      {error && <Aviso tono="error" className="mt-4">{error}</Aviso>}
      {aviso && <Aviso tono="ok" className="mt-4">{aviso}</Aviso>}

      <div className="mt-5 flex flex-col gap-2">
        {/* Preguntarle a Mercado Pago por esta orden y acreditarla si el pago
            está aprobado. Es idempotente: si ya estaba, no vuelve a mandar el
            mail ni a emitir tokens. */}
        {orden.status !== 'paid' && (
          <Boton
            tam="lg"
            ancho
            onClick={() => correr('rec', () => accionOrden(orden.id, 'reconciliar'))}
            ocupado={ocupado === 'rec' ? 'Preguntando a Mercado Pago…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Reconciliar contra Mercado Pago
          </Boton>
        )}

        {orden.status === 'paid' && (
          <Boton
            tono="secundario"
            tam="lg"
            ancho
            onClick={() => correr('mail', () => reenviarMail({ orden: orden.id }), 'Mail reenviado.')}
            ocupado={ocupado === 'mail' ? 'Enviando…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Reenviar el mail de la entrada
          </Boton>
        )}

        {/* Liberar = vencerla. `stock_disponible` sólo cuenta las pendientes con
            `expires_at > now()`, así que con esto el cupo vuelve a la venta. No
            se borra nada. */}
        {orden.reservaCupo && (
          <Boton
            tono="fantasma"
            tam="lg"
            ancho
            onClick={() => correr('lib', () => accionOrden(orden.id, 'liberar'))}
            ocupado={ocupado === 'lib' ? 'Liberando…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Liberar el cupo que reserva
          </Boton>
        )}

        {orden.status === 'paid' && (
          <Boton
            tono="peligro"
            tam="lg"
            ancho
            onClick={() => correr('ree', () => accionOrden(orden.id, 'reembolsar'))}
            ocupado={ocupado === 'ree' ? 'Marcando…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Marcar como reembolsada
          </Boton>
        )}
      </div>

      {orden.status === 'paid' && (
        <Aviso tono="info" className="mt-4">
          Marcarla reembolsada saca sus {orden.cantidad === 1 ? 'entrada' : `${orden.cantidad} entradas`} de
          la lista de la puerta y devuelve el cupo. La plata se devuelve en Mercado Pago, no acá.
        </Aviso>
      )}
    </Hoja>
  )
}

export default Ventas
