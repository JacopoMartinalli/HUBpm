import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Crea un client Supabase per uso in Server Components e API Routes.
 * Gestisce automaticamente i cookie per l'autenticazione.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignora errori in contesti read-only (es. middleware)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignora errori in contesti read-only
          }
        },
      },
    }
  )
}

/**
 * Ottiene la sessione corrente dell'utente.
 * Da usare in Server Components.
 */
export async function getServerSession() {
  const supabase = createServerSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Errore nel recupero sessione:', error)
    return null
  }

  return session
}

/**
 * Ottiene l'utente corrente autenticato.
 * Da usare in Server Components.
 */
export async function getServerUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Errore nel recupero utente:', error)
    return null
  }

  return user
}

/**
 * Ottiene i dati dell'utente portale (contatto collegato).
 * Da usare in Server Components per il portale clienti.
 */
export async function getPortaleUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: utentePortale, error: portaleError } = await supabase
    .from('utenti_portale')
    .select(`
      *,
      contatto:contatti(*)
    `)
    .eq('auth_user_id', user.id)
    .eq('attivo', true)
    .single()

  if (portaleError || !utentePortale) {
    return null
  }

  return {
    ...utentePortale,
    authUser: user
  }
}
