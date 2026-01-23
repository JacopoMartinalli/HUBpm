'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanBoard, KanbanCard, LoadingCard, EsitoBadge } from '@/components/shared'
import { FASI_LEAD } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import type { Contatto, FaseLead } from '@/types/database'
import { Phone, Mail } from 'lucide-react'

interface LeadKanbanProps {
  leads: Contatto[]
  isLoading: boolean
  onLeadClick: (leadId: string) => void
}

export function LeadKanban({ leads, isLoading, onLeadClick }: LeadKanbanProps) {
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

  const renderLeadCard = (lead: Contatto) => (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {lead.nome} {lead.cognome}
          </p>
          {lead.fonte_lead && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Fonte: {lead.fonte_lead}
            </p>
          )}
        </div>
        {lead.esito_lead && lead.esito_lead !== 'in_corso' && (
          <EsitoBadge esito={lead.esito_lead} tipo="lead" />
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {lead.email && (
          <div className="flex items-center gap-1 truncate">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {lead.valore_stimato && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs font-medium text-green-600">
            {formatCurrency(lead.valore_stimato)}
          </p>
        </div>
      )}
    </Card>
  )

  return (
    <KanbanBoard
      columns={columns}
      renderCard={renderLeadCard}
      onCardClick={(lead) => onLeadClick(lead.id)}
    />
  )
}
