import { readFileSync } from 'fs'
import { join } from 'path'
import LegalPage from '@/components/ui/LegalPage'

export const metadata = { title: 'Guest Privacy Notice — HeyConcierge' }

export default function GuestPrivacyPage() {
  const content = readFileSync(join(process.cwd(), 'legal/GUEST_PRIVACY_NOTICE.md'), 'utf-8')
  return <LegalPage content={content} />
}
