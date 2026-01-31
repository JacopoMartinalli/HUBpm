'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  useLeadStatsByFase,
  useProprietaStatsByFase,
  useClientiStatsByFase,
  usePrenotazioniStatsAnnuali,
} from '@/lib/hooks'
import { FASI_LEAD, FASI_PROPRIETA, FASI_CLIENTE } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import {
  Users,
  Home,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Percent,
  DollarSign,
} from 'lucide-react'

// Pipeline funnel per Lead
function LeadPipeline() {
  const { data: stats, isLoading } = useLeadStatsByFase()

  if (isLoading || !stats) return null

  const totale = stats.totale || 1 // evita divisione per zero
  const fasi = FASI_LEAD.map(fase => ({
    ...fase,
    count: stats.byFase[fase.id] || 0,
    percentage: Math.round(((stats.byFase[fase.id] || 0) / totale) * 100),
  }))

  // Calcola tassi di conversione
  const vinti = stats.byEsito['vinto'] || 0
  const persi = stats.byEsito['perso'] || 0
  const conversionRate = totale > 0 ? Math.round((vinti / totale) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pipeline Lead
            </CardTitle>
            <CardDescription>
              {stats.totale} lead totali
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-lg font-bold">{conversionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Tasso conversione</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Funnel visuale */}
        {fasi.map((fase, index) => (
          <div key={fase.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{fase.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{fase.count}</span>
                <Badge variant="secondary" className="text-xs">
                  {fase.percentage}%
                </Badge>
              </div>
            </div>
            <Progress
              value={fase.percentage}
              className="h-2"
            />
          </div>
        ))}

        {/* Esiti */}
        <div className="pt-3 border-t flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Vinti: {vinti}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Persi: {persi}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Pipeline proprietà
function ProprietaPipeline() {
  const { data: stats, isLoading } = useProprietaStatsByFase()

  if (isLoading || !stats) return null

  const totale = stats.totale || 1
  const operative = stats.byFase['P4'] || 0
  const onboarding = (stats.byFase['P0'] || 0) + (stats.byFase['P1'] || 0) + (stats.byFase['P2'] || 0) + (stats.byFase['P3'] || 0)

  const fasi = FASI_PROPRIETA.filter(f => f.id !== 'P5').map(fase => ({
    ...fase,
    count: stats.byFase[fase.id] || 0,
    percentage: Math.round(((stats.byFase[fase.id] || 0) / totale) * 100),
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Portafoglio Proprietà
            </CardTitle>
            <CardDescription>
              {stats.totale} proprietà in gestione
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-green-600">{operative}</span>
            <p className="text-xs text-muted-foreground">Operative (P4)</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overview bars */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>Operative</span>
              <span className="font-medium text-green-600">{operative}</span>
            </div>
            <Progress value={(operative / totale) * 100} className="h-2" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>Onboarding</span>
              <span className="font-medium text-blue-600">{onboarding}</span>
            </div>
            <Progress value={(onboarding / totale) * 100} className="h-2" />
          </div>
        </div>

        {/* Dettaglio per fase */}
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dettaglio per fase</p>
          <div className="grid grid-cols-2 gap-2">
            {fasi.map(fase => (
              <div key={fase.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                <span>{fase.label}</span>
                <Badge variant="secondary">{fase.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Stats clienti
function ClientiStats() {
  const { data: stats, isLoading } = useClientiStatsByFase()

  if (isLoading || !stats) return null

  const totale = stats.totale
  const attivi = totale - (stats.byFase['C3'] || 0)
  const cessati = stats.byFase['C3'] || 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Clienti
            </CardTitle>
            <CardDescription>
              {totale} clienti totali
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-green-50">
            <p className="text-2xl font-bold text-green-600">{attivi}</p>
            <p className="text-xs text-muted-foreground">Attivi</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50">
            <p className="text-2xl font-bold text-blue-600">{stats.byFase['C0'] || 0}</p>
            <p className="text-xs text-muted-foreground">Onboarding</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-gray-600">{cessati}</p>
            <p className="text-xs text-muted-foreground">Cessati</p>
          </div>
        </div>

        {/* Breakdown fasi */}
        <div className="mt-4 pt-3 border-t">
          <div className="grid grid-cols-4 gap-2">
            {FASI_CLIENTE.map(fase => (
              <div key={fase.id} className="text-center p-2 rounded bg-muted/30">
                <p className="text-lg font-semibold">{stats.byFase[fase.id] || 0}</p>
                <p className="text-xs text-muted-foreground">{fase.label}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Andamento ricavi annuali
function RicaviAnnuali() {
  const currentYear = new Date().getFullYear()
  const { data: stats, isLoading } = usePrenotazioniStatsAnnuali(currentYear)

  if (isLoading || !stats) return null

  const mesiLabels = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
  const currentMonth = new Date().getMonth() + 1

  // Trova il mese con i ricavi più alti per la scala
  const maxRicavi = Math.max(...Object.values(stats.byMonth).map(m => m.ricavi))

  // Calcola media mensile (solo mesi passati)
  const mesiPassati = Object.entries(stats.byMonth).filter(([m]) => parseInt(m) <= currentMonth)
  const mediaRicavi = mesiPassati.length > 0
    ? Math.round(mesiPassati.reduce((sum, [_, m]) => sum + m.ricavi, 0) / mesiPassati.length)
    : 0

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ricavi {currentYear}
            </CardTitle>
            <CardDescription>
              {stats.totalePrenotazioni} prenotazioni • {stats.totaleNotti} notti
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totaleRicavi)}
            </p>
            <p className="text-xs text-muted-foreground">
              Media: {formatCurrency(mediaRicavi)}/mese
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart */}
        <div className="flex items-end gap-1 h-32">
          {Object.entries(stats.byMonth).map(([mese, data]) => {
            const height = maxRicavi > 0 ? (data.ricavi / maxRicavi) * 100 : 0
            const isCurrent = parseInt(mese) === currentMonth
            const isPast = parseInt(mese) <= currentMonth

            return (
              <div key={mese} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    isCurrent
                      ? 'bg-green-500'
                      : isPast
                        ? 'bg-green-300'
                        : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${mesiLabels[parseInt(mese) - 1]}: ${formatCurrency(data.ricavi)}`}
                />
                <span className={`text-xs ${isCurrent ? 'font-bold' : 'text-muted-foreground'}`}>
                  {mesiLabels[parseInt(mese) - 1]}
                </span>
              </div>
            )
          })}
        </div>

        {/* KPIs */}
        <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{stats.totaleNotti}</p>
              <p className="text-xs text-muted-foreground">Notti totali</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {formatCurrency(stats.totaleNotti > 0 ? stats.totaleRicavi / stats.totaleNotti : 0)}
              </p>
              <p className="text-xs text-muted-foreground">€/notte</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-100">
              <Percent className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {stats.totalePrenotazioni > 0
                  ? Math.round(stats.totaleNotti / stats.totalePrenotazioni)
                  : 0
                }
              </p>
              <p className="text-xs text-muted-foreground">Notti/prenotazione</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente principale
export function PortfolioStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <LeadPipeline />
      <ProprietaPipeline />
      <ClientiStats />
      <RicaviAnnuali />
    </div>
  )
}
