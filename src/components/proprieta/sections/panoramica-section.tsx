'use client'

import { Building2, Home, Bed, Bath, Square, Users, ClipboardCheck, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FaseBadge } from '@/components/shared'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { FASI_PROPRIETA, TIPOLOGIE_PROPRIETA, STATI_SOPRALLUOGO } from '@/constants'
import type { Proprieta } from '@/types/database'

interface PanoramicaSectionProps {
  proprieta: Proprieta
  id: string
  onUpdateProprieta: (data: any) => void
}

export function PanoramicaSection({ proprieta, id, onUpdateProprieta }: PanoramicaSectionProps) {
  const faseInfo = FASI_PROPRIETA.find(f => f.id === proprieta.fase)
  const tipologiaLabel = TIPOLOGIE_PROPRIETA.find(t => t.id === proprieta.tipologia)?.label || proprieta.tipologia

  return (
    <div className="space-y-6">
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
                          onUpdateProprieta({
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
                        onClick={() => onUpdateProprieta({ id, stato_sopralluogo: 'effettuato' })}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Sopralluogo effettuato
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateProprieta({ id, stato_sopralluogo: 'da_programmare', data_sopralluogo: null })}
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
                      onChange={(e) => onUpdateProprieta({ id, note_sopralluogo: e.target.value || null })}
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
    </div>
  )
}
