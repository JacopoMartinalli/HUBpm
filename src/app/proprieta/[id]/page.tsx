'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, Users, Bed, Bath, Square, Wifi, Key, Calendar, Edit, Trash2, Plus, Home, Package, Boxes, FileText, ShieldCheck, Camera, ClipboardCheck, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner, FaseBadge, ConfirmDialog, PageHeader, DataTable, Column, DocumentiList } from '@/components/shared'
import { FotoProprietaGallery } from '@/components/shared/foto-proprieta-gallery'
import { ErogazioneProprietaView } from '@/components/erogazione'
import { PipelineProprietaCard } from '@/components/proprieta'
import { ProposteProprietaView } from '@/components/proposte'
import { useProprieta, useUpdateProprieta, useDeleteProprieta, useLocaliByProprieta, useAssetByProprieta, useCambioFase, useErogazionePacchettiByProprieta } from '@/lib/hooks'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { FASI_PROPRIETA, TIPOLOGIE_PROPRIETA, TIPI_LOCALE, CATEGORIE_ASSET, STATI_ASSET, STATI_SOPRALLUOGO } from '@/constants'
import type { Locale, Asset } from '@/types/database'
import { useState } from 'react'

export default function ProprietaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: proprieta, isLoading } = useProprieta(id)
  const { mutate: updateProprieta } = useUpdateProprieta()
  const { mutate: deleteProprieta } = useDeleteProprieta()
  const { data: locali } = useLocaliByProprieta(id)
  const { data: asset } = useAssetByProprieta(id)
  const cambioFase = useCambioFase()
  const { data: erogazioni } = useErogazionePacchettiByProprieta(id)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [faseError, setFaseError] = useState<string | null>(null)

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!proprieta) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Proprietà non trovata</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Torna indietro
        </Button>
      </div>
    )
  }

  const faseInfo = FASI_PROPRIETA.find(f => f.id === proprieta.fase)
  const tipologiaLabel = TIPOLOGIE_PROPRIETA.find(t => t.id === proprieta.tipologia)?.label || proprieta.tipologia

  const handleDelete = () => {
    deleteProprieta(id, {
      onSuccess: () => router.push('/proprieta'),
    })
  }

  const handleFaseChange = async (newFase: string) => {
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'proprieta',
        faseCorrente: proprieta.fase,
        nuovaFase: newFase as typeof proprieta.fase,
        entityId: id,
        contattoId: proprieta.contatto_id,
      })
    } catch (error) {
      if (error instanceof Error) {
        setFaseError(error.message)
      }
    }
  }

  const localiColumns: Column<Locale>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (locale) => locale.nome,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (locale) => TIPI_LOCALE.find(t => t.id === locale.tipo)?.label || locale.tipo,
    },
    {
      key: 'mq',
      header: 'Superficie',
      cell: (locale) => locale.mq ? `${locale.mq} mq` : '-',
    },
    {
      key: 'posti_letto',
      header: 'Posti Letto',
      cell: (locale) => locale.posti_letto || '-',
    },
  ]

  const assetColumns: Column<Asset>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (a) => (
        <div>
          <p className="font-medium">{a.nome}</p>
          {a.locale && <p className="text-xs text-muted-foreground">{a.locale.nome}</p>}
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      cell: (a) => CATEGORIE_ASSET.find(c => c.id === a.categoria)?.label || a.categoria,
    },
    {
      key: 'quantita',
      header: 'Quantità',
      cell: (a) => a.quantita,
    },
    {
      key: 'stato',
      header: 'Stato',
      cell: (a) => {
        const stato = STATI_ASSET.find(s => s.id === a.stato)
        return <Badge variant={a.stato === 'nuovo' ? 'default' : a.stato === 'da_sostituire' ? 'destructive' : 'secondary'}>{stato?.label || a.stato}</Badge>
      },
    },
    {
      key: 'costo',
      header: 'Costo',
      cell: (a) => a.costo ? formatCurrency(a.costo) : '-',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{proprieta.nome}</h1>
            <Badge variant="outline">{tipologiaLabel}</Badge>
            <FaseBadge fase={proprieta.fase} tipo="proprieta" />
          </div>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {proprieta.indirizzo}, {proprieta.citta}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Pipeline Progress */}
      <PipelineProprietaCard
        faseCorrente={proprieta.fase}
        proprietaId={id}
        onCambioFase={(nuovaFase) => handleFaseChange(nuovaFase)}
        isCambioFaseLoading={cambioFase.isPending}
        pacchettiAttivi={erogazioni?.map(e => e.pacchetto?.nome || '') || []}
        onNavigateToServizi={() => setActiveTab(proprieta.fase === 'P1' ? 'proposte' : 'servizi')}
      />

      {faseError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Impossibile cambiare fase</AlertTitle>
          <AlertDescription>{faseError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          <TabsTrigger value="proposte" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Proposte
          </TabsTrigger>
          <TabsTrigger value="servizi" className="flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5" />
            Servizi
          </TabsTrigger>
          <TabsTrigger value="locali">Locali ({locali?.length || 0})</TabsTrigger>
          <TabsTrigger value="asset">Asset ({asset?.length || 0})</TabsTrigger>
          <TabsTrigger value="foto" className="flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" />
            Foto
          </TabsTrigger>
          <TabsTrigger value="operativo">Operativo</TabsTrigger>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Dati Generali */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dati Generali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipologia</p>
                    <p className="font-medium">{tipologiaLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commissione</p>
                    <p className="font-medium">{formatPercent(proprieta.commissione_percentuale)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Proprietario</p>
                    <p className="font-medium">
                      {proprieta.contatto
                        ? `${proprieta.contatto.nome} ${proprieta.contatto.cognome}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fase</p>
                    <p className="font-medium">{faseInfo?.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dati Strutturali */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dati Strutturali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Max Ospiti</p>
                      <p className="font-medium">{proprieta.max_ospiti || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Locali</p>
                      <p className="font-medium">{proprieta.camere || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bagni</p>
                      <p className="font-medium">{proprieta.bagni || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Superficie</p>
                      <p className="font-medium">{proprieta.mq ? `${proprieta.mq} mq` : '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dati Catastali */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dati Catastali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Foglio</p>
                    <p className="font-medium">{proprieta.foglio || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mappale</p>
                    <p className="font-medium">{proprieta.mappale || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subalterno</p>
                    <p className="font-medium">{proprieta.subalterno || '-'}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{proprieta.categoria_catastale || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rendita</p>
                    <p className="font-medium">
                      {proprieta.rendita_catastale ? formatCurrency(proprieta.rendita_catastale) : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sopralluogo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Sopralluogo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const stato = proprieta.stato_sopralluogo || 'da_programmare'
                  const statoInfo = STATI_SOPRALLUOGO.find(s => s.id === stato)
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge className={statoInfo?.color || ''}>{statoInfo?.label || stato}</Badge>
                        {proprieta.data_sopralluogo && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(proprieta.data_sopralluogo).toLocaleDateString('it-IT')}
                          </span>
                        )}
                      </div>

                      {stato === 'da_programmare' && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Data sopralluogo</label>
                          <input
                            type="date"
                            className="block text-sm border rounded px-2 py-1 w-full"
                            value={proprieta.data_sopralluogo || ''}
                            onChange={(e) => {
                              updateProprieta({
                                id,
                                data_sopralluogo: e.target.value || null,
                                stato_sopralluogo: e.target.value ? 'programmato' : 'da_programmare',
                              })
                            }}
                          />
                        </div>
                      )}

                      {stato === 'programmato' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateProprieta({ id, stato_sopralluogo: 'effettuato' })}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Sopralluogo effettuato
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateProprieta({ id, stato_sopralluogo: 'da_programmare', data_sopralluogo: null })}
                          >
                            Annulla
                          </Button>
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-muted-foreground">Note sopralluogo</label>
                        <textarea
                          className="block mt-1 text-sm border rounded px-2 py-1 w-full min-h-[60px] resize-y"
                          value={proprieta.note_sopralluogo || ''}
                          placeholder="Osservazioni dal sopralluogo..."
                          onChange={(e) => updateProprieta({ id, note_sopralluogo: e.target.value || null })}
                        />
                      </div>
                    </>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Codici e Portali */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Codici e Portali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CIR</p>
                    <p className="font-medium font-mono">{proprieta.cir || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CIN</p>
                    <p className="font-medium font-mono">{proprieta.cin || '-'}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${proprieta.alloggiati_web_attivo ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">Alloggiati Web</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${proprieta.ross1000_attivo ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">ISTAT (Ross1000)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="proposte" className="mt-6">
          <ProposteProprietaView
            proprietaId={id}
            contattoId={proprieta.contatto_id}
            proprietaNome={proprieta.nome}
            faseProprieta={proprieta.fase}
          />
        </TabsContent>

        <TabsContent value="servizi" className="mt-6">
          <ErogazioneProprietaView
            proprietaId={id}
            proprietaNome={proprieta.nome}
          />
        </TabsContent>

        <TabsContent value="locali" className="mt-6">
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
                emptyState={{
                  title: 'Nessun locale',
                  description: 'Aggiungi i locali per gestire l\'inventario della proprietà.',
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asset" className="mt-6">
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
                emptyState={{
                  title: 'Nessun asset',
                  description: 'Aggiungi gli asset per tenere traccia dell\'inventario.',
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operativo" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Accesso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Accesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Codice Portone</p>
                  <p className="font-medium font-mono">{proprieta.codice_portone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codice Appartamento</p>
                  <p className="font-medium font-mono">{proprieta.codice_appartamento || '-'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Istruzioni Accesso</p>
                  <p className="text-sm">{proprieta.istruzioni_accesso || 'Nessuna istruzione'}</p>
                </div>
              </CardContent>
            </Card>

            {/* WiFi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Connettività
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">WiFi SSID</p>
                  <p className="font-medium font-mono">{proprieta.wifi_ssid || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WiFi Password</p>
                  <p className="font-medium font-mono">{proprieta.wifi_password || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Check-in/out */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Check-in / Check-out
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Orario Check-in</p>
                    <p className="font-medium">{proprieta.checkin_orario || '15:00'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Orario Check-out</p>
                    <p className="font-medium">{proprieta.checkout_orario || '10:00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Costi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Costi Operativi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Costo Pulizie</p>
                    <p className="font-medium">
                      {proprieta.costo_pulizie ? formatCurrency(proprieta.costo_pulizie) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tassa Soggiorno/persona</p>
                    <p className="font-medium">
                      {proprieta.tassa_soggiorno_persona
                        ? formatCurrency(proprieta.tassa_soggiorno_persona)
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sicurezza */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Sicurezza
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: 'Estintore',
                    checked: proprieta.sicurezza_estintore,
                    field: 'sicurezza_estintore' as const,
                    extra: proprieta.sicurezza_estintore ? (
                      <div className="ml-6 mt-1">
                        <label className="text-xs text-muted-foreground">Scadenza manutenzione</label>
                        <input
                          type="date"
                          className="block mt-0.5 text-sm border rounded px-2 py-1"
                          value={proprieta.sicurezza_estintore_scadenza || ''}
                          onChange={(e) => updateProprieta({ id, sicurezza_estintore_scadenza: e.target.value || null })}
                        />
                        {proprieta.sicurezza_estintore_scadenza && new Date(proprieta.sicurezza_estintore_scadenza) < new Date() && (
                          <p className="text-xs text-red-600 mt-0.5">Manutenzione scaduta</p>
                        )}
                      </div>
                    ) : null,
                  },
                  { label: 'Targhetta espositiva', checked: proprieta.sicurezza_targhetta, field: 'sicurezza_targhetta' as const },
                  {
                    label: 'Rilevatore gas',
                    checked: proprieta.sicurezza_rilevatore_gas,
                    field: 'sicurezza_rilevatore_gas' as const,
                    subtitle: !proprieta.sicurezza_rilevatore_gas_necessario ? '(non necessario)' : undefined,
                  },
                  { label: 'Rilevatore monossido', checked: proprieta.sicurezza_rilevatore_monossido, field: 'sicurezza_rilevatore_monossido' as const },
                  { label: 'Cassetta pronto soccorso', checked: proprieta.sicurezza_cassetta_ps, field: 'sicurezza_cassetta_ps' as const },
                ].map((item) => (
                  <div key={item.field}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked || false}
                        onChange={(e) => updateProprieta({ id, [item.field]: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{item.label}</span>
                      {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                    </label>
                    {item.extra}
                  </div>
                ))}
                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!proprieta.sicurezza_rilevatore_gas_necessario}
                      onChange={(e) => updateProprieta({ id, sicurezza_rilevatore_gas_necessario: !e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-muted-foreground">Rilevatore gas non necessario (no allaccio gas)</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Regole Casa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regole della Casa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {proprieta.regole_casa || 'Nessuna regola specificata'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foto" className="mt-6">
          <FotoProprietaGallery proprietaId={id} />
        </TabsContent>

        <TabsContent value="documenti" className="mt-6">
          <DocumentiList
            tipo="proprieta"
            entityId={id}
            fase={proprieta.fase}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Proprietà"
        description={`Sei sicuro di voler eliminare la proprietà "${proprieta.nome}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
