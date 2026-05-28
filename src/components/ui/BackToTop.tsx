import { useEffect, useState } from 'react'

/**
 * Botón flotante "subir al top" — aparece tras scrollear > 400px, posición fixed
 * bottom-right, animación de fade-in y scroll smooth al top al click.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Volver al inicio"
      style={{ backgroundImage: 'var(--gradient-cta)' }}
      className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#6c5ce7]/40 cursor-pointer transition-all duration-300 ease-out hover:scale-110 active:scale-95 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {/* Lucide chevron-up */}
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  )
}

export default BackToTop
