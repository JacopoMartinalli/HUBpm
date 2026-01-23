'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader, FaseBadge, KanbanBoard, DataTable, Column, LoadingCard } from '@/components/shared'
import { useProprietaLeadList } from '@/lib/hooks'
import { FASI_PROPRIETA_LEAD } from '@/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ProprietaLead } from '@/types/database'
import { ProprietaLeadDialog } from './components/proprieta-lead-dialog'

export default function ProprietaLeadPage() {
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: proprietaLead, isLoading } = useProprietaLeadList()

  const handleClick = (id: string) => {
    router.push(`/proprieta-lead/${id}`)
  }

  const columns = FASI_PROPRIETA_LEAD.map((fase) => ({
    id: fase.id,
    title: fase.label,
    description: fase.description,
    items: (proprietaLead || []).filter((p) => p.fase === fase.id),
  }))

  const renderCard = (item: ProprietaLead) => (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.nome}</p>
          <p className="text-xs text-muted-foreground truncate">
            {item.citta}
          </p>
        </div>
      </div>
      {item.revenue_stimato_annuo && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs font-medium text-green-600">
            {formatCurrency(item.revenue_stimato_annuo)}/anno
          </p>
        </div>
      )}
    </Card>
  )

  const tableColumns: Column<ProprietaLead>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (item) => (
        <div>
          <p className="font-medium">{item.nome}</p>
          <p className="text-xs text-muted-foreground">{item.indirizzo}</p>
        </div>
      ),
    },
    { key: 'citta', header: 'Città', cell: (item) => item.citta },
    { key: 'tipologia', header: 'Tipologia', cell: (item) => item.tipologia || '-' },
    {
      key: 'fase',
      header: 'Fase',
      cell: (item) => <FaseBadge fase={item.fase} tipo="proprieta_lead" />,
    },
    {
      key: 'revenue',
      header: 'Revenue Stimato',
      cell: (item) => item.revenue_stimato_annuo ? formatCurrency(item.revenue_stimato_annuo) : '-',
    },
    { key: 'created_at', header: 'Data', cell: (item) => formatDate(item.created_at) },
  ]

  return (
    <div>
      <PageHeader
        title="Proprietà Lead"
        description="Gestisci le proprietà in fase di valutazione"
        actions={
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'table')}>
              <TabsList>
                <TabsTrigger value="kanban">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="table">
                  <List className="h-4 w-4 mr-1" />
                  Lista
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Proprietà
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingCard />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={columns}
          renderCard={renderCard}
          onCardClick={(item) => handleClick(item.id)}
        />
      ) : (
        <DataTable
          columns={tableColumns}
          data={proprietaLead || []}
          onRowClick={(item) => handleClick(item.id)}
          emptyState={{
            title: 'Nessuna proprietà lead',
            description: 'Inizia aggiungendo la prima proprietà in valutazione.',
          }}
        />
      )}

      <ProprietaLeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
