import { readFileSync } from 'fs'
import { join } from 'path'
import LegalPage from '@/components/ui/LegalPage'

export const metadata = { title: 'Data Processing Agreement — HeyConcierge' }

export default function DpaPage() {
  const content = readFileSync(join(process.cwd(), 'legal/DATA_PROCESSING_AGREEMENT.md'), 'utf-8')
  return <LegalPage content={content} />
}
