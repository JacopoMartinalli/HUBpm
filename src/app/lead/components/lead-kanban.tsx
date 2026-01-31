'use client'

import { KanbanBoardDnd, LoadingCard } from '@/components/shared'
import { FASI_LEAD } from '@/constants'
import { useUpdateContatto } from '@/lib/hooks'
import type { Contatto, FaseLead } from '@/types/database'
import { toast } from 'sonner'
import { LeadCard } from './lead-card'

interface LeadKanbanProps {
  leads: Contatto[]
  isLoading: boolean
  onLeadClick: (leadId: string) => void
}

export function LeadKanban({ leads, isLoading, onLeadClick }: LeadKanbanProps) {
  const updateContatto = useUpdateContatto()

  if (isLoading) {
    return <LoadingCard />
  }

  const columns = FASI_LEAD.map((fase) => ({
    id: fase.id,
    title: fase.label,
    description: fase.description,
    color: fase.color,
    items: leads.filter((lead) => lead.fase_lead === fase.id),
  }))

  // Handler per il drag & drop
  const handleMoveCard = async (itemId: string, sourceColumnId: string, targetColumnId: string) => {
    const lead = leads.find(l => l.id === itemId)
    if (!lead) return

    const targetFase = FASI_LEAD.find(f => f.id === targetColumnId)
    if (!targetFase) return

    try {
      await updateContatto.mutateAsync({
        id: itemId,
        fase_lead: targetColumnId as FaseLead,
      })
      toast.success(`Lead spostato in "${targetFase.label}"`)
    } catch (error) {
      toast.error('Errore nello spostamento del lead')
      console.error('Errore move card:', error)
    }
  }

  const renderLeadCard = (lead: Contatto, isDragging?: boolean) => (
    <LeadCard
      lead={lead}
      onLeadClick={onLeadClick}
      isDragging={isDragging}
    />
  )

  return (
    <KanbanBoardDnd
      columns={columns}
      renderCard={renderLeadCard}
      onCardClick={(lead) => onLeadClick(lead.id)}
      onMoveCard={handleMoveCard}
      emptyMessage="Nessun lead in questa fase"
    />
  )
}
