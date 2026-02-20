import { createAdminClient } from '@/lib/supabase/admin'

export async function mapSupabaseAuthUser(
  supabaseAuthId: string,
  email: string,
  name: string,
  image?: string
) {
  const adminSupabase = createAdminClient()

  // Check if this auth ID is already mapped
  const { data: existingMapping } = await adminSupabase
    .from('users')
    .select('id, supabase_auth_id')
    .eq('supabase_auth_id', supabaseAuthId)
    .single()

  if (existingMapping) {
    return existingMapping
  }

  // Try to find existing user by email
  const { data: existingUser } = await adminSupabase
    .from('users')
    .select('id, supabase_auth_id')
    .eq('email', email)
    .single()

  if (existingUser) {
    // Existing user — link their Supabase Auth ID
    if (!existingUser.supabase_auth_id) {
      await adminSupabase
        .from('users')
        .update({ supabase_auth_id: supabaseAuthId })
        .eq('id', existingUser.id)
    }
    return existingUser
  }

  // Brand new user — create public.users record
  const { data: newUser, error } = await adminSupabase
    .from('users')
    .insert({
      id: supabaseAuthId,
      email,
      name,
      image: image || null,
      supabase_auth_id: supabaseAuthId,
    })
    .select()
    .single()

  if (error) throw error
  return newUser
}
