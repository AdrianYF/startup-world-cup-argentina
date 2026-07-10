import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MysteryBoxes3D } from '../components/ui/MysteryBoxes3D'
import { content, type Perk } from '../lib/content'
import { trackEvent } from '../lib/analytics'

type Phase = 'idle' | 'opening' | 'revealed'

/** El juego todavía no está habilitado: poné en true para mostrar "Próximamente". */
const COMING_SOON = false

const perks = content.perks as Perk[]
const rand = (n: number) => Math.floor(Math.random() * n)

/** Logo del partner sobre chip blanco; si falla la carga, cae al nombre. */
function PerkLogo({ perk, className }: { perk: Perk; className?: string }) {
  const [err, setErr] = useState(false)
  if (err || !perk.logo) {
    return <span className="font-black text-[#020618] text-sm text-center leading-tight px-1">{perk.partner}</span>
  }
  return (
    <img
      src={perk.logo}
      alt={perk.partner}
      loading="lazy"
      onError={() => setErr(true)}
      className={className}
    />
  )
}

/** Card de perk en el pool — solo muestra qué está en juego (sin el link de canje). */
function PerkCard({ perk }: { perk: Perk }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-[#75AADB]/40">
      <div className="flex h-14 items-center justify-center rounded-xl bg-white px-3">
        <PerkLogo perk={perk} className="max-h-9 max-w-full object-contain" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-bold text-white">{perk.partner}</span>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
          {perk.category}
        </span>
      </div>
      {perk.value && <div className="text-sm font-black text-[#75AADB]">{perk.value}</div>}
      <p className="line-clamp-2 text-xs leading-snug text-gray-400">{perk.title}</p>
    </div>
  )
}

/**
 * Sección oculta a la que se llega sellando el golden ticket.
 * El player ve el pool de perks de los partners globales de Startup Grind y, con
 * "Voy a tener suerte", abre una mystery box que revela un perk al azar para canjear.
 */
function MysteryBox() {
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [winnerBox, setWinnerBox] = useState(0)
  const [wonPerk, setWonPerk] = useState<Perk | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealShow, setRevealShow] = useState(false)

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

  // Red de seguridad: el reveal normalmente lo dispara la animación 3D
  // (onRevealReady), pero si WebGL está trabado/pausado/no disponible igual
  // revelamos el perk para que el juego nunca quede colgado en "opening".
  useEffect(() => {
    if (phase !== 'opening') return
    const t = setTimeout(() => setPhase('revealed'), 2000)
    return () => clearTimeout(t)
  }, [phase])

  // Juega: elige una caja (o al azar) y un perk al azar; siempre se gana un perk.
  const play = (box?: number) => {
    if (selectedBox !== null) return
    const chosen = box ?? rand(3)
    const perk = perks[rand(perks.length)]
    setWonPerk(perk)
    setWinnerBox(chosen)
    setSelectedBox(chosen)
    setPhase('opening')
    trackEvent('mystery_box_play', { perk: perk.id })
  }

  const reset = () => {
    setPhase('idle')
    setSelectedBox(null)
    setWonPerk(null)
  }

  const redeem = () => {
    if (!wonPerk) return
    trackEvent('mystery_box_redeem', { perk: wonPerk.id, gated: wonPerk.gated })
    window.open(wonPerk.redeemUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020618] text-white">
      {/* halos de fondo */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[40rem] w-[40rem] rounded-full bg-[#75AADB]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#75AADB]/10 blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-20 sm:pt-16">
        <div className="text-center">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-[#75AADB]"
          >
            ← Volver al sitio
          </Link>

          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">
            <span className="text-white">MYSTERY </span>
            <span className="text-[#75AADB]">BOX</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-400 sm:text-lg">
            {COMING_SOON ? (
              <>Sellaste el golden ticket. El juego por un perk secreto abre muy pronto.</>
            ) : (
              <>
                Estos son los perks de los partners globales de Startup Grind.
                Mirá lo que hay en juego y probá tu suerte: una caja esconde uno para vos.
              </>
            )}
          </p>
        </div>

        {/* Juego (3D) + botón "Voy a tener suerte" + reveal */}
        <div className="relative mt-6">
          <MysteryBoxes3D
            className="h-[46vh] w-full sm:h-[52vh]"
            selected={selectedBox}
            winnerIndex={winnerBox}
            onSelect={COMING_SOON ? () => {} : (i) => play(i)}
            onRevealReady={() => setPhase('revealed')}
          />

          {/* CTA principal */}
          {!COMING_SOON && phase === 'idle' && (
            <div className="mt-2 flex flex-col items-center gap-3">
              <button
                onClick={() => play()}
                style={{ backgroundImage: 'var(--gradient-cta)' }}
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-[#6c5ce7]/30 transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 sm:text-lg"
              >
                🍀 Voy a tener suerte
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                o tocá una caja
              </p>
            </div>
          )}

          {/* Overlay "Próximamente" */}
          {COMING_SOON && (
            <div aria-hidden className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[#020618]/35 backdrop-blur-md" />
              <div className="relative z-10 px-6 py-8 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#75AADB]/60">
                  Mystery Box
                </span>
                <p className="mt-3 text-3xl font-black uppercase tracking-[0.06em] text-white sm:text-5xl">
                  Próximamente
                </p>
              </div>
            </div>
          )}

          {/* Reveal */}
          {phase === 'revealed' && wonPerk && (
            <div
              className={`absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ${
                revealShow ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
            >
              <div className="absolute inset-0 bg-[#020618]/80 backdrop-blur-sm" />
              <div className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-[#75AADB]/40 bg-white/5 p-6 sm:p-8">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#75AADB]">
                  ¡Ganaste un perk! 🎉
                </span>

                {/* Logo del perk ganado */}
                <div className="flex h-20 w-full items-center justify-center rounded-2xl bg-white px-6">
                  <PerkLogo perk={wonPerk} className="max-h-12 max-w-[70%] object-contain" />
                </div>

                <div className="text-center">
                  {wonPerk.value && (
                    <div className="text-2xl font-black text-[#75AADB] sm:text-3xl">{wonPerk.value}</div>
                  )}
                  <h2 className="mt-1 text-lg font-black leading-tight text-white">{wonPerk.title}</h2>
                  <p className="mt-2 text-sm text-gray-400">{wonPerk.offer}</p>
                </div>

                <button
                  onClick={redeem}
                  style={{ backgroundImage: 'var(--gradient-cta)' }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-[#6c5ce7]/30 transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] hover:scale-[1.03] active:scale-95"
                >
                  Redimir mi perk →
                </button>
                {wonPerk.gated && (
                  <p className="-mt-1 text-center text-[11px] text-gray-500">
                    Completás un formulario rápido en Startup Grind para recibirlo.
                  </p>
                )}

                <button
                  onClick={reset}
                  className="text-sm font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-[#75AADB]"
                >
                  Voy a tener suerte de nuevo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pool de perks — lo que el player puede ganar */}
        {!COMING_SOON && (
          <div className="mt-10">
            <div className="mb-5 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-black uppercase tracking-wide text-white sm:text-xl">
                {perks.length} perks en juego
              </h2>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Partners de Startup Grind
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {perks.map((perk) => (
                <PerkCard key={perk.id} perk={perk} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MysteryBox
