'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, DataTable, Column, FaseBadge } from '@/components/shared'
import { useClienti } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'
import type { Contatto } from '@/types/database'

export default function ClientiPage() {
  const router = useRouter()
  const { data: clienti, isLoading } = useClienti()

  const handleClick = (id: string) => {
    router.push(`/clienti/${id}`)
  }

  const columns: Column<Contatto>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (cliente) => (
        <div>
          <p className="font-medium">{cliente.nome} {cliente.cognome}</p>
          {cliente.email && (
            <p className="text-xs text-muted-foreground">{cliente.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'telefono',
      header: 'Telefono',
      cell: (cliente) => cliente.telefono || '-',
    },
    {
      key: 'fase',
      header: 'Fase',
      cell: (cliente) => (
        <FaseBadge fase={cliente.fase_cliente || 'C0'} tipo="cliente" />
      ),
    },
    {
      key: 'data_conversione',
      header: 'Data Conversione',
      cell: (cliente) =>
        cliente.data_conversione ? formatDate(cliente.data_conversione) : '-',
    },
    {
      key: 'contratto',
      header: 'Contratto',
      cell: (cliente) => (
        <div className="text-sm">
          {cliente.data_inizio_contratto && (
            <p>Dal: {formatDate(cliente.data_inizio_contratto)}</p>
          )}
          {cliente.data_fine_contratto && (
            <p>Al: {formatDate(cliente.data_fine_contratto)}</p>
          )}
          {!cliente.data_inizio_contratto && '-'}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Clienti"
        description="Gestisci i tuoi clienti con contratto attivo"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Cliente
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={clienti || []}
        isLoading={isLoading}
        onRowClick={(cliente) => handleClick(cliente.id)}
        emptyState={{
          title: 'Nessun cliente',
          description: 'I clienti vengono creati dalla conversione dei lead vinti.',
        }}
      />
    </div>
  )
}
