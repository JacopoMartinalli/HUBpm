import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh della sessione se necessario
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Protezione route portale
  if (pathname.startsWith('/portale')) {
    // Escludi le route pubbliche del portale
    const isPublicPortalRoute =
      pathname === '/portale' ||
      pathname === '/portale/login' ||
      pathname.startsWith('/portale/callback')

    if (!isPublicPortalRoute) {
      // Richiede autenticazione
      if (!session) {
        const loginUrl = new URL('/portale/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Verifica che sia un utente portale valido
      const { data: utentePortale } = await supabase
        .from('utenti_portale')
        .select('id, attivo')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!utentePortale || !utentePortale.attivo) {
        // Utente autenticato ma non abilitato al portale
        await supabase.auth.signOut()
        const loginUrl = new URL('/portale/login', request.url)
        loginUrl.searchParams.set('error', 'account_non_abilitato')
        return NextResponse.redirect(loginUrl)
      }
    }

    // Se utente autenticato va su /portale o /portale/login, redirect a dashboard
    if (session && (pathname === '/portale' || pathname === '/portale/login')) {
      // Verifica che sia un utente portale
      const { data: utentePortale } = await supabase
        .from('utenti_portale')
        .select('id, attivo')
        .eq('auth_user_id', session.user.id)
        .single()

      if (utentePortale?.attivo) {
        return NextResponse.redirect(new URL('/portale/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
