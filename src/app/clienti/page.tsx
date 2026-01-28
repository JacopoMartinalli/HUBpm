'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, DataTable, Column } from '@/components/shared'
import { useClientiConProprieta } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'
import type { ClienteConProprieta } from '@/lib/hooks/use-contatti'

const TABS = [
  { id: 'tutti', label: 'Tutti' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'avvio', label: 'In Avvio' },
  { id: 'online', label: 'Online' },
  { id: 'cessato', label: 'Cessati' },
] as const

function ProprietaBadges({ cliente }: { cliente: ClienteConProprieta }) {
  const badges = []
  if (cliente.proprieta_online > 0)
    badges.push({ label: `${cliente.proprieta_online} online`, className: 'bg-green-100 text-green-700 border-0' })
  if (cliente.proprieta_avvio > 0)
    badges.push({ label: `${cliente.proprieta_avvio} in avvio`, className: 'bg-blue-100 text-blue-700 border-0' })
  if (cliente.proprieta_onboarding > 0)
    badges.push({ label: `${cliente.proprieta_onboarding} onboarding`, className: 'bg-amber-100 text-amber-700 border-0' })
  if (cliente.proprieta_cessate > 0)
    badges.push({ label: `${cliente.proprieta_cessate} cessate`, className: 'bg-gray-100 text-gray-500 border-0' })

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      {badges.length > 0 ? (
        badges.map((b) => (
          <Badge key={b.label} variant="outline" className={`text-xs ${b.className}`}>
            {b.label}
          </Badge>
        ))
      ) : (
        <span className="text-sm text-muted-foreground">Nessuna proprietà</span>
      )}
    </div>
  )
}

export default function ClientiPage() {
  const router = useRouter()
  const { data: clienti, isLoading } = useClientiConProprieta()
  const [activeTab, setActiveTab] = useState<string>('tutti')

  const filtered = useMemo(() => {
    if (!clienti) return []
    if (activeTab === 'tutti') return clienti
    return clienti.filter((c) => c.gruppo_cliente === activeTab)
  }, [clienti, activeTab])

  const counts = useMemo(() => {
    if (!clienti) return {} as Record<string, number>
    const c: Record<string, number> = { tutti: clienti.length }
    for (const cl of clienti) {
      c[cl.gruppo_cliente] = (c[cl.gruppo_cliente] || 0) + 1
    }
    return c
  }, [clienti])

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
        cliente.tipo_persona === 'persona_giuridica' ? (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-0">
            <Briefcase className="h-3 w-3 mr-1" />
            Società
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-0">
            <Users className="h-3 w-3 mr-1" />
            Persona fisica
          </Badge>
        )
      ),
    },
    {
      key: 'proprieta',
      header: 'Proprietà',
      cell: (cliente) => <ProprietaBadges cliente={cliente} />,
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

  return (
    <div className="space-y-6">
      <PageHeader title="Clienti" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
              {tab.label}
              {counts[tab.id] != null && (
                <span className="ml-1.5 text-muted-foreground">({counts[tab.id]})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            onRowClick={(cliente) => router.push(`/clienti/${cliente.id}`)}
            emptyState={{
              title: 'Nessun cliente',
              description: activeTab === 'tutti'
                ? 'I clienti appariranno qui una volta convertiti da lead.'
                : `Nessun cliente in fase "${TABS.find(t => t.id === activeTab)?.label}".`,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
