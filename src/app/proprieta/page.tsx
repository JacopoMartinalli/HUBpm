'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, DataTable, Column, FaseBadge } from '@/components/shared'
import { useProprietaList } from '@/lib/hooks'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { Proprieta } from '@/types/database'
import { TIPOLOGIE_PROPRIETA } from '@/constants'

export default function ProprietaPage() {
  const router = useRouter()
  const { data: proprieta, isLoading } = useProprietaList()

  const handleClick = (id: string) => {
    router.push(`/proprieta/${id}`)
  }

  const columns: Column<Proprieta>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (prop) => (
        <div>
          <p className="font-medium">{prop.nome}</p>
          <p className="text-xs text-muted-foreground">{prop.indirizzo}</p>
        </div>
      ),
    },
    {
      key: 'citta',
      header: 'Città',
      cell: (prop) => prop.citta,
    },
    {
      key: 'tipologia',
      header: 'Tipologia',
      cell: (prop) => TIPOLOGIE_PROPRIETA.find(t => t.id === prop.tipologia)?.label || prop.tipologia,
    },
    {
      key: 'fase',
      header: 'Fase',
      cell: (prop) => <FaseBadge fase={prop.fase} tipo="proprieta" />,
    },
    {
      key: 'commissione',
      header: 'Commissione',
      cell: (prop) => formatPercent(prop.commissione_percentuale),
    },
    {
      key: 'proprietario',
      header: 'Proprietario',
      cell: (prop) =>
        prop.contatto ? `${prop.contatto.nome} ${prop.contatto.cognome}` : '-',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Proprietà"
        description="Gestisci le proprietà sotto gestione attiva"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Proprietà
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={proprieta || []}
        isLoading={isLoading}
        onRowClick={(prop) => handleClick(prop.id)}
        emptyState={{
          title: 'Nessuna proprietà',
          description: 'Le proprietà vengono create dalla conferma delle proprietà lead.',
        }}
      />
    </div>
  )
}
