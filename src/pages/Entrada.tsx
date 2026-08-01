import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { PageLayout } from '../components/ui/PageLayout'
import { SectionGlow } from '../components/ui/SectionGlow'
import { content } from '../lib/content'
import { fetchEntrada, type Entrada as EntradaData } from '../lib/checkout'

/**
 * La entrada, con su QR. Es la página a la que lleva el mail y a la que apunta
 * el propio QR cuando lo escanean en la puerta.
 *
 * El token de la URL ES la credencial: quien lo tiene, tiene la entrada. Por eso
 * la API sólo devuelve lo justo para mostrarla (nombre, tier, si ya se usó) y
 * ningún dato de contacto.
 */

function Entrada() {
  const { token } = useParams<{ token: string }>()
  const [entrada, setEntrada] = useState<EntradaData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    fetchEntrada(token, ac.signal)
      .then(setEntrada)
      .catch(() => {
        if (!ac.signal.aborted) setError(true)
      })
    return () => ac.abort()
  }, [token])

  const url = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <PageLayout>
      <section className="relative min-h-[70vh] py-16 sm:py-24">
        <SectionGlow />
        <div className="relative max-w-md mx-auto px-4">
          {error ? (
            <div className="rounded-2xl border border-[#ff7675]/30 bg-[#ff7675]/5 p-8 text-center">
              <h1 className="text-2xl font-black text-white">Entrada no encontrada</h1>
              <p className="mt-3 text-gray-400 text-sm">
                El link puede estar incompleto. Revisá el mail de confirmación o escribinos a{' '}
                <a href={`mailto:${content.config.links.emailGeneral}`} className="text-[#75AADB] hover:underline">
                  {content.config.links.emailGeneral}
                </a>.
              </p>
            </div>
          ) : !entrada ? (
            <div className="rounded-2xl border border-[#75AADB]/15 bg-white/[0.03] h-96 animate-pulse" />
          ) : (
            <Ticket entrada={entrada} url={url} token={token!} />
          )}

          <div className="mt-8 text-center">
            <Link to="/" className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500 hover:text-gray-300 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

function Ticket({ entrada, url, token }: { entrada: EntradaData; url: string; token: string }) {
  const usada = Boolean(entrada.usadaEn)

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-opacity ${
        usada ? 'border-white/10 opacity-70' : 'border-[#75AADB]/35'
      }`}
      style={{ background: 'linear-gradient(160deg, #0f172b 0%, #020618 100%)' }}
    >
      {/* Cabecera */}
      <div className="px-7 pt-7 pb-6 text-center border-b border-dashed border-[#75AADB]/20">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#75AADB]">
          Startup World Cup Argentina
        </p>
        <h1 className="mt-2 text-2xl font-black text-white leading-tight">{entrada.tierNombre}</h1>
        <p className="mt-1 text-gray-400 text-sm">{content.config.evento.fechas}</p>
      </div>

      {/* Muescas del ticket, sobre la línea punteada */}
      <div aria-hidden className="relative">
        <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#020618]" />
        <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#020618]" />
      </div>

      {/* QR */}
      <div className="px-7 py-8 text-center">
        <div className="inline-block bg-white p-4 rounded-xl">
          <QRCodeSVG value={url} size={192} level="M" bgColor="#ffffff" fgColor="#020618" />
        </div>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
          Mostralo en la puerta
        </p>
      </div>

      {/* Datos */}
      <dl className="px-7 pb-7">
        <Fila label="A nombre de" valor={entrada.nombre} />
        <Fila label="Cantidad" valor={entrada.cantidad === 1 ? '1 entrada' : `${entrada.cantidad} entradas`} />
        <Fila label="Orden" valor={<span className="font-mono text-[11px]">{entrada.orden}</span>} />
      </dl>

      {usada && (
        <div className="px-7 pb-7">
          <p className="rounded-xl border border-[#ff7675]/40 bg-[#ff7675]/10 px-4 py-3 text-center text-sm font-bold text-[#ff7675]">
            Esta entrada ya fue utilizada
          </p>
        </div>
      )}

      {/* Descargar el PDF: en la puerta puede no haber señal para abrir esto. */}
      <div className="px-7 pb-7">
        <a
          href={`/api/entrada-pdf?t=${token}`}
          download
          style={{ backgroundImage: 'var(--gradient-cta)' }}
          className="block w-full text-center font-black py-3 rounded-full uppercase tracking-wide text-white text-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] active:scale-95"
        >
          Descargar entrada
        </a>
      </div>
    </div>
  )
}

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-t border-white/5 first:border-t-0">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">{label}</dt>
      <dd className="text-sm font-bold text-white text-right">{valor}</dd>
    </div>
  )
}

export default Entrada
