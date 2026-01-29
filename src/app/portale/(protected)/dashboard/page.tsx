'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared'
import {
  Building2,
  FileText,
  Package,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Proprieta, Documento, PropostaCommerciale } from '@/types/database'

interface DashboardStats {
  proprieta: number
  documentiMancanti: number
  documentiTotali: number
  serviziAttivi: number
  proposteInAttesa: number
}

export default function PortaleDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [proprieta, setProprieta] = useState<Proprieta[]>([])
  const [documentiMancanti, setDocumentiMancanti] = useState<Documento[]>([])
  const [proposteInAttesa, setProposteInAttesa] = useState<PropostaCommerciale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contattoId, setContattoId] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createClientSupabaseClient()

      // Ottieni utente portale
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: utentePortale } = await supabase
        .from('utenti_portale')
        .select('contatto_id')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!utentePortale) return

      setContattoId(utentePortale.contatto_id)

      // Carica proprieta'
      const { data: proprietaData } = await supabase
        .from('proprieta')
        .select('*')
        .eq('contatto_id', utentePortale.contatto_id)
        .neq('fase', 'P5') // Escludi cessate
        .order('created_at', { ascending: false })

      setProprieta(proprietaData || [])

      // Carica documenti mancanti
      const { data: documentiData } = await supabase
        .from('documenti')
        .select('*')
        .or(`contatto_id.eq.${utentePortale.contatto_id},proprieta_id.in.(${(proprietaData || []).map(p => p.id).join(',')})`)
        .in('stato', ['mancante', 'richiesto'])
        .order('obbligatorio', { ascending: false })
        .limit(5)

      setDocumentiMancanti(documentiData || [])

      // Conta documenti totali
      const { count: docTotali } = await supabase
        .from('documenti')
        .select('*', { count: 'exact', head: true })
        .or(`contatto_id.eq.${utentePortale.contatto_id},proprieta_id.in.(${(proprietaData || []).map(p => p.id).join(',')})`)

      const { count: docMancanti } = await supabase
        .from('documenti')
        .select('*', { count: 'exact', head: true })
        .or(`contatto_id.eq.${utentePortale.contatto_id},proprieta_id.in.(${(proprietaData || []).map(p => p.id).join(',')})`)
        .in('stato', ['mancante', 'richiesto'])

      // Carica proposte in attesa
      const { data: proposteData } = await supabase
        .from('proposte_commerciali')
        .select('*')
        .eq('contatto_id', utentePortale.contatto_id)
        .eq('stato', 'inviata')
        .order('created_at', { ascending: false })

      setProposteInAttesa(proposteData || [])

      // Conta servizi attivi (erogazioni in corso)
      const { count: serviziAttivi } = await supabase
        .from('erogazione_pacchetti')
        .select('*', { count: 'exact', head: true })
        .in('proprieta_id', (proprietaData || []).map(p => p.id))
        .in('stato', ['da_iniziare', 'in_corso'])

      setStats({
        proprieta: proprietaData?.length || 0,
        documentiMancanti: docMancanti || 0,
        documentiTotali: docTotali || 0,
        serviziAttivi: serviziAttivi || 0,
        proposteInAttesa: proposteData?.length || 0,
      })

      setIsLoading(false)
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Benvenuto nel tuo portale clienti</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Proprietà</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.proprieta || 0}</div>
            <p className="text-xs text-gray-500">in gestione</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Documenti</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.documentiMancanti || 0}
              <span className="text-sm font-normal text-gray-400"> / {stats?.documentiTotali || 0}</span>
            </div>
            <p className="text-xs text-gray-500">da caricare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Servizi Attivi</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.serviziAttivi || 0}</div>
            <p className="text-xs text-gray-500">in corso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Proposte</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.proposteInAttesa || 0}</div>
            <p className="text-xs text-gray-500">in attesa di risposta</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Documenti Mancanti */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Documenti da Caricare</CardTitle>
                <CardDescription>Documenti richiesti in attesa</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/portale/documenti">
                  Vedi tutti
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documentiMancanti.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm text-gray-500">Tutti i documenti sono stati caricati</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentiMancanti.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${doc.obbligatorio ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        {doc.obbligatorio ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.nome}</p>
                        <p className="text-xs text-gray-500 capitalize">{doc.categoria}</p>
                      </div>
                    </div>
                    <Badge variant={doc.stato === 'mancante' ? 'destructive' : 'secondary'}>
                      {doc.stato === 'mancante' ? 'Mancante' : 'Richiesto'}
                    </Badge>
                  </div>
                ))}
                <Button className="w-full mt-2" asChild>
                  <Link href="/portale/documenti">
                    <Upload className="mr-2 h-4 w-4" />
                    Carica Documenti
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposte in Attesa */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Proposte in Attesa</CardTitle>
                <CardDescription>Proposte da valutare</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/portale/proposte">
                  Vedi tutte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {proposteInAttesa.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm text-gray-500">Nessuna proposta in attesa</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposteInAttesa.map((proposta) => (
                  <Link
                    key={proposta.id}
                    href={`/portale/proposte/${proposta.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{proposta.titolo || proposta.numero}</p>
                      <p className="text-xs text-gray-500">
                        Ricevuta il {formatDate(proposta.data_invio || proposta.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Da valutare
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proprietà */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Le tue Proprietà</CardTitle>
                <CardDescription>Proprietà in gestione</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/portale/proprieta">
                  Vedi dettagli
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {proprieta.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Nessuna proprietà in gestione</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {proprieta.slice(0, 6).map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/portale/proprieta/${prop.id}`}
                    className="p-4 rounded-lg border hover:border-primary/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{prop.nome}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {prop.indirizzo}, {prop.citta}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Fase {prop.fase}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
