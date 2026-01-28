'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column, ConfirmDialog } from '@/components/shared'
import { FotoProprietaGallery } from '@/components/shared/foto-proprieta-gallery'
import { LocaleDialog, AssetDialog } from '@/components/proprieta/dialogs'
import { formatCurrency } from '@/lib/utils'
import { TIPI_LOCALE, CATEGORIE_ASSET, STATI_ASSET } from '@/constants'
import { useDeleteLocale, useDeleteAsset } from '@/lib/hooks'
import type { Locale, Asset } from '@/types/database'

interface StrutturaSectionProps {
  proprietaId: string
  locali: Locale[] | undefined
  asset: Asset[] | undefined
  onRefresh?: () => void
}

export function StrutturaSection({ proprietaId, locali, asset, onRefresh }: StrutturaSectionProps) {
  const [localeDialogOpen, setLocaleDialogOpen] = useState(false)
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null)
  const [deleteLocaleId, setDeleteLocaleId] = useState<string | null>(null)

  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null)

  const deleteLocaleMutation = useDeleteLocale()
  const deleteAssetMutation = useDeleteAsset()

  const handleEditLocale = (locale: Locale) => {
    setSelectedLocale(locale)
    setLocaleDialogOpen(true)
  }

  const handleDeleteLocale = async () => {
    if (!deleteLocaleId) return
    await deleteLocaleMutation.mutateAsync({ id: deleteLocaleId, proprietaId })
    setDeleteLocaleId(null)
  }

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setAssetDialogOpen(true)
  }

  const handleDeleteAsset = async () => {
    if (!deleteAssetId) return
    await deleteAssetMutation.mutateAsync({ id: deleteAssetId, proprietaId })
    setDeleteAssetId(null)
  }

  const localiColumns: Column<Locale>[] = [
    { key: 'nome', header: 'Nome', cell: (l) => l.nome },
    { key: 'tipo', header: 'Tipo', cell: (l) => TIPI_LOCALE.find(t => t.id === l.tipo)?.label || l.tipo },
    { key: 'mq', header: 'Superficie', cell: (l) => l.mq ? `${l.mq} mq` : '-' },
    { key: 'posti_letto', header: 'Posti Letto', cell: (l) => l.posti_letto || '-' },
    { key: 'dotazioni', header: 'Dotazioni', cell: (l) => l.dotazioni ? <span className="text-xs text-muted-foreground line-clamp-2">{l.dotazioni}</span> : '-' },
    {
      key: 'azioni',
      header: '',
      cell: (l) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditLocale(l)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteLocaleId(l.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
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
    { key: 'quantita', header: 'Qtà', cell: (a) => a.quantita },
    {
      key: 'stato', header: 'Stato', cell: (a) => {
        const stato = STATI_ASSET.find(s => s.id === a.stato)
        return <Badge variant={a.stato === 'nuovo' ? 'default' : a.stato === 'da_sostituire' ? 'destructive' : 'secondary'}>{stato?.label || a.stato}</Badge>
      },
    },
    { key: 'costo', header: 'Costo', cell: (a) => a.costo ? formatCurrency(a.costo) : '-' },
    {
      key: 'azioni',
      header: '',
      cell: (a) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAsset(a)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteAssetId(a.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]
  return (
    <div className="space-y-6">
      {/* Locali */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Locali</CardTitle>
            <CardDescription>Gestisci i locali della proprietà</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setSelectedLocale(null); setLocaleDialogOpen(true); }}>
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
          <Button size="sm" onClick={() => { setSelectedAsset(null); setAssetDialogOpen(true); }}>
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

      {/* Dialoghi */}
      <LocaleDialog
        open={localeDialogOpen}
        onOpenChange={(open) => {
          setLocaleDialogOpen(open)
          if (!open) setSelectedLocale(null)
        }}
        proprietaId={proprietaId}
        locale={selectedLocale}
        onSuccess={onRefresh}
      />

      <AssetDialog
        open={assetDialogOpen}
        onOpenChange={(open) => {
          setAssetDialogOpen(open)
          if (!open) setSelectedAsset(null)
        }}
        proprietaId={proprietaId}
        asset={selectedAsset}
        onSuccess={onRefresh}
      />

      {/* Conferme eliminazione */}
      <ConfirmDialog
        open={!!deleteLocaleId}
        onOpenChange={(open) => !open && setDeleteLocaleId(null)}
        title="Elimina Locale"
        description="Sei sicuro di voler eliminare questo locale? Gli asset associati non verranno eliminati ma perderanno il riferimento al locale."
        confirmText="Elimina"
        onConfirm={handleDeleteLocale}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deleteAssetId}
        onOpenChange={(open) => !open && setDeleteAssetId(null)}
        title="Elimina Asset"
        description="Sei sicuro di voler eliminare questo asset dall'inventario?"
        confirmText="Elimina"
        onConfirm={handleDeleteAsset}
        variant="destructive"
      />
    </div>
  )
}
