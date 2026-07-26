import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import Galeria from '../components/Galeria'

function GaleriaPage() {
  return (
    <PageLayout>
      <FadeInSection>
        <Galeria />
      </FadeInSection>
    </PageLayout>
  )
}

export default GaleriaPage
