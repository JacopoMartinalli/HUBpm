'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CalendarDays,
  Euro,
  Users,
  Star,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Home,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Proprieta } from '@/types/database'

interface LiveDashboardSectionProps {
  proprieta: Proprieta
  prenotazioniMese?: number
  ricavoMese?: number
  occupazioneMese?: number
  recensioniMedia?: number
  prossimoCheckIn?: { data: string; ospite: string } | null
  prossimoCheckOut?: { data: string; ospite: string } | null
  alertAttivi?: { tipo: 'warning' | 'error'; messaggio: string }[]
}

export function LiveDashboardSection({
  proprieta,
  prenotazioniMese = 0,
  ricavoMese = 0,
  occupazioneMese = 0,
  recensioniMedia = 0,
  prossimoCheckIn,
  prossimoCheckOut,
  alertAttivi = [],
}: LiveDashboardSectionProps) {
  return (
    <div className="space-y-6">
      {/* Status Live */}
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Sparkles className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Proprietà Operativa</h3>
            <p className="text-sm text-green-600">
              {proprieta.cin ? `CIN: ${proprieta.cin}` : 'Gestione attiva'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {proprieta.cir && (
            <Badge variant="outline" className="bg-white">CIR: {proprieta.cir}</Badge>
          )}
          <Button variant="outline" size="sm" className="bg-white">
            <ExternalLink className="h-4 w-4 mr-1" />
            Vai agli annunci
          </Button>
        </div>
      </div>

      {/* Alert attivi */}
      {alertAttivi.length > 0 && (
        <div className="space-y-2">
          {alertAttivi.map((alert, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                alert.tipo === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              )}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{alert.messaggio}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Prenotazioni mese
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prenotazioniMese}</div>
            <p className="text-xs text-muted-foreground">questo mese</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Euro className="h-4 w-4" />
              Ricavo lordo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{ricavoMese.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">questo mese</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Occupazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupazioneMese}%</div>
            <p className="text-xs text-muted-foreground">questo mese</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              Recensioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {recensioniMedia.toFixed(1)}
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">media</p>
          </CardContent>
        </Card>
      </div>

      {/* Prossimi eventi */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Prossimo Check-in */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Prossimo Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prossimoCheckIn ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{prossimoCheckIn.ospite}</p>
                  <p className="text-sm text-muted-foreground">{prossimoCheckIn.data}</p>
                </div>
                <Button variant="outline" size="sm">
                  Dettagli
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun check-in programmato</p>
            )}
          </CardContent>
        </Card>

        {/* Prossimo Check-out */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Prossimo Check-out
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prossimoCheckOut ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{prossimoCheckOut.ospite}</p>
                  <p className="text-sm text-muted-foreground">{prossimoCheckOut.data}</p>
                </div>
                <Button variant="outline" size="sm">
                  Dettagli
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun check-out programmato</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Azioni rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <CalendarDays className="h-4 w-4 mr-1" />
              Blocca date
            </Button>
            <Button variant="outline" size="sm">
              <Euro className="h-4 w-4 mr-1" />
              Modifica prezzi
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              Invia messaggio
            </Button>
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-1" />
              Richiedi pulizie
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
