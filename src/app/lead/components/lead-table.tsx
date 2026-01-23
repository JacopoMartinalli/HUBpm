'use client'

import { DataTable, Column, FaseBadge, EsitoBadge } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Contatto } from '@/types/database'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LeadTableProps {
  leads: Contatto[]
  isLoading: boolean
  onLeadClick: (leadId: string) => void
}

export function LeadTable({ leads, isLoading, onLeadClick }: LeadTableProps) {
  const columns: Column<Contatto>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (lead) => (
        <div>
          <p className="font-medium">{lead.nome} {lead.cognome}</p>
          {lead.email && (
            <p className="text-xs text-muted-foreground">{lead.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'telefono',
      header: 'Telefono',
      cell: (lead) => lead.telefono || '-',
    },
    {
      key: 'fonte',
      header: 'Fonte',
      cell: (lead) => lead.fonte_lead || '-',
    },
    {
      key: 'fase',
      header: 'Fase',
      cell: (lead) => (
        <FaseBadge fase={lead.fase_lead || 'L0'} tipo="lead" />
      ),
    },
    {
      key: 'esito',
      header: 'Esito',
      cell: (lead) =>
        lead.esito_lead ? (
          <EsitoBadge esito={lead.esito_lead} tipo="lead" />
        ) : (
          '-'
        ),
    },
    {
      key: 'valore',
      header: 'Valore Stimato',
      cell: (lead) =>
        lead.valore_stimato ? formatCurrency(lead.valore_stimato) : '-',
      className: 'text-right',
    },
    {
      key: 'created_at',
      header: 'Data Creazione',
      cell: (lead) => formatDate(lead.created_at),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={leads}
      isLoading={isLoading}
      onRowClick={(lead) => onLeadClick(lead.id)}
      emptyState={{
        title: 'Nessun lead trovato',
        description: 'Inizia aggiungendo il primo lead alla pipeline.',
        action: (
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Aggiungi Lead
          </Button>
        ),
      }}
    />
  )
}
