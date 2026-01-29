'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  Wifi,
  Home,
  FileText,
  Camera,
  Scale,
  Globe,
  Key,
  Phone,
  Mail,
  Calendar,
  Bed,
  Bath,
  Maximize,
  Lock,
} from 'lucide-react'
import type { Proprieta, Task, Documento } from '@/types/database'

const FASI_INFO: Record<string, { label: string; description: string; color: string; progress: number }> = {
  P0: { label: 'Valutazione', description: 'Sopralluogo e analisi fattibilita', color: 'bg-gray-500', progress: 10 },
  P1: { label: 'Proposta', description: 'Proposta commerciale in preparazione', color: 'bg-blue-500', progress: 25 },
  P2: { label: 'Onboarding', description: 'Raccolta documenti in corso', color: 'bg-indigo-500', progress: 50 },
  P3: { label: 'Setup', description: 'Pratiche legali, foto, annunci OTA', color: 'bg-purple-500', progress: 75 },
  P4: { label: 'Operativa', description: 'Live e in gestione attiva', color: 'bg-green-500', progress: 100 },
  P5: { label: 'Cessata', description: 'Non piu in gestione', color: 'bg-red-500', progress: 0 },
}

// Checklist items per ogni fase
const CHECKLIST_FASI = [
  {
    fase: 'P0',
    label: 'Valutazione',
    items: [
      { id: 'sopralluogo', label: 'Sopralluogo effettuato', icon: Home },
      { id: 'analisi', label: 'Analisi mercato completata', icon: Globe },
      { id: 'preventivo', label: 'Preventivo stimato', icon: FileText },
    ]
  },
  {
    fase: 'P1',
    label: 'Proposta Commerciale',
    items: [
      { id: 'proposta_creata', label: 'Proposta creata', icon: FileText },
      { id: 'proposta_inviata', label: 'Proposta inviata', icon: Mail },
      { id: 'proposta_accettata', label: 'Proposta accettata', icon: CheckCircle2 },
    ]
  },
  {
    fase: 'P2',
    label: 'Onboarding',
    items: [
      { id: 'contratto', label: 'Contratto firmato', icon: FileText },
      { id: 'documenti_identita', label: 'Documenti identita raccolti', icon: FileText },
      { id: 'documenti_proprieta', label: 'Documenti proprieta raccolti', icon: FileText },
      { id: 'dati_catastali', label: 'Dati catastali verificati', icon: Building2 },
    ]
  },
  {
    fase: 'P3',
    label: 'Setup',
    items: [
      { id: 'scia', label: 'SCIA presentata', icon: Scale },
      { id: 'cir', label: 'CIR ottenuto', icon: Key },
      { id: 'cin', label: 'CIN ottenuto', icon: Key },
      { id: 'alloggiati', label: 'Alloggiati Web attivato', icon: Globe },
      { id: 'foto', label: 'Shooting fotografico', icon: Camera },
      { id: 'annunci', label: 'Annunci OTA pubblicati', icon: Globe },
      { id: 'pricing', label: 'Strategia prezzi configurata', icon: Calendar },
    ]
  },
  {
    fase: 'P4',
    label: 'Operativa',
    items: [
      { id: 'live', label: 'Proprieta live', icon: CheckCircle2 },
      { id: 'prima_prenotazione', label: 'Prima prenotazione ricevuta', icon: Calendar },
    ]
  },
]

