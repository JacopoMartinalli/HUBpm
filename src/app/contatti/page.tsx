'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared'
import { usePartnerList } from '@/lib/hooks'
import type { Contatto } from '@/types/database'
import { TIPI_PARTNER } from '@/constants'
import { ContattoDialog } from './components/contatto-dialog'

// Colori avatar per tipo partner
const AVATAR_COLORS: Record<string, string> = {
  pulizie: 'bg-cyan-100 text-cyan-700',
  manutenzione: 'bg-orange-100 text-orange-700',
  elettricista: 'bg-yellow-100 text-yellow-700',
  idraulico: 'bg-blue-100 text-blue-700',
  fotografo: 'bg-pink-100 text-pink-700',
  commercialista: 'bg-emerald-100 text-emerald-700',
  avvocato: 'bg-violet-100 text-violet-700',
  notaio: 'bg-amber-100 text-amber-700',
  altro: 'bg-gray-100 text-gray-700',
}

function getInitials(contatto: Contatto): string {
  const n = contatto.nome?.[0] || ''
  const c = contatto.cognome?.[0] || ''
  return (n + c).toUpperCase() || '?'
}

function ContattoCard({ contatto, onClick }: { contatto: Contatto; onClick: () => void }) {
  const tipo = TIPI_PARTNER.find((t) => t.id === contatto.tipo_partner)
  const colorClass = AVATAR_COLORS[contatto.tipo_partner || 'altro'] || AVATAR_COLORS.altro

  return (
    <button
      type="button"
      className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg border bg-card hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <div className={`flex items-center justify-center h-10 w-10 rounded-full text-sm font-semibold flex-shrink-0 ${colorClass}`}>
        {getInitials(contatto)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {contatto.nome} {contatto.cognome}
        </p>
        {contatto.azienda && (
          <p className="text-xs text-muted-foreground truncate">{contatto.azienda}</p>
        )}
      </div>
      {tipo && (
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {tipo.icon} {tipo.label}
        </Badge>
      )}
    </button>
  )
}

function GruppoContatti({
  tipoId,
  contatti,
  onClickContatto,
}: {
  tipoId: string
  contatti: Contatto[]
  onClickContatto: (id: string) => void
}) {
  const tipo = TIPI_PARTNER.find((t) => t.id === tipoId)
  if (!tipo || contatti.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">{tipo.icon}</span>
        <h3 className="text-sm font-semibold text-muted-foreground">{tipo.label}</h3>
        <span className="text-xs text-muted-foreground">({contatti.length})</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {contatti.map((c) => (
          <ContattoCard key={c.id} contatto={c} onClick={() => onClickContatto(c.id)} />
        ))}
      </div>
    </div>
  )
}

export default function ContattiPage() {
  const router = useRouter()
  const { data: contatti, isLoading } = usePartnerList()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('tutti')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContatto, setEditingContatto] = useState<Contatto | null>(null)

  const filtered = useMemo(() => {
    if (!contatti) return []
    let list = contatti
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.nome?.toLowerCase().includes(q) ||
          c.cognome?.toLowerCase().includes(q) ||
          c.azienda?.toLowerCase().includes(q) ||
          c.specializzazioni?.toLowerCase().includes(q)
      )
    }
    if (activeTab !== 'tutti') {
      list = list.filter((c) => c.tipo_partner === activeTab)
    }
    return list
  }, [contatti, search, activeTab])

  // Raggruppa per tipo_partner
  const grouped = useMemo(() => {
    const groups: Record<string, Contatto[]> = {}
    for (const c of filtered) {
      const key = c.tipo_partner || 'altro'
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    }
    return groups
  }, [filtered])

  const handleClick = (id: string) => {
    router.push(`/contatti/${id}`)
  }

  const handleNew = () => {
    setEditingContatto(null)
    setDialogOpen(true)
  }

  // Tab con conteggio per categoria (solo quelle con contatti)
  const tabCounts = useMemo(() => {
    if (!contatti) return {}
    const counts: Record<string, number> = {}
    for (const c of contatti) {
      const key = c.tipo_partner || 'altro'
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [contatti])

  const activeTabs = TIPI_PARTNER.filter((t) => (tabCounts[t.id] || 0) > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatti"
        description="Rubrica collaboratori, fornitori e team operativi"
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Contatto
          </Button>
        }
      />

      {/* Ricerca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome, azienda..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner />
        </div>
      ) : !contatti || contatti.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun contatto"
          description="Aggiungi collaboratori, fornitori e team operativi per le tue proprietà."
          action={
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Contatto
            </Button>
          }
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="tutti" className="text-xs">
              Tutti ({contatti.length})
            </TabsTrigger>
            {activeTabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs">
                {t.icon} {t.label} ({tabCounts[t.id]})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nessun risultato"
                description={search ? 'Prova a modificare i criteri di ricerca.' : 'Nessun contatto in questa categoria.'}
              />
            ) : activeTab === 'tutti' ? (
              /* Vista raggruppata */
              <div className="space-y-6">
                {TIPI_PARTNER.map((tipo) => (
                  <GruppoContatti
                    key={tipo.id}
                    tipoId={tipo.id}
                    contatti={grouped[tipo.id] || []}
                    onClickContatto={handleClick}
                  />
                ))}
              </div>
            ) : (
              /* Vista filtrata per tipo */
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <ContattoCard key={c.id} contatto={c} onClick={() => handleClick(c.id)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <ContattoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contatto={editingContatto}
        onClose={() => {
          setDialogOpen(false)
          setEditingContatto(null)
        }}
      />
    </div>
  )
}
