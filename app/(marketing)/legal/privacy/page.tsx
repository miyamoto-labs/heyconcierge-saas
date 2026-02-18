import { readFileSync } from 'fs'
import { join } from 'path'
import LegalPage from '@/components/ui/LegalPage'

export const metadata = { title: 'Privacy Policy — HeyConcierge' }

export default function PrivacyPolicyPage() {
  const content = readFileSync(join(process.cwd(), 'legal/PRIVACY_POLICY.md'), 'utf-8')
  return <LegalPage content={content} />
}
