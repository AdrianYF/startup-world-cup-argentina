import { useState } from 'react'
import { Boton, Pildoras, type Opcion } from '../ui/Acciones'
import { Dato, Datos, Rotulo } from '../ui/Campos'
import { Barra, Cargando, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import { traerMetricas, useRecurso, type Cuenta } from '../lib/admin'

/**
 * El pulso del evento: cuántos entraron, cuándo y por qué puerta.
 *
 * Sin librería de gráficos: son barras proporcionales sobre el máximo de cada
 * serie. Traer una dependencia de charts a un bundle que se abre en la fila de
 * entrada, para mostrar seis barras, no se paga.
 */
function Metricas({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerMetricas, onSinSesion)
  const [dia, setDia] = useState(0)

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />
  if (!datos) return null

  const activo = datos.porDia[dia]
  const entradosTotal = datos.porDia.reduce((a, d) => a + d.entraron, 0)

  const opcionesDia: Opcion<string>[] = datos.porDia.map((d, i) => ({
    id: String(i),
    label: d.nombre,
    cuenta: d.entraron,
  }))

  return (
    <Operacion
      contexto={
        <>
          <Bloque titulo="El evento entero">
            <Datos>
              <Dato label="Personas">{datos.resumen.personas}</Dato>
              <Dato label="Entraron" tono="ok">{datos.resumen.entraron}</Dato>
              <Dato label="No show" tono={datos.resumen.noShow ? 'warn' : undefined}>
                {datos.resumen.noShow}
              </Dato>
              <Dato label="Ingresos registrados">{entradosTotal}</Dato>
            </Datos>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Acá se cuentan personas. El número de ingresos es mayor: quien salió y volvió
              aparece dos veces.
            </p>
          </Bloque>

          {datos.resumen.recurrencia.length > 0 && (
            <Bloque titulo="Cuántos días vino cada uno" className="mt-6">
              <Datos>
                {datos.resumen.recurrencia.map(r => (
                  <Dato key={r.dias} label={r.dias === 1 ? '1 día' : `${r.dias} días`}>
                    {r.personas}
                  </Dato>
                ))}
              </Datos>
            </Bloque>
          )}

          <Bloque titulo="Plata y cupo" className="mt-6">
            <Datos>
              <Dato label="Recaudado" tono="ok">{datos.ventas.recaudadoTexto}</Dato>
              <Dato label="Cupo web libre" tono={datos.cupo.libre === 0 ? 'coral' : undefined}>
                {datos.cupo.libre} de {datos.cupo.total}
              </Dato>
            </Datos>
          </Bloque>

          <Limite>
            Todo sale de las mismas cuentas que sirven «Ventas» y «Stock», calculadas una
            sola vez en el servidor. Si un número no cierra, el problema está en el dato,
            no en esta pantalla.
          </Limite>
        </>
      }
    >
      <Tarjetas>
        <Tarjeta
          label="Recaudado"
          valor={datos.ventas.recaudadoTexto}
          tono="ok"
          detalle={`${datos.ventas.entradas} entradas por la web`}
        />
        <Tarjeta
          label="Cupo web libre"
          valor={datos.cupo.libre}
          tono={datos.cupo.libre === 0 ? 'coral' : datos.cupo.libre <= 5 ? 'warn' : undefined}
          detalle={`de ${datos.cupo.total} · ${datos.cupo.tomado} tomado`}
        />
        <Tarjeta label="En la lista" valor={datos.total} detalle="los tres canales" />
        <Tarjeta
          label="Sin día reconocido"
          valor={datos.sinDia}
          tono={datos.sinDia ? 'coral' : undefined}
          detalle="no aparecen en ninguna puerta"
        />
      </Tarjetas>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Pildoras
          opciones={opcionesDia}
          valor={String(dia)}
          onCambio={id => setDia(Number(id))}
          etiqueta="Día del evento"
        />
        <Boton tono="fantasma" tam="sm" onClick={recargar}>Actualizar</Boton>
      </div>

      {activo && (
        <>
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-black text-swc-light">{activo.nombre}</h2>
              <p className="text-sm font-bold tabular-nums text-swc-muted">
                <span className="text-swc-ok">{activo.entraron}</span> de {activo.esperados}
              </p>
            </div>
            <Barra valor={activo.entraron} maximo={activo.esperados} tono="ok" />
            <p className="mt-2 text-xs text-gray-500">
              Faltan {Math.max(0, activo.esperados - activo.entraron)}. El total cuenta
              ingresos, no personas: quien salió y volvió aparece dos veces.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Serie titulo="Por hora" datos={activo.porHora} vacio="Todavía no entró nadie." />
            <Serie titulo="Por canal" datos={activo.porCanal} vacio="Sin ingresos." />
            <Serie
              titulo="Por quién acreditó"
              datos={activo.porPuerta}
              vacio="Sin ingresos."
              nota="Sale de quién cargó su nombre al entrar al backoffice."
            />
          </div>
        </>
      )}
    </Operacion>
  )
}

function Serie({ titulo, datos, vacio, nota }: {
  titulo: string
  datos: Cuenta[]
  vacio: string
  nota?: string
}) {
  const maximo = Math.max(1, ...datos.map(d => d.total))

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <Rotulo className="mb-3">{titulo}</Rotulo>

      {datos.length === 0 ? (
        <p className="text-sm text-gray-600">{vacio}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {datos.map(d => (
            <li key={d.clave}>
              <div className="mb-1 flex justify-between gap-3 text-xs">
                <span className="truncate text-gray-300">{d.clave}</span>
                <span className="shrink-0 font-bold tabular-nums text-swc-light">{d.total}</span>
              </div>
              <Barra valor={d.total} maximo={maximo} />
            </li>
          ))}
        </ul>
      )}

      {nota && <p className="mt-3 text-xs text-gray-600">{nota}</p>}
    </section>
  )
}

export default Metricas
