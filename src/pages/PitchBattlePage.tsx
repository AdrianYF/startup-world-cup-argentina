import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import PitchBattle from '../components/PitchBattle'

function PitchBattlePage() {
  return (
    <PageLayout>
      <FadeInSection>
        <PitchBattle />
      </FadeInSection>
    </PageLayout>
  )
}

export default PitchBattlePage
