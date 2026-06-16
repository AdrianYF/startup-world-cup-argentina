import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MysteryBoxes3D } from '../components/ui/MysteryBoxes3D'
import { RewardTicket } from '../components/ui/RewardTicket'

type Phase = 'idle' | 'opening' | 'revealed'

const randomWinner = () => Math.floor(Math.random() * 3)

/** Email guardado localmente (gate del juego, sin backend). */
const EMAIL_KEY = 'swc_mb_email'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Sección oculta a la que se llega sellando el golden ticket.
 * Primero pide el email; luego muestra el juego: 3 cajas, una con el perk.
 */
function MysteryBox() {
  const [entered, setEntered] = useState(() => {
    try {
      return !!localStorage.getItem(EMAIL_KEY)
    } catch {
      return false
    }
  })
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const [winnerIndex, setWinnerIndex] = useState(randomWinner)
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealShow, setRevealShow] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setEmailError('Ingresá un email válido.')
      return
    }
    try {
      localStorage.setItem(EMAIL_KEY, value)
    } catch {
      /* localStorage no disponible: igual dejamos entrar */
    }
    setEntered(true)
  }

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
    setWinnerIndex(randomWinner())
  }

  const won = selected !== null && selected === winnerIndex

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
        {entered ? (
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mt-4">
            Sellaste el golden ticket. Una de las tres cajas esconde un Perk secreto.
            <br />
            ¿Te sientes con suerte?
          </p>
        ) : (
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mt-4">
            Sellaste el golden ticket. Dejanos tu email para jugar por un Perk secreto.
          </p>
        )}
      </div>

      {/* Paso 1: email */}
      {!entered && (
        <div className="relative max-w-md mx-auto px-4 pb-20">
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 text-left">
            <label htmlFor="mb-email" className="text-xs uppercase tracking-[0.25em] font-bold text-gray-400">
              Tu email
            </label>
            <input
              id="mb-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                if (emailError) setEmailError('')
              }}
              placeholder="tunombre@email.com"
              aria-invalid={!!emailError}
              className="w-full rounded-xl bg-white/5 border border-white/15 focus:border-[#75AADB] outline-none px-4 py-3 text-white placeholder:text-gray-500 transition-colors"
            />
            {emailError && <p className="text-[#ff7675] text-sm font-bold">{emailError}</p>}
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black px-6 py-3 transition-[transform,background-color] cursor-pointer"
            >
              Jugar
            </button>
            <p className="text-gray-500 text-xs text-center mt-1">
              Lo usamos solo para avisarte si ganás. Sin spam.
            </p>
          </form>
        </div>
      )}

      {/* Paso 2: juego (3D) — se monta recién después del email */}
      {entered && (
      <div className="relative">
        <MysteryBoxes3D
          className="h-[55vh] sm:h-[60vh] w-full"
          selected={selected}
          winnerIndex={winnerIndex}
          onSelect={handleSelect}
          onRevealReady={() => setPhase('revealed')}
        />

        {phase === 'idle' && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs sm:text-sm text-gray-500 uppercase tracking-[0.25em] font-bold animate-pulse">
            Tocá una caja
          </p>
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
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-[#75AADB] hover:bg-[#5a93c5] text-white font-black px-6 py-3 transition-colors"
                  >
                    Reclamar premio
                  </Link>
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
      )}
    </div>
  )
}

export default MysteryBox
