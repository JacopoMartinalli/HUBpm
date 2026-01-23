'use client'

import { useState } from 'react'
import { Plus, Package, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, DataTable, Column } from '@/components/shared'
import { useCatalogoServizi, useServiziVenduti } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'
import type { CatalogoServizio, ServizioVenduto } from '@/types/database'
import { TIPI_SERVIZIO, TIPI_PREZZO, STATI_SERVIZIO_VENDUTO } from '@/constants'

export default function ServiziPage() {
  const [tab, setTab] = useState<'catalogo' | 'venduti'>('catalogo')

  const { data: catalogo, isLoading: loadingCatalogo } = useCatalogoServizi()
  const { data: venduti, isLoading: loadingVenduti } = useServiziVenduti()

  const catalogoColumns: Column<CatalogoServizio>[] = [
    {
      key: 'nome',
      header: 'Servizio',
      cell: (s) => (
        <div>
          <p className="font-medium">{s.nome}</p>
          {s.descrizione && <p className="text-xs text-muted-foreground line-clamp-1">{s.descrizione}</p>}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (s) => {
        const tipo = TIPI_SERVIZIO.find(t => t.id === s.tipo)
        return <Badge variant="outline">{tipo?.label || s.tipo}</Badge>
      },
    },
    {
      key: 'prezzo',
      header: 'Prezzo',
      cell: (s) => {
        if (!s.prezzo_base) return 'Da quotare'
        const tipoPrezzo = TIPI_PREZZO.find(t => t.id === s.prezzo_tipo)
        if (s.prezzo_tipo === 'percentuale') {
          return `${s.prezzo_base}%`
        }
        return `${formatCurrency(s.prezzo_base)} ${tipoPrezzo?.label || ''}`
      },
    },
    {
      key: 'fase',
      header: 'Fase Applicabile',
      cell: (s) => s.fase_applicabile || 'Tutte',
    },
    {
      key: 'attivo',
      header: 'Stato',
      cell: (s) => (
        <Badge variant={s.attivo ? 'default' : 'secondary'}>
          {s.attivo ? 'Attivo' : 'Disattivato'}
        </Badge>
      ),
    },
  ]

  const vendutiColumns: Column<ServizioVenduto>[] = [
    {
      key: 'servizio',
      header: 'Servizio',
      cell: (sv) => sv.servizio?.nome || '-',
    },
    {
      key: 'cliente',
      header: 'Cliente',
      cell: (sv) => sv.contatto ? `${sv.contatto.nome} ${sv.contatto.cognome}` : '-',
    },
    {
      key: 'proprieta',
      header: 'Proprietà',
      cell: (sv) => sv.proprieta?.nome || '-',
    },
    {
      key: 'prezzo',
      header: 'Prezzo',
      cell: (sv) => {
        if (sv.prezzo_tipo === 'percentuale') {
          return `${sv.prezzo}%`
        }
        return formatCurrency(sv.prezzo)
      },
    },
    {
      key: 'stato',
      header: 'Stato',
      cell: (sv) => {
        const stato = STATI_SERVIZIO_VENDUTO.find(s => s.id === sv.stato)
        const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          da_iniziare: 'outline',
          in_corso: 'default',
          completato: 'secondary',
          annullato: 'destructive',
        }
        return <Badge variant={colorMap[sv.stato] || 'outline'}>{stato?.label || sv.stato}</Badge>
      },
    },
  ]

  // Statistiche
  const statsCatalogo = {
    totali: catalogo?.length || 0,
    attivi: catalogo?.filter(s => s.attivo).length || 0,
    oneShot: catalogo?.filter(s => s.tipo === 'one_shot').length || 0,
    ricorrenti: catalogo?.filter(s => s.tipo === 'ricorrente').length || 0,
  }

  const statsVenduti = {
    totali: venduti?.length || 0,
    inCorso: venduti?.filter(s => s.stato === 'in_corso').length || 0,
    completati: venduti?.filter(s => s.stato === 'completato').length || 0,
    fatturato: venduti?.reduce((acc, s) => {
      if (s.prezzo_tipo !== 'percentuale') {
        return acc + s.prezzo
      }
      return acc
    }, 0) || 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servizi"
        description="Gestisci il catalogo servizi e le vendite"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Servizio
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'catalogo' | 'venduti')}>
        <TabsList>
          <TabsTrigger value="catalogo" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Catalogo
          </TabsTrigger>
          <TabsTrigger value="venduti" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Venduti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-6 mt-6">
          {/* Stats Catalogo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Servizi Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsCatalogo.totali}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Attivi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsCatalogo.attivi}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">One-Shot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsCatalogo.oneShot}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ricorrenti</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsCatalogo.ricorrenti}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabella Catalogo */}
          <DataTable
            columns={catalogoColumns}
            data={catalogo || []}
            isLoading={loadingCatalogo}
            emptyState={{
              title: 'Nessun servizio nel catalogo',
              description: 'Aggiungi servizi al catalogo per poterli vendere ai clienti.',
            }}
          />
        </TabsContent>

        <TabsContent value="venduti" className="space-y-6 mt-6">
          {/* Stats Venduti */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Totali Venduti</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsVenduti.totali}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Corso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsVenduti.inCorso}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsVenduti.completati}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fatturato</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(statsVenduti.fatturato)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabella Venduti */}
          <DataTable
            columns={vendutiColumns}
            data={venduti || []}
            isLoading={loadingVenduti}
            emptyState={{
              title: 'Nessun servizio venduto',
              description: 'I servizi venduti ai clienti appariranno qui.',
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
