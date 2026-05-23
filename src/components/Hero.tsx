import { useState, useEffect } from 'react'

function Hero() {
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, mins: 0, segs: 0 })

  useEffect(() => {
    const target = new Date('2026-08-05T09:00:00')
    const interval = setInterval(() => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff <= 0) { clearInterval(interval); return }
      setTimeLeft({
        dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        segs: Math.floor((diff / 1000) % 60),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(202,138,4,0.15)_0%,_transparent_70%)]" />
      </div>

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Columna izquierda */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">5 · 6 · 7 DE AGOSTO 2026 · VEDIA, BS AS</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <img 
                src="/Logo-White-246x300.png" 
                alt="Startup World Cup" 
                className="h-28 w-auto"
              />
              <div>
                <h1 className="text-5xl lg:text-6xl font-black leading-none uppercase">
                  <span className="text-white">STARTUP</span><br />
                  <span className="text-white">WORLD CUP</span><br />
                  <span className="text-[#75AADB]">ARGENTINA</span>
                </h1>
              </div>
            </div>

            <p className="text-yellow-400 font-bold text-xl mb-2 tracking-widest uppercase">
              Silicon Valley · $1.000.000 USD
            </p>

            <p className="text-gray-300 text-lg mb-6">
              La competencia de startups más grande del mundo llega a Argentina.
            </p>

            <div className="mb-8">
              <span className="text-yellow-400 font-black text-4xl">+100</span>
              <span className="text-gray-400 text-sm ml-2 uppercase tracking-widest">Ciudades compitiendo</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#tickets" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-8 py-3 rounded-full transition-all text-center uppercase tracking-wide">
                Aplicá como Startup →
              </a>
              <a href="#partners" className="border border-white/30 hover:border-yellow-500 text-white font-bold text-lg px-8 py-3 rounded-full transition-all text-center uppercase tracking-wide">
                Quiero ser Partner
              </a>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-6">

            {/* Card partners */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-5 text-center">En partnership con</p>
              <div className="flex items-center justify-around gap-4">
                <img 
                  src="/sg-stacked-whitepink.png" 
                  alt="Startup Grind" 
                  className="h-16 w-auto"
                />
                <div className="w-px h-12 bg-white/20" />
                <img 
                  src="/pegasus-logo.png" 
                  alt="Pegasus Tech Ventures" 
                  className="h-20 w-auto"
                />
              </div>
            </div>

            {/* Countdown */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { val: timeLeft.dias, label: 'DÍAS' },
                { val: timeLeft.horas, label: 'HORAS' },
                { val: timeLeft.mins, label: 'MINS' },
                { val: timeLeft.segs, label: 'SEGS' },
              ].map(({ val, label }) => (
                <div key={label} className="bg-white/5 border border-yellow-600/30 rounded-xl p-4 text-center backdrop-blur-sm">
                  <div className="text-3xl font-black text-white">{String(val).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-400 mt-1 tracking-widest">{label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero