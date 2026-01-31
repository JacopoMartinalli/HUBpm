'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Shield, Check, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, Column, ConfirmDialog } from '@/components/shared'
import { FotoProprietaGallery } from '@/components/shared/foto-proprieta-gallery'
import { LocaleDialog, AssetDialog } from '@/components/proprieta/dialogs'
import { formatCurrency } from '@/lib/utils'
import { TIPI_LOCALE, CATEGORIE_ASSET, STATI_ASSET } from '@/constants'
import { useDeleteLocale, useDeleteAsset } from '@/lib/hooks'
import type { Locale, Asset, Proprieta } from '@/types/database'

interface StrutturaSectionProps {
  proprietaId: string
  locali: Locale[] | undefined
  asset: Asset[] | undefined
  proprieta?: Proprieta
  onUpdateProprieta?: (data: any) => void
  onRefresh?: () => void
}

export function StrutturaSection({ proprietaId, locali, asset, proprieta, onUpdateProprieta, onRefresh }: StrutturaSectionProps) {
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

      {/* Sicurezza */}
      {proprieta && onUpdateProprieta && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sicurezza e Conformità
            </CardTitle>
            <CardDescription>Dispositivi di sicurezza obbligatori per legge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Estintore */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id="estintore"
                  checked={proprieta.sicurezza_estintore}
                  onCheckedChange={(checked) =>
                    onUpdateProprieta({ id: proprietaId, sicurezza_estintore: !!checked })
                  }
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="estintore" className="font-medium cursor-pointer">
                    Estintore
                  </Label>
                  {proprieta.sicurezza_estintore && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Scadenza:</span>
                      <Input
                        type="date"
                        className="h-7 text-xs w-36"
                        value={proprieta.sicurezza_estintore_scadenza || ''}
                        onChange={(e) =>
                          onUpdateProprieta({
                            id: proprietaId,
                            sicurezza_estintore_scadenza: e.target.value || null,
                          })
                        }
                      />
                      {proprieta.sicurezza_estintore_scadenza &&
                        new Date(proprieta.sicurezza_estintore_scadenza) < new Date() && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Scaduto
                          </Badge>
                        )}
                    </div>
                  )}
                </div>
                {proprieta.sicurezza_estintore ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Targhetta */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id="targhetta"
                  checked={proprieta.sicurezza_targhetta}
                  onCheckedChange={(checked) =>
                    onUpdateProprieta({ id: proprietaId, sicurezza_targhetta: !!checked })
                  }
                />
                <Label htmlFor="targhetta" className="flex-1 font-medium cursor-pointer">
                  Targhetta Espositiva
                </Label>
                {proprieta.sicurezza_targhetta ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Rilevatore Gas */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id="rilevatore_gas"
                  checked={proprieta.sicurezza_rilevatore_gas}
                  disabled={!proprieta.sicurezza_rilevatore_gas_necessario}
                  onCheckedChange={(checked) =>
                    onUpdateProprieta({ id: proprietaId, sicurezza_rilevatore_gas: !!checked })
                  }
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="rilevatore_gas"
                    className={`font-medium cursor-pointer ${!proprieta.sicurezza_rilevatore_gas_necessario ? 'text-muted-foreground' : ''}`}
                  >
                    Rilevatore Gas
                  </Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="gas_non_necessario"
                      checked={!proprieta.sicurezza_rilevatore_gas_necessario}
                      onCheckedChange={(checked) =>
                        onUpdateProprieta({
                          id: proprietaId,
                          sicurezza_rilevatore_gas_necessario: !checked,
                          sicurezza_rilevatore_gas: checked ? false : proprieta.sicurezza_rilevatore_gas,
                        })
                      }
                    />
                    <Label htmlFor="gas_non_necessario" className="text-xs text-muted-foreground cursor-pointer">
                      Non necessario (no gas)
                    </Label>
                  </div>
                </div>
                {!proprieta.sicurezza_rilevatore_gas_necessario ? (
                  <Badge variant="secondary" className="text-xs">N/A</Badge>
                ) : proprieta.sicurezza_rilevatore_gas ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Rilevatore Monossido */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id="rilevatore_monossido"
                  checked={proprieta.sicurezza_rilevatore_monossido}
                  onCheckedChange={(checked) =>
                    onUpdateProprieta({ id: proprietaId, sicurezza_rilevatore_monossido: !!checked })
                  }
                />
                <Label htmlFor="rilevatore_monossido" className="flex-1 font-medium cursor-pointer">
                  Rilevatore Monossido CO
                </Label>
                {proprieta.sicurezza_rilevatore_monossido ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Cassetta Pronto Soccorso */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id="cassetta_ps"
                  checked={proprieta.sicurezza_cassetta_ps}
                  onCheckedChange={(checked) =>
                    onUpdateProprieta({ id: proprietaId, sicurezza_cassetta_ps: !!checked })
                  }
                />
                <Label htmlFor="cassetta_ps" className="flex-1 font-medium cursor-pointer">
                  Cassetta Pronto Soccorso
                </Label>
                {proprieta.sicurezza_cassetta_ps ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Riepilogo conformità */}
            {(() => {
              const items = [
                { ok: proprieta.sicurezza_estintore, label: 'Estintore' },
                { ok: proprieta.sicurezza_targhetta, label: 'Targhetta' },
                { ok: !proprieta.sicurezza_rilevatore_gas_necessario || proprieta.sicurezza_rilevatore_gas, label: 'Rilevatore Gas' },
                { ok: proprieta.sicurezza_rilevatore_monossido, label: 'Rilevatore CO' },
                { ok: proprieta.sicurezza_cassetta_ps, label: 'Cassetta PS' },
              ]
              const completati = items.filter(i => i.ok).length
              const totale = items.length
              const percentuale = Math.round((completati / totale) * 100)

              return (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${percentuale === 100 ? 'bg-green-500' : percentuale >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${percentuale}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {completati}/{totale} conformi
                    </span>
                  </div>
                  {percentuale === 100 && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                      <Check className="h-3 w-3" />
                      Conforme
                    </Badge>
                  )}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

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
