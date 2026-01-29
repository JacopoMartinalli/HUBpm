'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, CheckCircle2, AlertCircle, Building2, Code2, Users } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Contatto } from '@/types/database'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Link non valido. Richiedi un nuovo accesso.',
  auth_failed: 'Autenticazione fallita. Riprova.',
  cliente_non_trovato: 'Email non associata a nessun cliente. Contatta il tuo Property Manager.',
  account_disabilitato: 'Il tuo account è stato disabilitato. Contatta il tuo Property Manager.',
  account_non_abilitato: 'Non hai accesso al portale. Contatta il tuo Property Manager.',
  registrazione_fallita: 'Errore durante la registrazione. Riprova.',
  errore_generico: 'Si è verificato un errore. Riprova.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || 'Errore sconosciuto')
    }
  }, [errorParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/portale/callback`,
          shouldCreateUser: false,
        },
      })

      if (authError) {
        if (authError.message.includes('Signups not allowed')) {
          setError('Email non associata a nessun cliente. Contatta il tuo Property Manager per richiedere accesso.')
        } else {
          setError(authError.message)
        }
        return
      }

      setIsSuccess(true)
    } catch (err) {
      console.error('Login error:', err)
      setError('Si è verificato un errore. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>Accedi al Portale</CardTitle>
        <CardDescription>
          Inserisci la tua email per ricevere un link di accesso
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Controlla la tua email</h3>
            <p className="text-gray-600 text-sm">
              Ti abbiamo inviato un link di accesso a <strong>{email}</strong>.
              <br />
              Clicca sul link per accedere al portale.
            </p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setIsSuccess(false)
                setEmail('')
              }}
            >
              Usa un&apos;altra email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Usa l&apos;email con cui sei registrato come cliente
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !email}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                'Invia link di accesso'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function LoginFormFallback() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>Accedi al Portale</CardTitle>
        <CardDescription>
          Inserisci la tua email per ricevere un link di accesso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )
}

// DEV MODE: Login diretto selezionando un cliente
function DevLoginCard() {
  const router = useRouter()
  const [clienti, setClienti] = useState<Contatto[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const loadClienti = async () => {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase
        .from('contatti')
        .select('*')
        .eq('tipo', 'cliente')
        .order('cognome', { ascending: true })

      if (error) {
        console.error('Errore caricamento clienti:', error)
        setError('Errore nel caricamento dei clienti')
      } else {
        setClienti(data || [])
      }
      setIsLoading(false)
    }

    loadClienti()
  }, [])

  const handleDevLogin = async () => {
    if (!selectedClienteId) return

    setIsLoggingIn(true)
    setError(null)
    setInfo(null)

    try {
      // Trova il cliente selezionato
      const cliente = clienti.find(c => c.id === selectedClienteId)
      if (!cliente || !cliente.email) {
        setError('Cliente non trovato o senza email')
        setIsLoggingIn(false)
        return
      }

      setInfo('Generazione accesso in corso...')

      // Chiama l'API dev login
      const response = await fetch('/api/dev/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contattoId: selectedClienteId,
          email: cliente.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Errore durante il login')
        if (data.hint) {
          setInfo(data.hint)
        }
        setIsLoggingIn(false)
        return
      }

      // Login con email e password temporanea
      if (data.email && data.password) {
        setInfo('Accesso in corso...')

        const supabase = createClientSupabaseClient()
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })

        if (signInError) {
          setError('Errore login: ' + signInError.message)
          setIsLoggingIn(false)
          return
        }

        if (authData.session) {
          setInfo('Accesso riuscito! Reindirizzamento...')
          // Redirect alla dashboard del portale
          router.push('/portale/dashboard')
        } else {
          setError('Sessione non creata')
        }
      } else {
        setError('Risposta API non valida')
      }

    } catch (err) {
      console.error('Dev login error:', err)
      setError('Errore durante il login')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <Card className="shadow-lg border-amber-200 bg-amber-50/50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Code2 className="h-5 w-5 text-amber-600" />
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            DEV MODE
          </Badge>
        </div>
        <CardTitle className="text-lg">Accesso Sviluppatore</CardTitle>
        <CardDescription>
          Seleziona un cliente per accedere direttamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {info && !error && (
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">{info}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Seleziona Cliente</Label>
            <Select
              value={selectedClienteId}
              onValueChange={setSelectedClienteId}
              disabled={isLoading || isLoggingIn}
            >
              <SelectTrigger id="cliente">
                <SelectValue placeholder={isLoading ? "Caricamento..." : "Seleziona un cliente"} />
              </SelectTrigger>
              <SelectContent>
                {clienti.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{cliente.nome} {cliente.cognome}</span>
                      {cliente.email && (
                        <span className="text-xs text-gray-400">({cliente.email})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDevLogin}
            className="w-full bg-amber-600 hover:bg-amber-700"
            disabled={!selectedClienteId || isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accesso in corso...
              </>
            ) : (
              <>
                <Code2 className="mr-2 h-4 w-4" />
                Accedi come Cliente
              </>
            )}
          </Button>

          <p className="text-xs text-amber-700 text-center">
            Questo bypass è disponibile solo in ambiente di sviluppo
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PortaleLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portale Clienti</h1>
          <p className="text-gray-500 mt-1">Accedi per gestire le tue proprietà</p>
        </div>

        {/* DEV Mode Login - Solo in development */}
        {process.env.NODE_ENV === 'development' && <DevLoginCard />}

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500 mt-6">
          Non hai un account?{' '}
          <span className="text-primary">Contatta il tuo Property Manager</span>
        </p>
      </div>
    </div>
  )
}
