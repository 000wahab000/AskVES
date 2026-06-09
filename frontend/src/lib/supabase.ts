import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[AskVES] Supabase env vars not set — auth will not work.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/** Sign in with Google, restricting to @ves.ac.in domain */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: { hd: 'ves.ac.in' },  // restrict to college domain
      redirectTo: `${window.location.origin}/chat`,
    },
  })
}

/** Sign out the current user */
export async function signOut() {
  return supabase.auth.signOut()
}

/** Get the current session (null if not logged in) */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Subscribe to auth state changes */
export function onAuthStateChange(callback: (session: unknown) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}
