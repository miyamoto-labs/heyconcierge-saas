// Run SQL migration against Supabase via REST API
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://bwxincedtzmejfigrhxd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

const sql = readFileSync('supabase/migrations/013_ota_activities.sql', 'utf8')

async function runMigration() {
  if (!SERVICE_KEY) {
    console.log('SUPABASE_SERVICE_KEY not set. Run migration manually in Supabase SQL Editor.')
    console.log('Migration file: supabase/migrations/013_ota_activities.sql')
    console.log('\nAlternatively, set SUPABASE_SERVICE_KEY and run again.')
    return
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (response.ok) {
    console.log('Migration completed successfully')
  } else {
    const error = await response.text()
    console.log('Migration needs to be run manually.')
    console.log('Go to: https://supabase.com/dashboard/project/bwxincedtzmejfigrhxd/sql')
    console.log('Paste the contents of: supabase/migrations/013_ota_activities.sql')
  }
}

runMigration()
