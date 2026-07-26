import { useEffect, type PropsWithChildren } from 'react'
import Navbar from '../Navbar'
import Footer from '../Footer'
import { FadeInSection } from './FadeInSection'
import { WhatsAppNews } from './WhatsAppNews'

export function PageLayout({ children }: PropsWithChildren) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // El <html> tiene scroll-snap-type (para el stack del landing). En las páginas de
  // ruta eso "tira" solo el scroll; lo desactivamos mientras la página está montada.
  useEffect(() => {
    const html = document.documentElement
    const previo = html.style.scrollSnapType
    html.style.scrollSnapType = 'none'
    return () => {
      html.style.scrollSnapType = previo
    }
  }, [])

  return (
    <div className="bg-[#020618] text-white min-h-screen">
      <a href="#main" className="skip-link">Saltar al contenido principal</a>
      <Navbar />
      <main id="main" tabIndex={-1} className="pt-16">
        {children}
      </main>
      <FadeInSection>
        <Footer />
      </FadeInSection>
      <WhatsAppNews />
    </div>
  )
}

export default PageLayout
