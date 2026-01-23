'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared'
import { LeadKanban } from './components/lead-kanban'
import { LeadTable } from './components/lead-table'
import { LeadDialog } from './components/lead-dialog'
import { useLeads } from '@/lib/hooks'

export default function LeadPage() {
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: leads, isLoading } = useLeads()

  const handleLeadClick = (leadId: string) => {
    router.push(`/lead/${leadId}`)
  }

  return (
    <div>
      <PageHeader
        title="Lead"
        description="Gestisci la pipeline commerciale dei potenziali clienti"
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
              Nuovo Lead
            </Button>
          </div>
        }
      />

      {view === 'kanban' ? (
        <LeadKanban
          leads={leads || []}
          isLoading={isLoading}
          onLeadClick={handleLeadClick}
        />
      ) : (
        <LeadTable
          leads={leads || []}
          isLoading={isLoading}
          onLeadClick={handleLeadClick}
        />
      )}

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
