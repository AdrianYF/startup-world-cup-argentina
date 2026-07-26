import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import Agenda from '../components/Agenda'

function AgendaPage() {
  return (
    <PageLayout>
      <FadeInSection>
        <Agenda />
      </FadeInSection>
    </PageLayout>
  )
}

export default AgendaPage
