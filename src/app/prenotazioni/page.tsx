'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, DataTable, Column, LoadingSpinner } from '@/components/shared'
import { usePrenotazioniList, useProprietaList } from '@/lib/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Prenotazione } from '@/types/database'
import { STATI_PRENOTAZIONE, CANALI_PRENOTAZIONE } from '@/constants'

export default function PrenotazioniPage() {
  const router = useRouter()
  const [filtroStato, setFiltroStato] = useState<string>('all')
  const [filtroProprieta, setFiltroProprieta] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { data: prenotazioni, isLoading } = usePrenotazioniList()
  const { data: proprieta } = useProprietaList()

  // Filtra prenotazioni
  const prenotazioniFiltrate = prenotazioni?.filter(p => {
    if (filtroStato !== 'all' && p.stato !== filtroStato) return false
    if (filtroProprieta !== 'all' && p.proprieta_id !== filtroProprieta) return false
    return true
  })

  // Calcola statistiche
  const stats = {
    totali: prenotazioniFiltrate?.length || 0,
    confermate: prenotazioniFiltrate?.filter(p => p.stato === 'confermata').length || 0,
    inCorso: prenotazioniFiltrate?.filter(p => p.stato === 'checkin').length || 0,
    fatturato: prenotazioniFiltrate?.reduce((acc, p) => acc + (p.importo_netto || 0), 0) || 0,
  }

  const columns: Column<Prenotazione>[] = [
    {
      key: 'proprieta',
      header: 'Proprietà',
      cell: (p) => (
        <div>
          <p className="font-medium">{p.proprieta?.nome || '-'}</p>
          <p className="text-xs text-muted-foreground">{p.codice_prenotazione}</p>
        </div>
      ),
    },
    {
      key: 'ospite',
      header: 'Ospite',
      cell: (p) => (
        <div>
          <p className="font-medium">{p.ospite_nome} {p.ospite_cognome}</p>
          {p.ospite_nazione && <p className="text-xs text-muted-foreground">{p.ospite_nazione}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (p) => (
        <div>
          <p className="text-sm">{formatDate(p.checkin)} → {formatDate(p.checkout)}</p>
          <p className="text-xs text-muted-foreground">{p.notti} notti</p>
        </div>
      ),
    },
    {
      key: 'ospiti',
      header: 'Ospiti',
      cell: (p) => p.num_ospiti || '-',
    },
    {
      key: 'canale',
      header: 'Canale',
      cell: (p) => {
        const canale = CANALI_PRENOTAZIONE.find(c => c.id === p.canale)
        return <Badge variant="outline">{canale?.label || p.canale}</Badge>
      },
    },
    {
      key: 'importo',
      header: 'Importo',
      cell: (p) => (
        <div>
          <p className="font-medium">{formatCurrency(p.importo_netto || 0)}</p>
          {p.importo_lordo !== p.importo_netto && (
            <p className="text-xs text-muted-foreground line-through">
              {formatCurrency(p.importo_lordo || 0)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'stato',
      header: 'Stato',
      cell: (p) => {
        const stato = STATI_PRENOTAZIONE.find(s => s.id === p.stato)
        const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          richiesta: 'outline',
          confermata: 'default',
          checkin: 'default',
          checkout: 'secondary',
          cancellata: 'destructive',
          no_show: 'destructive',
        }
        return <Badge variant={colorMap[p.stato] || 'outline'}>{stato?.label || p.stato}</Badge>
      },
    },
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthYearLabel = currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prenotazioni"
        description="Gestisci le prenotazioni delle proprietà"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Prenotazione
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totali}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confermate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.confermate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Corso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.inCorso}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fatturato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.fatturato)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtri */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtri:</span>
        </div>
        <Select value={filtroStato} onValueChange={setFiltroStato}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {STATI_PRENOTAZIONE.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroProprieta} onValueChange={setFiltroProprieta}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Proprietà" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le proprietà</SelectItem>
            {proprieta?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Navigazione mese */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-40 text-center capitalize">{monthYearLabel}</span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabella */}
      <DataTable
        columns={columns}
        data={prenotazioniFiltrate || []}
        isLoading={isLoading}
        emptyState={{
          title: 'Nessuna prenotazione',
          description: 'Le prenotazioni appariranno qui una volta sincronizzate.',
        }}
      />
    </div>
  )
}
