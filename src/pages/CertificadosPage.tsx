import { useLocation } from 'react-router-dom'
import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import Certificados from '../components/Certificados'

function CertificadosPage() {
  const { search } = useLocation()
  return (
    <PageLayout>
      <FadeInSection>
        {/* `key` con la query: llegar de nuevo con otro `?cert=` reinicia el
            estado de la sección y el certificado correcto abre desde el primer
            render. Sin esto, el valor inicial era el de la primera visita al chunk. */}
        <Certificados key={search} />
      </FadeInSection>
    </PageLayout>
  )
}

export default CertificadosPage
