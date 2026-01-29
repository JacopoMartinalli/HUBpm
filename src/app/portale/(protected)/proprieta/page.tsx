'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Wifi,
  Home,
} from 'lucide-react'
import type { Proprieta } from '@/types/database'

const FASI_INFO: Record<string, { label: string; description: string; color: string; progress: number }> = {
  P0: { label: 'Valutazione', description: 'Sopralluogo e analisi fattibilita', color: 'bg-gray-500', progress: 10 },
  P1: { label: 'Proposta', description: 'Proposta commerciale in preparazione', color: 'bg-blue-500', progress: 25 },
  P2: { label: 'Onboarding', description: 'Raccolta documenti in corso', color: 'bg-indigo-500', progress: 50 },
  P3: { label: 'Setup', description: 'Pratiche legali, foto, annunci OTA', color: 'bg-purple-500', progress: 75 },
  P4: { label: 'Operativa', description: 'Live e in gestione attiva', color: 'bg-green-500', progress: 100 },
  P5: { label: 'Cessata', description: 'Non piu in gestione', color: 'bg-red-500', progress: 0 },
}

const TIPOLOGIA_ICONS: Record<string, React.ReactNode> = {
  appartamento: <Building2 className="h-5 w-5" />,
  villa: <Home className="h-5 w-5" />,
  casa: <Home className="h-5 w-5" />,
  default: <Building2 className="h-5 w-5" />,
}

export default function PortaleProprietaPage() {
  const [proprieta, setProprieta] = useState<Proprieta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProprieta = async () => {
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

      // Carica proprieta
      const { data: proprietaData } = await supabase
        .from('proprieta')
        .select('*')
        .eq('contatto_id', utentePortale.contatto_id)
        .neq('fase', 'P5')
        .order('created_at', { ascending: false })

      setProprieta(proprietaData || [])
      setIsLoading(false)
    }

    loadProprieta()
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
        <h1 className="text-2xl font-bold">Le Mie Proprieta</h1>
        <p className="text-gray-500">Visualizza lo stato delle tue proprieta in gestione</p>
      </div>

      {/* Lista proprieta */}
      {proprieta.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Building2 className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">Nessuna proprieta in gestione</p>
              <p className="text-sm text-gray-500 mt-1">
                Le tue proprieta appariranno qui una volta aggiunte
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {proprieta.map((prop) => {
            const faseInfo = FASI_INFO[prop.fase] || FASI_INFO.P0
            const icon = TIPOLOGIA_ICONS[prop.tipologia || ''] || TIPOLOGIA_ICONS.default

            return (
              <Link
                key={prop.id}
                href={`/portale/proprieta/${prop.id}`}
              >
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{prop.nome}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {prop.indirizzo}, {prop.citta}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{faseInfo.label}</span>
                        <span className="text-gray-500">{faseInfo.progress}%</span>
                      </div>
                      <Progress value={faseInfo.progress} className="h-2" />
                      <p className="text-xs text-gray-500">{faseInfo.description}</p>
                    </div>

                    {/* Info rapide */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {prop.tipologia && (
                        <Badge variant="outline" className="text-xs">
                          {prop.tipologia}
                        </Badge>
                      )}
                      {prop.max_ospiti && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {prop.max_ospiti} ospiti
                        </Badge>
                      )}
                      {prop.wifi_ssid && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          WiFi
                        </Badge>
                      )}
                      {prop.fase === 'P4' && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Operativa
                        </Badge>
                      )}
                      {['P1', 'P2', 'P3'].includes(prop.fase) && (
                        <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          In lavorazione
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
