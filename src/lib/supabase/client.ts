import { createBrowserClient } from '@supabase/ssr'

/**
 * Crea un client Supabase per uso in Client Components.
 * Gestisce automaticamente i cookie per l'autenticazione.
 */
export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton per evitare multiple istanze
let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Ottiene un'istanza singleton del client Supabase per il browser.
 * Utile per evitare di creare multiple istanze in React.
 */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClientSupabaseClient()
  }
  return browserClient
}
