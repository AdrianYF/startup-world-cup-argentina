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
  accionOrden, fechaCorta, pesos, reenviarMail, traerOrdenes, useRecurso, type Orden, type Venta,
} from '../lib/admin'
import { esVip } from '../lib/tipos'

/**
 * Todas las entradas del evento, con su plata y su canal.
 *
 * La unidad es la ENTRADA y no la compra. Antes era la compra, y la lista
 * mostraba 9 filas —las órdenes de Mercado Pago— debajo de un total que decía
 * 148 entradas: parecían faltar 139. No faltaban, pero tampoco estaban: Startup
 * Grind y Luma cobran por su cuenta y no generan una orden nuestra, sólo la
 * persona.
 *
 * Mercado Pago sigue siendo el único canal con plata que se puede destrabar,
 * liberar o marcar reembolsada, así que sólo sus filas abren la ficha con
 * acciones. Las otras son de lectura: lo que pasó con ellas pasó en la
 * plataforma del canal, no acá.
 */
const TONO_ESTADO: Record<string, 'ok' | 'warn' | 'coral' | 'neutro'> = {
  pagada: 'ok',
  confirmada: 'ok',
  reservando: 'warn',
  'sin pagar': 'neutro',
  rechazada: 'coral',
  reembolsada: 'neutro',
}

/** El estado de una orden de Mercado Pago, para la ficha. */
const ESTADOS: Record<Orden['status'], { label: string; tono: 'ok' | 'warn' | 'coral' | 'neutro' }> = {
  paid: { label: 'pagada', tono: 'ok' },
  pending: { label: 'pendiente', tono: 'warn' },
  rejected: { label: 'rechazada', tono: 'coral' },
  expired: { label: 'vencida', tono: 'neutro' },
  refunded: { label: 'reembolsada', tono: 'neutro' },
}

const NOMBRE_CANAL: Record<string, string> = {
  MP: 'Mercado Pago',
  startupgrind: 'Startup Grind',
  luma: 'Luma',
  puerta: 'Puerta',
}

type Filtro = 'todas' | 'vip' | 'MP' | 'startupgrind' | 'luma' | 'sinPagar' | 'problema'

