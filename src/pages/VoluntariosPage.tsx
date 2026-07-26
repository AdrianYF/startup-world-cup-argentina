import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import Voluntarios from '../components/Voluntarios'

function VoluntariosPage() {
  return (
    <PageLayout>
      <FadeInSection>
        <Voluntarios />
      </FadeInSection>
    </PageLayout>
  )
}

export default VoluntariosPage
