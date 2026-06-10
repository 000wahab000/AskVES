import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const SUPABASE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

// Only create the client if env vars are present — avoids crash on local dev
export const supabase: SupabaseClient | null = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

if (!SUPABASE_CONFIGURED) {
  console.warn(
    '[AskVES] Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).\n' +
    'Auth is disabled — create frontend/.env.local to enable it.'
  )
}

/** Sign in with Google, restricting to @ves.ac.in domain */
export async function signInWithGoogle() {
  if (!supabase) return { error: new Error('Supabase not configured') }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: { hd: 'ves.ac.in' },
      redirectTo: `${window.location.origin}/chat`,
    },
  })
}

/** Sign out the current user */
export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

/** Get the current session (null if not logged in or Supabase not configured) */
export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}
