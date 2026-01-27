'use client'

import { useRouter } from 'next/navigation'
import { Building2, Users, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader, DataTable, Column } from '@/components/shared'
import { useClienti, useClientiConProprieta } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'
import type { Contatto } from '@/types/database'

// Tipo esteso per clienti con conteggio proprietà
interface ClienteConProprieta extends Contatto {
  proprieta_count?: number
  proprieta_operative?: number
}

export default function ClientiPage() {
  const router = useRouter()
  // Clienti espliciti (tipo = 'cliente')
  const { data: clientiEspliciti, isLoading: loadingEspliciti } = useClienti()
  // Clienti derivati (lead/contatti con proprietà in P3+)
  const { data: clientiDerivati, isLoading: loadingDerivati } = useClientiConProprieta()

  // Combina i clienti, evitando duplicati
  const clientiEsplicitiIds = new Set((clientiEspliciti || []).map(c => c.id))
  const tuttiClienti: ClienteConProprieta[] = [
    ...(clientiEspliciti || []),
    ...(clientiDerivati || []).filter(c => !clientiEsplicitiIds.has(c.id)),
  ]

  const handleClick = (id: string) => {
    // Vai alla pagina lead/cliente appropriata
    const cliente = tuttiClienti.find(c => c.id === id)
    if (cliente?.tipo === 'lead') {
      router.push(`/lead/${id}`)
    } else {
      router.push(`/clienti/${id}`)
    }
  }

  const columns: Column<ClienteConProprieta>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (cliente) => (
        <div>
          <p className="font-medium">
            {cliente.ragione_sociale || `${cliente.nome} ${cliente.cognome}`}
          </p>
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
      key: 'tipo',
      header: 'Tipo',
      cell: (cliente) => (
        <div className="flex items-center gap-2">
          {cliente.tipo_persona === 'persona_giuridica' ? (
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-0">
              <Briefcase className="h-3 w-3 mr-1" />
              Società
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-0">
              <Users className="h-3 w-3 mr-1" />
              Persona fisica
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'proprieta',
      header: 'Proprietà',
      cell: (cliente) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{cliente.proprieta_operative || 0} operative</span>
          {cliente.proprieta_count && cliente.proprieta_count > (cliente.proprieta_operative || 0) && (
            <span className="text-muted-foreground">
              / {cliente.proprieta_count} totali
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'data_conversione',
      header: 'Data',
      cell: (cliente) =>
        cliente.data_conversione
          ? formatDate(cliente.data_conversione)
          : formatDate(cliente.created_at),
    },
  ]

  const isLoading = loadingEspliciti || loadingDerivati

  return (
    <div>
      <PageHeader
        title="Clienti"
      />

      <DataTable
        columns={columns}
        data={tuttiClienti}
        isLoading={isLoading}
        onRowClick={(cliente) => handleClick(cliente.id)}
        emptyState={{
          title: 'Nessun cliente',
          description: 'I clienti appaiono qui quando hanno almeno una proprietà in fase operativa (P3+).',
        }}
      />
    </div>
  )
}
