import { readFileSync } from 'fs'
import { join } from 'path'
import LegalPage from '@/components/ui/LegalPage'

export const metadata = { title: 'Cookie Policy — HeyConcierge' }

export default function CookiePolicyPage() {
  const content = readFileSync(join(process.cwd(), 'legal/COOKIE_POLICY.md'), 'utf-8')
  return <LegalPage content={content} />
}
