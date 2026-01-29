'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { PortaleNavbar } from '@/components/portale/portale-navbar'
import { LoadingSpinner } from '@/components/shared'
import type { User } from '@supabase/supabase-js'
import type { Contatto } from '@/types/database'

interface PortaleUser {
  id: string
  contatto_id: string
  contatto: Contatto
  authUser: User
}

export default function PortaleProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<PortaleUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientSupabaseClient()

      // Verifica sessione
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/portale/login')
        return
      }

      // Ottieni dati utente portale
      const { data: utentePortale, error } = await supabase
        .from('utenti_portale')
        .select(`
          id,
          contatto_id,
          attivo,
          contatto:contatti(*)
        `)
        .eq('auth_user_id', session.user.id)
        .single()

      if (error || !utentePortale || !utentePortale.attivo) {
        await supabase.auth.signOut()
        router.replace('/portale/login?error=account_non_abilitato')
        return
      }

      setUser({
        id: utentePortale.id,
        contatto_id: utentePortale.contatto_id,
        contatto: utentePortale.contatto as unknown as Contatto,
        authUser: session.user
      })
      setIsLoading(false)
    }

    checkAuth()

    // Listener per cambi di autenticazione
    const supabase = createClientSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/portale/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortaleNavbar user={user} />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
    </div>
  )
}
