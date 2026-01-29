'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Eye,
  Building2,
  User,
  ExternalLink,
} from 'lucide-react'
import type { Documento, Proprieta } from '@/types/database'

const STATO_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  mancante: { label: 'Mancante', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  richiesto: { label: 'Richiesto', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  ricevuto: { label: 'In verifica', variant: 'outline', icon: <Eye className="h-3 w-3" /> },
  verificato: { label: 'Verificato', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  scaduto: { label: 'Scaduto', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
}

const CATEGORIA_LABELS: Record<string, string> = {
  identita: 'Documenti Identita',
  fiscale: 'Documenti Fiscali',
  proprieta: 'Documenti Proprieta',
  contratto: 'Contratti',
  altro: 'Altri Documenti',
}

interface DocumentoConProprieta extends Documento {
  proprieta?: Proprieta
}

export default function PortaleDocumentiPage() {
  const [documenti, setDocumenti] = useState<DocumentoConProprieta[]>([])
  const [proprieta, setProprieta] = useState<Proprieta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contattoId, setContattoId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('tutti')

  useEffect(() => {
    const loadDocumenti = async () => {
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

      // Carica proprieta
      const { data: proprietaData } = await supabase
        .from('proprieta')
        .select('*')
        .eq('contatto_id', utentePortale.contatto_id)
        .neq('fase', 'P5')

      setProprieta(proprietaData || [])

      const proprietaIds = (proprietaData || []).map(p => p.id)

      // Carica tutti i documenti (del contatto e delle proprieta)
      let query = supabase
        .from('documenti')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true })

      if (proprietaIds.length > 0) {
        query = query.or(`contatto_id.eq.${utentePortale.contatto_id},proprieta_id.in.(${proprietaIds.join(',')})`)
      } else {
        query = query.eq('contatto_id', utentePortale.contatto_id)
      }

      const { data: documentiData } = await query

      // Associa proprieta ai documenti
      const documentiConProprieta = (documentiData || []).map(doc => ({
        ...doc,
        proprieta: proprietaData?.find(p => p.id === doc.proprieta_id)
      }))

      setDocumenti(documentiConProprieta)
      setIsLoading(false)
    }

    loadDocumenti()
  }, [])

  const handleDownload = async (doc: Documento) => {
    if (!doc.file_url) return
    window.open(doc.file_url, '_blank')
  }

  const filteredDocumenti = documenti.filter(doc => {
    if (activeTab === 'tutti') return true
    if (activeTab === 'mancanti') return ['mancante', 'richiesto'].includes(doc.stato)
    if (activeTab === 'caricati') return ['ricevuto', 'verificato'].includes(doc.stato)
    return true
  })

  // Raggruppa per categoria
  const documentiByCategoria = filteredDocumenti.reduce((acc, doc) => {
    const cat = doc.categoria || 'altro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {} as Record<string, DocumentoConProprieta[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const countMancanti = documenti.filter(d => ['mancante', 'richiesto'].includes(d.stato)).length
  const countCaricati = documenti.filter(d => ['ricevuto', 'verificato'].includes(d.stato)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">I Miei Documenti</h1>
        <p className="text-gray-500">Visualizza e scarica i tuoi documenti</p>
      </div>

      {/* Stats rapide */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documenti.length}</p>
                <p className="text-sm text-gray-500">Documenti totali</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{countMancanti}</p>
                <p className="text-sm text-gray-500">Da caricare</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{countCaricati}</p>
                <p className="text-sm text-gray-500">Caricati</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs e lista documenti */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tutti">Tutti ({documenti.length})</TabsTrigger>
          <TabsTrigger value="mancanti">
            Da caricare ({countMancanti})
          </TabsTrigger>
          <TabsTrigger value="caricati">Caricati ({countCaricati})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredDocumenti.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">Nessun documento in questa categoria</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === 'mancanti'
                      ? 'Tutti i documenti sono stati caricati!'
                      : 'Non ci sono documenti da visualizzare'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(documentiByCategoria).map(([categoria, docs]) => (
                <Card key={categoria}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {CATEGORIA_LABELS[categoria] || categoria}
                    </CardTitle>
                    <CardDescription>
                      {docs.length} document{docs.length === 1 ? 'o' : 'i'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {docs.map((doc) => {
                        const statoInfo = STATO_BADGE[doc.stato] || STATO_BADGE.mancante
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg ${
                                doc.stato === 'verificato' ? 'bg-green-100' :
                                doc.stato === 'ricevuto' ? 'bg-blue-100' :
                                doc.obbligatorio ? 'bg-red-100' : 'bg-yellow-100'
                              }`}>
                                <FileText className={`h-5 w-5 ${
                                  doc.stato === 'verificato' ? 'text-green-600' :
                                  doc.stato === 'ricevuto' ? 'text-blue-600' :
                                  doc.obbligatorio ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{doc.nome}</p>
                                  {doc.obbligatorio && (
                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                      Obbligatorio
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {doc.proprieta ? (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {doc.proprieta.nome}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      Documento personale
                                    </span>
                                  )}
                                  {doc.file_name && (
                                    <span className="text-xs text-gray-400">
                                      {doc.file_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge variant={statoInfo.variant} className="flex items-center gap-1">
                                {statoInfo.icon}
                                {statoInfo.label}
                              </Badge>

                              {doc.file_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(doc)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Scarica
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Hai bisogno di caricare un documento?</p>
              <p className="text-sm text-blue-700 mt-1">
                Per caricare nuovi documenti, contatta il tuo Property Manager che provvedera ad aggiungerli al sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
