import { createClient } from '@supabase/supabase-js'

// Lazy initialization - 避免构建时报错
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase environment variables not configured')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Auth helpers
export async function signUp(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signUp({ email, password })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut()
  return { error }
}

export async function getUser() {
  const { data: { user } } = await getSupabase().auth.getUser()
  return user
}

export async function getSession() {
  const { data: { session } } = await getSupabase().auth.getSession()
  return session
}