export default function PortaleProprietaDetailPage() {
  const params = useParams()
  const proprietaId = params.id as string

  const [proprieta, setProprieta] = useState<Proprieta | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [documenti, setDocumenti] = useState<Documento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClientSupabaseClient()

      // Carica proprieta
      const { data: proprietaData } = await supabase
        .from('proprieta')
        .select('*')
        .eq('id', proprietaId)
        .single()

      if (!proprietaData) {
        setIsLoading(false)
        return
      }

      setProprieta(proprietaData)

      // Carica task della proprieta
      const { data: tasksData } = await supabase
        .from('task')
        .select('*')
        .eq('proprieta_id', proprietaId)
        .order('created_at', { ascending: true })

      setTasks(tasksData || [])

      // Carica documenti della proprieta
      const { data: documentiData } = await supabase
        .from('documenti')
        .select('*')
        .eq('proprieta_id', proprietaId)
        .order('categoria', { ascending: true })

      setDocumenti(documentiData || [])

      setIsLoading(false)
    }

    loadData()
  }, [proprietaId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!proprieta) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Building2 className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium">Proprieta non trovata</p>
        <Button asChild className="mt-4">
          <Link href="/portale/proprieta">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle proprieta
          </Link>
        </Button>
      </div>
    )
  }

  const faseInfo = FASI_INFO[proprieta.fase] || FASI_INFO.P0
  const faseIndex = ['P0', 'P1', 'P2', 'P3', 'P4'].indexOf(proprieta.fase)

  // Calcola completamento checklist basato su dati reali
  const getChecklistStatus = (fase: string, itemId: string): 'completed' | 'current' | 'pending' => {
    const faseIdx = ['P0', 'P1', 'P2', 'P3', 'P4'].indexOf(fase)
    const currentIdx = faseIndex

    // Fasi passate: completate
    if (faseIdx < currentIdx) return 'completed'

    // Fasi future: pending
    if (faseIdx > currentIdx) return 'pending'

    // Fase corrente: verifica dati specifici
    switch (itemId) {
      case 'cir':
        return proprieta.cir ? 'completed' : 'current'
      case 'cin':
        return proprieta.cin ? 'completed' : 'current'
      case 'scia':
        return proprieta.scia_protocollo ? 'completed' : 'current'
      case 'alloggiati':
        return proprieta.alloggiati_web_attivo ? 'completed' : 'current'
      case 'dati_catastali':
        return proprieta.foglio && proprieta.mappale ? 'completed' : 'current'
      case 'live':
        return proprieta.fase === 'P4' ? 'completed' : 'current'
      default:
        // Per altri item, considera completati basandosi sui task
        const relatedTask = tasks.find(t =>
          t.titolo?.toLowerCase().includes(itemId.replace('_', ' '))
        )
        if (relatedTask?.stato === 'completato') return 'completed'
        return 'current'
    }
  }

  const documentiMancanti = documenti.filter(d => ['mancante', 'richiesto'].includes(d.stato)).length
  const documentiTotali = documenti.length

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href="/portale/proprieta">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alle proprieta
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{proprieta.nome}</h1>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {proprieta.indirizzo}, {proprieta.citta}
              {proprieta.cap && ` - ${proprieta.cap}`}
            </p>
          </div>
        </div>

        <Badge className={`text-sm px-3 py-1 ${
          proprieta.fase === 'P4' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {faseInfo.label}
        </Badge>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Avanzamento</CardTitle>
          <CardDescription>Progresso verso la messa online della proprieta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{faseInfo.label}</span>
              <span className="text-gray-500">{faseInfo.progress}%</span>
            </div>
            <Progress value={faseInfo.progress} className="h-3" />
          </div>

          {/* Fasi timeline */}
          <div className="flex items-center justify-between pt-4">
            {['P0', 'P1', 'P2', 'P3', 'P4'].map((fase, idx) => {
              const isCompleted = idx < faseIndex
              const isCurrent = idx === faseIndex
              const info = FASI_INFO[fase]

              return (
                <div key={fase} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-primary text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 text-center ${
                    isCurrent ? 'font-medium text-primary' : 'text-gray-500'
                  }`}>
                    {info.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Checklist Fasi */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Checklist Go-Live</CardTitle>
            <CardDescription>Attivita da completare per ogni fase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {CHECKLIST_FASI.map((faseGroup, groupIdx) => {
              const faseIdx = ['P0', 'P1', 'P2', 'P3', 'P4'].indexOf(faseGroup.fase)
              const isGroupCompleted = faseIdx < faseIndex
              const isGroupCurrent = faseIdx === faseIndex
              const isGroupFuture = faseIdx > faseIndex

              return (
                <div key={faseGroup.fase}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isGroupCompleted ? 'bg-green-100 text-green-700' :
                      isGroupCurrent ? 'bg-primary/10 text-primary' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {isGroupCompleted ? <CheckCircle2 className="h-4 w-4" /> : groupIdx + 1}
                    </div>
                    <h3 className={`font-medium ${
                      isGroupFuture ? 'text-gray-400' : ''
                    }`}>
                      {faseGroup.label}
                    </h3>
                  </div>

                  <div className="ml-8 space-y-2">
                    {faseGroup.items.map((item) => {
                      const status = getChecklistStatus(faseGroup.fase, item.id)
                      const Icon = item.icon

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            status === 'completed' ? 'bg-green-50' :
                            status === 'current' ? 'bg-blue-50' :
                            'bg-gray-50'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : status === 'current' ? (
                            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                          )}
                          <Icon className={`h-4 w-4 flex-shrink-0 ${
                            status === 'completed' ? 'text-green-600' :
                            status === 'current' ? 'text-blue-600' :
                            'text-gray-400'
                          }`} />
                          <span className={`text-sm ${
                            status === 'pending' ? 'text-gray-400' : ''
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {groupIdx < CHECKLIST_FASI.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Info Proprieta */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Proprieta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Caratteristiche */}
            <div className="grid grid-cols-2 gap-4">
              {proprieta.tipologia && (
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-gray-400" />
                  <span className="capitalize">{proprieta.tipologia}</span>
                </div>
              )}
              {proprieta.max_ospiti && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{proprieta.max_ospiti} ospiti max</span>
                </div>
              )}
              {proprieta.camere && (
                <div className="flex items-center gap-2 text-sm">
                  <Bed className="h-4 w-4 text-gray-400" />
                  <span>{proprieta.camere} camere</span>
                </div>
              )}
              {proprieta.bagni && (
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="h-4 w-4 text-gray-400" />
                  <span>{proprieta.bagni} bagni</span>
                </div>
              )}
              {proprieta.mq && (
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="h-4 w-4 text-gray-400" />
                  <span>{proprieta.mq} mq</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Codici */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-500">Codici Identificativi</h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <span className="text-sm">CIR</span>
                  {proprieta.cir ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {proprieta.cir}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">
                      In attesa
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <span className="text-sm">CIN</span>
                  {proprieta.cin ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {proprieta.cin}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">
                      In attesa
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <span className="text-sm">Alloggiati Web</span>
                  {proprieta.alloggiati_web_attivo ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Attivo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">
                      Non attivo
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* WiFi e Accesso */}
            {(proprieta.wifi_ssid || proprieta.codice_portone) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-500">Accesso</h4>
                  <div className="grid gap-2">
                    {proprieta.wifi_ssid && (
                      <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">WiFi</span>
                        </div>
                        <span className="text-sm font-mono">{proprieta.wifi_ssid}</span>
                      </div>
                    )}
                    {proprieta.codice_portone && (
                      <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">Codice portone</span>
                        </div>
                        <span className="text-sm font-mono">{proprieta.codice_portone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Documenti */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documenti</CardTitle>
                <CardDescription>
                  {documentiMancanti > 0
                    ? `${documentiMancanti} documenti da caricare`
                    : 'Tutti i documenti sono stati caricati'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/portale/documenti">
                  Vedi tutti
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documenti.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nessun documento associato
              </p>
            ) : (
              <div className="space-y-2">
                {documenti.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className={`h-4 w-4 ${
                        doc.stato === 'verificato' ? 'text-green-600' :
                        doc.stato === 'ricevuto' ? 'text-blue-600' :
                        'text-gray-400'
                      }`} />
                      <span className="text-sm truncate max-w-[200px]">{doc.nome}</span>
                    </div>
                    {doc.stato === 'verificato' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : doc.stato === 'ricevuto' ? (
                      <Clock className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                ))}
                {documenti.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    + altri {documenti.length - 5} documenti
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
