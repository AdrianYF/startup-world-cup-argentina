import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import Blog from '../components/Blog'

function BlogPage() {
  return (
    <PageLayout>
      <FadeInSection>
        <Blog />
      </FadeInSection>
    </PageLayout>
  )
}

export default BlogPage
