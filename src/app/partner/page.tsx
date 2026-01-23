'use client'

import { useRouter } from 'next/navigation'
import { Plus, Phone, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, DataTable, Column } from '@/components/shared'
import { usePartnerList } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'
import type { Contatto } from '@/types/database'
import { TIPI_PARTNER, TIPI_TARIFFA } from '@/constants'

export default function PartnerPage() {
  const router = useRouter()
  const { data: partner, isLoading } = usePartnerList()

  const handleClick = (id: string) => {
    router.push(`/partner/${id}`)
  }

  const columns: Column<Contatto>[] = [
    {
      key: 'nome',
      header: 'Partner',
      cell: (p) => (
        <div>
          <p className="font-medium">{p.nome} {p.cognome}</p>
          {p.azienda && <p className="text-xs text-muted-foreground">{p.azienda}</p>}
        </div>
      ),
    },
    {
      key: 'tipo_partner',
      header: 'Tipo',
      cell: (p) => {
        const tipo = TIPI_PARTNER.find(t => t.id === p.tipo_partner)
        return <Badge variant="outline">{tipo?.label || p.tipo_partner}</Badge>
      },
    },
    {
      key: 'contatti',
      header: 'Contatti',
      cell: (p) => (
        <div className="space-y-1">
          {p.telefono && (
            <p className="text-xs flex items-center gap-1">
              <Phone className="h-3 w-3" /> {p.telefono}
            </p>
          )}
          {p.email && (
            <p className="text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" /> {p.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'specializzazioni',
      header: 'Specializzazioni',
      cell: (p) => p.specializzazioni || '-',
    },
    {
      key: 'tariffa',
      header: 'Tariffa',
      cell: (p) => {
        if (!p.tariffa_default) return '-'
        const tipo = TIPI_TARIFFA.find(t => t.id === p.tariffa_tipo)
        return `${formatCurrency(p.tariffa_default)} ${tipo?.label || ''}`
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Partner"
        description="Gestisci i partner per le proprietà (pulizie, manutenzione, etc.)"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Partner
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={partner || []}
        isLoading={isLoading}
        onRowClick={(p) => handleClick(p.id)}
        emptyState={{
          title: 'Nessun partner',
          description: 'Aggiungi i partner che collaborano con le tue proprietà.',
        }}
      />
    </div>
  )
}
