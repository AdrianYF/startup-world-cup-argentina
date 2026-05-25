/**
 * Toast no bloqueante - reemplaza alert() para feedback de UI (Don Norman §2).
 * Imperative API: `toast('mensaje')` desde cualquier handler.
 * Inserta un container en el DOM la primera vez que se llama y reutiliza.
 */

let container: HTMLDivElement | null = null

function getContainer(): HTMLDivElement {
  if (container && document.body.contains(container)) return container

  container = document.createElement('div')
  container.setAttribute('role', 'status')
  container.setAttribute('aria-live', 'polite')
  container.className =
    'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none'
  document.body.appendChild(container)
  return container
}

export function toast(message: string, opts: { duration?: number; tone?: 'info' | 'success' | 'warn' } = {}) {
  const { duration = 4000, tone = 'info' } = opts
  if (typeof document === 'undefined') return

  const root = getContainer()
  const el = document.createElement('div')
  const toneClass =
    tone === 'success'
      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
      : tone === 'warn'
        ? 'border-amber-400/40 bg-amber-500/15 text-amber-100'
        : 'border-[#6c5ce7]/40 bg-[#6c5ce7]/15 text-white'

  el.className = `pointer-events-auto px-5 py-3 rounded-full border backdrop-blur-md text-sm font-semibold shadow-lg shadow-black/40 transition-all duration-300 opacity-0 translate-y-3 ${toneClass}`
  el.textContent = message
  root.appendChild(el)

  // animar entrada
  requestAnimationFrame(() => {
    el.classList.remove('opacity-0', 'translate-y-3')
    el.classList.add('opacity-100', 'translate-y-0')
  })

  setTimeout(() => {
    el.classList.add('opacity-0', 'translate-y-3')
    setTimeout(() => el.remove(), 320)
  }, duration)
}
