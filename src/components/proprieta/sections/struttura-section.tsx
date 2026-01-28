'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column } from '@/components/shared'
import { FotoProprietaGallery } from '@/components/shared/foto-proprieta-gallery'
import { formatCurrency } from '@/lib/utils'
import { TIPI_LOCALE, CATEGORIE_ASSET, STATI_ASSET } from '@/constants'
import type { Locale, Asset } from '@/types/database'

interface StrutturaSectionProps {
  proprietaId: string
  locali: Locale[] | undefined
  asset: Asset[] | undefined
}

const localiColumns: Column<Locale>[] = [
  { key: 'nome', header: 'Nome', cell: (l) => l.nome },
  { key: 'tipo', header: 'Tipo', cell: (l) => TIPI_LOCALE.find(t => t.id === l.tipo)?.label || l.tipo },
  { key: 'mq', header: 'Superficie', cell: (l) => l.mq ? `${l.mq} mq` : '-' },
  { key: 'posti_letto', header: 'Posti Letto', cell: (l) => l.posti_letto || '-' },
]

const assetColumns: Column<Asset>[] = [
  {
    key: 'nome', header: 'Nome', cell: (a) => (
      <div>
        <p className="font-medium">{a.nome}</p>
        {a.locale && <p className="text-xs text-muted-foreground">{a.locale.nome}</p>}
      </div>
    ),
  },
  { key: 'categoria', header: 'Categoria', cell: (a) => CATEGORIE_ASSET.find(c => c.id === a.categoria)?.label || a.categoria },
  { key: 'quantita', header: 'Quantità', cell: (a) => a.quantita },
  {
    key: 'stato', header: 'Stato', cell: (a) => {
      const stato = STATI_ASSET.find(s => s.id === a.stato)
      return <Badge variant={a.stato === 'nuovo' ? 'default' : a.stato === 'da_sostituire' ? 'destructive' : 'secondary'}>{stato?.label || a.stato}</Badge>
    },
  },
  { key: 'costo', header: 'Costo', cell: (a) => a.costo ? formatCurrency(a.costo) : '-' },
]

export function StrutturaSection({ proprietaId, locali, asset }: StrutturaSectionProps) {
  return (
    <div className="space-y-6">
      {/* Locali */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Locali</CardTitle>
            <CardDescription>Gestisci i locali della proprietà</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Locale
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={localiColumns}
            data={locali || []}
            emptyState={{ title: 'Nessun locale', description: 'Aggiungi i locali per gestire l\'inventario della proprietà.' }}
          />
        </CardContent>
      </Card>

      {/* Asset */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Asset</CardTitle>
            <CardDescription>Inventario degli asset della proprietà</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Asset
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={assetColumns}
            data={asset || []}
            emptyState={{ title: 'Nessun asset', description: 'Aggiungi gli asset per tenere traccia dell\'inventario.' }}
          />
        </CardContent>
      </Card>

      {/* Foto */}
      <FotoProprietaGallery proprietaId={proprietaId} />
    </div>
  )
}
