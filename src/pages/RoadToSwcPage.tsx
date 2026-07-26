import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import Stats from '../components/Stats'
import RutaEvolucion from '../components/RutaEvolucion'
import CaminoALaCopa from '../components/CaminoALaCopa'

/** Road to SWC: números del evento + el recorrido (Ruta de Evolución + Camino a la Copa). */
function RoadToSwcPage() {
  return (
    <PageLayout>
      <FadeInSection>
        <Stats />
      </FadeInSection>
      <FadeInSection>
        <RutaEvolucion />
      </FadeInSection>
      <FadeInSection>
        <CaminoALaCopa />
      </FadeInSection>
    </PageLayout>
  )
}

export default RoadToSwcPage
