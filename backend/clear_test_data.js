// Clear test data from Supabase for fresh signup
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function clearTestData() {
  console.log('🧹 Clearing test data from database...')

  try {
    // Get user email from prompt
    const userEmail = process.argv[2]

    if (!userEmail) {
      console.log('Usage: node clear_test_data.js <email>')
      console.log('Example: node clear_test_data.js user@example.com')
      process.exit(1)
    }

    console.log(`Looking for organizations with email: ${userEmail}`)

    // Find organizations with this email
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, email')
      .eq('email', userEmail)

    if (orgError) throw orgError

    if (!orgs || orgs.length === 0) {
      console.log('✅ No organizations found with that email. Database is clean!')
      return
    }

    console.log(`Found ${orgs.length} organization(s):`)
    orgs.forEach(org => console.log(`  - ${org.name} (${org.email})`))

    // Delete all related data for each org
    for (const org of orgs) {
      console.log(`\n🗑️  Deleting data for organization: ${org.name}`)

      // Get properties for this org
      const { data: props } = await supabase
        .from('properties')
        .select('id, name')
        .eq('org_id', org.id)

      if (props && props.length > 0) {
        console.log(`  Found ${props.length} properties`)

        for (const prop of props) {
          // Delete messages
          const { error: msgErr } = await supabase
            .from('goconcierge_messages')
            .delete()
            .eq('property_id', prop.id)
          if (msgErr) console.error('  ⚠️  Error deleting messages:', msgErr.message)

          // Delete bookings
          const { error: bookErr } = await supabase
            .from('bookings')
            .delete()
            .eq('property_id', prop.id)
          if (bookErr) console.error('  ⚠️  Error deleting bookings:', bookErr.message)

          // Delete config sheets
          const { error: configErr } = await supabase
            .from('property_config_sheets')
            .delete()
            .eq('property_id', prop.id)
          if (configErr) console.error('  ⚠️  Error deleting config:', configErr.message)

          console.log(`  ✅ Deleted data for property: ${prop.name}`)
        }

        // Delete properties
        const { error: propErr } = await supabase
          .from('properties')
          .delete()
          .eq('org_id', org.id)
        if (propErr) throw propErr
        console.log(`  ✅ Deleted all properties`)
      }

      // Delete organization
      const { error: delOrgErr } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id)
      if (delOrgErr) throw delOrgErr
      console.log(`  ✅ Deleted organization`)
    }

    console.log('\n✨ Database cleared! You can now signup with a fresh account.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

clearTestData()