function Ventas({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerOrdenes, onSinSesion)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [abierta, setAbierta] = useState<Orden | null>(null)

  // En un memo: `|| []` devuelve un array nuevo en cada render y `visibles`
  // se recalcularía siempre.
  const ordenes = useMemo(() => datos?.ordenes || [], [datos])
  const ventas = useMemo(() => datos?.ventas || [], [datos])

  /** La orden detrás de una fila, si es de Mercado Pago. */
  const ordenDe = (v: Venta) => (v.ordenId ? ordenes.find(o => o.id === v.ordenId) || null : null)

  /** Lo que alguien tiene que mirar: pagada sin mail confirmado, o rechazada. */
  const esProblema = (v: Venta) => {
    const o = ordenDe(v)
    return !!o && (o.status === 'rejected' || (o.status === 'paid' && !o.mailEnviado))
  }

  const cuentas = useMemo(() => ({
    todas: ventas.length,
    vip: ventas.filter(v => esVip(v.entrada)).length,
    MP: ventas.filter(v => v.canal === 'MP').length,
    startupgrind: ventas.filter(v => v.canal === 'startupgrind').length,
    luma: ventas.filter(v => v.canal === 'luma').length,
    sinPagar: ventas.filter(v => !v.emitida).length,
    problema: ventas.filter(esProblema).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [ventas, ordenes])

  const visibles = useMemo(() => {
    if (filtro === 'vip') return ventas.filter(v => esVip(v.entrada))
    if (filtro === 'sinPagar') return ventas.filter(v => !v.emitida)
    if (filtro === 'problema') return ventas.filter(esProblema)
    if (filtro !== 'todas') return ventas.filter(v => v.canal === filtro)
    return ventas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventas, ordenes, filtro])

  const columnas: Columna<Venta>[] = useMemo(() => [
    { clave: 'nombre', titulo: 'Persona', orden: v => v.nombre, celda: v => v.nombre },
    { clave: 'email', titulo: 'Email', orden: v => v.email, celda: v => v.email, soloTabla: true },
    {
      clave: 'canal',
      titulo: 'Canal',
      orden: v => v.canal,
      celda: v => NOMBRE_CANAL[v.canal] || v.canal,
    },
    {
      clave: 'entrada',
      titulo: 'Entrada',
      // Los VIP primero al ordenar: son 10 sobre 154 y es lo que se busca.
      orden: v => `${esVip(v.entrada) ? 0 : 1}${v.entrada}`,
      celda: v => (
        <span className="flex items-center gap-1.5">
          {esVip(v.entrada) && (
            <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] bg-[#d4af37]/20 text-[#d4af37] ring-1 ring-[#d4af37]/40">
              VIP
            </span>
          )}
          {v.entrada}
        </span>
      ),
    },
    {
      clave: 'monto',
      titulo: 'Precio',
      orden: v => v.monto ?? -1,
      // `null` no es $0: el canal no informó el precio. Decirlo con un guion
      // evita que una lista sin dato se lea como un evento regalado.
      celda: v => (v.monto === null ? <span className="text-gray-600">sin dato</span> : pesos(v.monto)),
      numerica: true,
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      orden: v => v.estado,
      celda: v => {
        const o = ordenDe(v)
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            <Chip tono={TONO_ESTADO[v.estado] || 'neutro'}>{v.estado}</Chip>
            {o?.reservaCupo && <Chip tono="warn">reserva cupo</Chip>}
            {o?.status === 'paid' && !o.mailEnviado && <Chip tono="coral">sin mail</Chip>}
            {v.usadaEn && <Chip tono="ok">acreditada</Chip>}
          </span>
        )
      },
    },
    {
      clave: 'creadaEn',
      titulo: 'Fecha',
      orden: v => ordenDe(v)?.creadaEn || '',
      celda: v => {
        const o = ordenDe(v)
        return o ? fechaCorta(o.creadaEn) : <span className="text-gray-600">—</span>
      },
      soloTabla: true,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ordenes])

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  const t = datos?.totales

  // Los tres canales parten el total sin superponerse. «Sin pagar» y «Con
  // problema» son miradas transversales: caen dentro de Mercado Pago, que es el
  // único canal donde una compra puede quedar a mitad de camino.
  const filtros: Opcion<Filtro>[] = [
    { id: 'todas', label: 'Todas', cuenta: cuentas.todas },
    { id: 'vip', label: 'VIP', cuenta: cuentas.vip },
    { id: 'MP', label: 'Mercado Pago', cuenta: cuentas.MP },
    { id: 'startupgrind', label: 'Startup Grind', cuenta: cuentas.startupgrind },
    { id: 'luma', label: 'Luma', cuenta: cuentas.luma },
    { id: 'sinPagar', label: 'Sin pagar', cuenta: cuentas.sinPagar },
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
                La lista son <strong>los tres canales</strong>, una fila por entrada: las{' '}
                {t?.entradasTotales ?? 0} emitidas más {cuentas.sinPagar} compras que nunca se
                pagaron. Sólo las de Mercado Pago se pueden abrir — lo que le pase a una de
                Startup Grind o de Luma se arregla en la plataforma del canal.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                «VIP» junta los {cuentas.vip} de los tres canales, que cada uno nombra a su
                manera: «Entrada VIP» en Startup Grind, «Invitado VIP» en Luma. Ordenando la
                columna quedaban separados.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                «Sin pagar» son las que se empezaron y vencieron. No cuestan cupo ni plata,
                pero son gente que quiso comprar y no pudo: vale mirar por qué.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
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

        <Tabs opciones={filtros} valor={filtro} onCambio={setFiltro} etiqueta="Filtrar las entradas" />

        <div className="mt-4">
          <Tabla
            columnas={columnas}
            filas={visibles}
            claveDe={v => v.id}
            // Sólo Mercado Pago abre ficha: es el único canal donde hay algo que
            // hacer. Lo que le pase a una entrada de Startup Grind o de Luma se
            // arregla en la plataforma del canal, no acá.
            onFila={v => setAbierta(ordenDe(v))}
            vacio="No hay entradas con ese filtro."
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
