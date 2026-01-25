'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Plus, Home, FileText, Rocket, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, DataTable, Column, FaseBadge } from '@/components/shared'
import { useProprietaList } from '@/lib/hooks'
import { formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Proprieta } from '@/types/database'
import { TIPOLOGIE_PROPRIETA } from '@/constants'

// Definizione delle viste/tab per le proprietà
const VISTE_PROPRIETA = [
  {
    id: 'lead',
    label: 'Lead',
    icon: Home,
    fasi: ['P0'], // Fase iniziale
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: 'Proprietà in fase di acquisizione'
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    icon: FileText,
    fasi: ['P1'], // Setup legale
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    description: 'Documenti e pratiche legali'
  },
  {
    id: 'avvio',
    label: 'Avvio',
    icon: Rocket,
    fasi: ['P2', 'P3'], // Setup operativo + Go-live
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    description: 'Setup operativo e lancio'
  },
  {
    id: 'live',
    label: 'Live',
    icon: Radio,
    fasi: ['P4'], // Operativa
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    description: 'Proprietà attive'
  },
] as const

type VistaId = typeof VISTE_PROPRIETA[number]['id']

export default function ProprietaPage() {
  const router = useRouter()
  const { data: proprieta, isLoading } = useProprietaList()
  const [vistaAttiva, setVistaAttiva] = useState<VistaId>('live')

  // Filtra proprietà per vista attiva
  const proprietaFiltrate = useMemo(() => {
    if (!proprieta) return []
    const vista = VISTE_PROPRIETA.find(v => v.id === vistaAttiva)
    if (!vista) return proprieta
    return proprieta.filter(p => vista.fasi.includes(p.fase as any))
  }, [proprieta, vistaAttiva])

  // Conta proprietà per ogni vista
  const conteggiPerVista = useMemo(() => {
    if (!proprieta) return {}
    return VISTE_PROPRIETA.reduce((acc, vista) => {
      acc[vista.id] = proprieta.filter(p => vista.fasi.includes(p.fase as any)).length
      return acc
    }, {} as Record<VistaId, number>)
  }, [proprieta])

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

  const vistaCorrente = VISTE_PROPRIETA.find(v => v.id === vistaAttiva)

  return (
    <div>
      <PageHeader
        title="Proprietà"
        description="Gestisci le proprietà sotto gestione"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Proprietà
          </Button>
        }
      />

      {/* Tab delle viste */}
      <div className="flex gap-2 mb-6">
        {VISTE_PROPRIETA.map((vista) => {
          const Icon = vista.icon
          const isActive = vistaAttiva === vista.id
          const count = conteggiPerVista[vista.id] || 0

          return (
            <button
              key={vista.id}
              onClick={() => setVistaAttiva(vista.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all',
                isActive
                  ? `${vista.bgColor} ${vista.borderColor} ${vista.color}`
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{vista.label}</span>
              <span className={cn(
                'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                isActive
                  ? 'bg-white/50'
                  : 'bg-gray-100'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Descrizione vista corrente */}
      {vistaCorrente && (
        <p className="text-sm text-muted-foreground mb-4">
          {vistaCorrente.description}
        </p>
      )}

      <DataTable
        columns={columns}
        data={proprietaFiltrate}
        isLoading={isLoading}
        onRowClick={(prop) => handleClick(prop.id)}
        emptyState={{
          title: `Nessuna proprietà in ${vistaCorrente?.label || 'questa fase'}`,
          description: vistaAttiva === 'lead'
            ? 'Le proprietà vengono create dalla conferma delle proprietà lead.'
            : `Non ci sono proprietà nella fase "${vistaCorrente?.label}".`,
        }}
      />
    </div>
  )
}
