'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard, LoadingPage, FaseBadge } from '@/components/shared'
import { useDashboardStats, useTaskPendenti, usePrenotazioniProssime, useAppuntamentiProssimi } from '@/lib/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users,
  Home,
  Building2,
  CheckSquare,
  AlertCircle,
  CalendarDays,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: taskPendenti, isLoading: taskLoading } = useTaskPendenti()
  const { data: prenotazioni, isLoading: prenotazioniLoading } = usePrenotazioniProssime()
  const { data: appuntamenti, isLoading: appuntamentiLoading } = useAppuntamentiProssimi(5)

  if (statsLoading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Panoramica della tua attività</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Lead Attivi"
          value={stats?.leadAttivi || 0}
          description="In pipeline commerciale"
          icon={Users}
        />
        <StatsCard
          title="Clienti Attivi"
          value={stats?.clientiAttivi || 0}
          description="Con contratto attivo"
          icon={Users}
        />
        <StatsCard
          title="Proprietà Operative"
          value={stats?.proprietaOperative || 0}
          description="In gestione attiva"
          icon={Home}
        />
        <StatsCard
          title="Ricavi Mese"
          value={formatCurrency(stats?.ricaviMese || 0)}
          description="Mese corrente"
          icon={TrendingUp}
        />
      </div>

      {/* Alert Section */}
      {(stats?.taskScaduti || 0) > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">
                {stats?.taskScaduti} task in scadenza o scaduti
              </p>
              <p className="text-sm text-orange-700">
                Controlla i task pendenti per non perdere nessuna attività
              </p>
            </div>
            <Button variant="outline" className="ml-auto" asChild>
              <Link href="/task">Vedi Task</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Pendenti */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Task Pendenti
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/task">Vedi tutti</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {taskLoading ? (
              <p className="text-muted-foreground">Caricamento...</p>
            ) : taskPendenti && taskPendenti.length > 0 ? (
              <div className="space-y-3">
                {taskPendenti.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.titolo}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.data_scadenza ? `Scadenza: ${formatDate(task.data_scadenza)}` : 'Senza scadenza'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.proprieta?.nome && (
                        <span className="text-xs text-muted-foreground">
                          {task.proprieta.nome}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nessun task pendente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prossime Prenotazioni */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Prossimi Check-in
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/prenotazioni">Vedi tutte</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {prenotazioniLoading ? (
              <p className="text-muted-foreground">Caricamento...</p>
            ) : prenotazioni && prenotazioni.length > 0 ? (
              <div className="space-y-3">
                {prenotazioni.slice(0, 5).map((prenotazione) => (
                  <div
                    key={prenotazione.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {prenotazione.ospite_nome} {prenotazione.ospite_cognome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prenotazione.proprieta?.nome} - {prenotazione.notti} notti
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDate(prenotazione.checkin)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prenotazione.canale || 'Direct'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nessun check-in nei prossimi 7 giorni
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prossimi Appuntamenti */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prossimi Appuntamenti
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendario">Calendario</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appuntamentiLoading ? (
              <p className="text-muted-foreground">Caricamento...</p>
            ) : appuntamenti && appuntamenti.length > 0 ? (
              <div className="space-y-3">
                {appuntamenti.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-full
                        ${app.tipo === 'sopralluogo' ? 'bg-blue-100 text-blue-600' : ''}
                        ${app.tipo === 'telefonata' ? 'bg-green-100 text-green-600' : ''}
                        ${app.tipo === 'videochiamata' ? 'bg-purple-100 text-purple-600' : ''}
                        ${app.tipo === 'riunione' ? 'bg-amber-100 text-amber-600' : ''}
                        ${app.tipo === 'altro' ? 'bg-gray-100 text-gray-600' : ''}
                      `}>
                        {app.tipo === 'sopralluogo' && <MapPin className="h-4 w-4" />}
                        {app.tipo === 'telefonata' && <Phone className="h-4 w-4" />}
                        {app.tipo === 'videochiamata' && <Video className="h-4 w-4" />}
                        {app.tipo === 'riunione' && <Users className="h-4 w-4" />}
                        {app.tipo === 'altro' && <CalendarDays className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{app.titolo}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.contatto?.nome} {app.contatto?.cognome}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDate(app.data_inizio)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(app.data_inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nessun appuntamento in programma
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Proprietà Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.proprietaLeadAttive || 0}</p>
            <p className="text-xs text-muted-foreground">In valutazione</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Task Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.taskPendenti || 0}</p>
            <p className="text-xs text-muted-foreground">Da completare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Task Scaduti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats?.taskScaduti || 0}</p>
            <p className="text-xs text-muted-foreground">Richiedono attenzione</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
