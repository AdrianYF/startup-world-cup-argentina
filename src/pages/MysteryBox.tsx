import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MysteryBoxes3D } from '../components/ui/MysteryBoxes3D'
import { RewardTicket } from '../components/ui/RewardTicket'
import { content } from '../lib/content'
import { trackEvent } from '../lib/analytics'

type Phase = 'idle' | 'opening' | 'revealed'

/** El juego todavía no está habilitado: muestra "Próximamente". Poner en false para abrir. */
const COMING_SOON = true

const randomWinner = () => Math.floor(Math.random() * 3)

/**
 * Sección oculta a la que se llega sellando el golden ticket.
 * 3 cajas: una esconde el perk. Al ganar se muestra un código de canje.
 */
function MysteryBox() {
  const [winnerIndex, setWinnerIndex] = useState(randomWinner)
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealShow, setRevealShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const { perkCode, claimText } = content.config.mysteryBox

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Pequeño delay para animar la entrada del reveal.
  useEffect(() => {
    if (phase !== 'revealed') {
      setRevealShow(false)
      return
    }
    const t = setTimeout(() => setRevealShow(true), 30)
    return () => clearTimeout(t)
  }, [phase])

  const handleSelect = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    setPhase('opening')
  }

  const reset = () => {
    setPhase('idle')
    setSelected(null)
    setCopied(false)
    setWinnerIndex(randomWinner())
  }

  const won = selected !== null && selected === winnerIndex

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(perkCode)
      setCopied(true)
      trackEvent('mystery_box_copy_code', { code: perkCode })
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard no disponible: el código igual está a la vista */
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020618] text-white">
      {/* halos de fondo */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-[#75AADB]/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-[#75AADB]/10 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="relative max-w-5xl mx-auto px-4 pt-12 sm:pt-16 pb-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#75AADB] text-sm font-bold uppercase tracking-widest transition-colors mb-8"
        >
          ← Volver al sitio
        </Link>

        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight">
          <span className="text-white">MYSTERY </span>
          <span className="text-[#75AADB]">BOX</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mt-4">
          {COMING_SOON ? (
            <>Sellaste el golden ticket. El juego por un Perk secreto abre muy pronto.</>
          ) : (
            <>
              Sellaste el golden ticket. Una de las tres cajas esconde un Perk secreto.
              <br />
              ¿Te sientes con suerte?
            </>
          )}
        </p>
      </div>

      {/* Juego (3D) */}
      <div className="relative">
        <MysteryBoxes3D
          className="h-[55vh] sm:h-[60vh] w-full"
          selected={selected}
          winnerIndex={winnerIndex}
          onSelect={COMING_SOON ? () => {} : handleSelect}
          onRevealReady={() => setPhase('revealed')}
        />

        {!COMING_SOON && phase === 'idle' && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs sm:text-sm text-gray-500 uppercase tracking-[0.25em] font-bold animate-pulse">
            Tocá una caja
          </p>
        )}

        {/* Overlay "Próximamente" (mismo efecto que la sección de precios) */}
        {COMING_SOON && (
          <div
            aria-hidden
            className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden"
          >
            {/* Backdrop translúcido — las cajas se intuyen detrás */}
            <div className="absolute inset-0 backdrop-blur-md bg-[#020618]/35" />
            {/* Líneas sutiles arriba/abajo */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

            {/* Mensaje minimal */}
            <div className="relative z-10 text-center px-6 py-8">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <span className="relative flex items-center">
                  <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-[#75AADB] opacity-50 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#75AADB]/65" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#75AADB]/60">
                  Mystery Box
                </span>
              </div>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] [text-shadow:0_2px_6px_rgba(0,0,0,0.25)]">
                Próximamente
              </p>
              <p className="text-[10px] sm:text-xs font-medium tracking-wider text-white/30 mt-3">
                Apertura por anunciar
              </p>
            </div>
          </div>
        )}

        {/* Reveal */}
        {phase === 'revealed' && (
          <div
            className={`absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ${
              revealShow ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="absolute inset-0 bg-[#020618]/70 backdrop-blur-sm" />
            <div className="relative w-full flex flex-col items-center gap-6">
              {won ? (
                <>
                  <RewardTicket />

                  {/* Código de canje del perk */}
                  <div className="w-full max-w-md flex flex-col items-center gap-3">
                    <p className="text-xs uppercase tracking-[0.25em] font-bold text-gray-400">
                      Tu código de canje
                    </p>
                    <div className="flex items-center gap-2 w-full">
                      <code className="flex-1 text-center rounded-xl border border-[#75AADB]/60 bg-white/5 px-4 py-3 font-mono text-xl sm:text-2xl font-black tracking-[0.18em] text-white">
                        {perkCode}
                      </code>
                      <button
                        onClick={copyCode}
                        aria-label="Copiar código"
                        className="shrink-0 rounded-xl bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black px-4 py-3 transition-[transform,background-color] cursor-pointer"
                      >
                        {copied ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm text-center">{claimText}</p>
                    <Link
                      to="/"
                      className="mt-1 text-gray-400 hover:text-[#75AADB] text-sm font-bold uppercase tracking-widest transition-colors"
                    >
                      Volver al sitio
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-6xl sm:text-7xl mb-4">🪹</div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase">
                      Caja vacía
                    </h2>
                    <p className="text-gray-400 mt-2">
                      Esta no tenía nada… pero podés intentarlo de nuevo.
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-full bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black px-6 py-3 transition-[transform,background-color] cursor-pointer"
                  >
                    Probar de nuevo
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MysteryBox
