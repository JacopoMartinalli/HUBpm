import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_TENANT_ID } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Gestione errori da Supabase Auth
  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/portale/login?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code && !token_hash) {
    return NextResponse.redirect(
      new URL('/portale/login?error=missing_code', request.url)
    )
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    let session = null
    let authError = null

    // Gestisci sia code che token_hash
    if (code) {
      // Scambia il code per una sessione (flow standard)
      const result = await supabase.auth.exchangeCodeForSession(code)
      session = result.data?.session
      authError = result.error
    } else if (token_hash && type) {
      // Verifica OTP token (flow magic link / dev login)
      const result = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'magiclink' | 'email',
      })
      session = result.data?.session
      authError = result.error
    }

    if (authError || !session) {
      console.error('Exchange code error:', authError)
      return NextResponse.redirect(
        new URL('/portale/login?error=auth_failed', request.url)
      )
    }

    // Verifica se esiste gia' un record in utenti_portale
    const { data: existingUser } = await supabase
      .from('utenti_portale')
      .select('id, attivo, contatto_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (existingUser) {
      // Utente esistente - verifica se attivo
      if (!existingUser.attivo) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/portale/login?error=account_disabilitato', request.url)
        )
      }

      // Aggiorna ultimo accesso
      await supabase
        .from('utenti_portale')
        .update({ ultimo_accesso: new Date().toISOString() })
        .eq('id', existingUser.id)

      return NextResponse.redirect(new URL('/portale/dashboard', request.url))
    }

    // Nuovo utente - cerca il contatto associato all'email
    const { data: contatto } = await supabase
      .from('contatti')
      .select('id, tenant_id, tipo, nome, cognome')
      .eq('email', session.user.email)
      .eq('tipo', 'cliente')
      .single()

    if (!contatto) {
      // Email non associata a nessun cliente
      console.error('No cliente found for email:', session.user.email)
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/portale/login?error=cliente_non_trovato', request.url)
      )
    }

    // Crea record utenti_portale
    const { error: insertError } = await supabase
      .from('utenti_portale')
      .insert({
        tenant_id: contatto.tenant_id || DEFAULT_TENANT_ID,
        auth_user_id: session.user.id,
        contatto_id: contatto.id,
        attivo: true,
        ultimo_accesso: new Date().toISOString()
      })

    if (insertError) {
      console.error('Insert utente_portale error:', insertError)
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/portale/login?error=registrazione_fallita', request.url)
      )
    }

    // Redirect alla dashboard
    return NextResponse.redirect(new URL('/portale/dashboard', request.url))

  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.redirect(
      new URL('/portale/login?error=errore_generico', request.url)
    )
  }
}
