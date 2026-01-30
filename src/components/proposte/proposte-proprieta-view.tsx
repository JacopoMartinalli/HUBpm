'use client'

import { useState } from 'react'
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PropostaCard } from './proposta-card'
import { CreaPropostaDialog } from './crea-proposta-dialog'
import { PropostaDetailDialog } from './proposta-detail-dialog'
import { GeneraDocumentoDialog } from '@/components/documenti/GeneraDocumentoDialog'
import {
  useProposteByProprieta,
  useCambiaStatoProposta,
  useAccettaProposta,
  useDeleteProposta
} from '@/lib/hooks'
import { ConfirmDialog } from '@/components/shared'
import type { StatoProposta, PropostaCommerciale } from '@/types/database'

interface ProposteProprietaViewProps {
  proprietaId: string
  contattoId: string
  proprietaNome?: string
  faseProprieta?: string
}

export function ProposteProprietaView({
  proprietaId,
  contattoId,
  proprietaNome,
  faseProprieta
}: ProposteProprietaViewProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deletePropostaId, setDeletePropostaId] = useState<string | null>(null)
  const [accettaPropostaId, setAccettaPropostaId] = useState<string | null>(null)
  const [propostaPerDocumento, setPropostaPerDocumento] = useState<PropostaCommerciale | null>(null)
  const [propostaDetail, setPropostaDetail] = useState<PropostaCommerciale | null>(null)

  const {
    data: proposte,
    isLoading,
    refetch
  } = useProposteByProprieta(proprietaId)

  const cambiaStatoMutation = useCambiaStatoProposta()
  const accettaMutation = useAccettaProposta()
  const deleteMutation = useDeleteProposta()

  const handleCambiaStato = async (id: string, stato: StatoProposta) => {
    // Se accettata, mostra dialog di conferma
    if (stato === 'accettata') {
      setAccettaPropostaId(id)
      return
    }

    try {
      await cambiaStatoMutation.mutateAsync({ id, stato })
    } catch (error) {
      console.error('Errore cambio stato:', error)
    }
  }

  const handleAccettaProposta = async () => {
    if (!accettaPropostaId) return

    try {
      await accettaMutation.mutateAsync({ propostaId: accettaPropostaId })
      setAccettaPropostaId(null)
    } catch (error) {
      console.error('Errore accettazione proposta:', error)
    }
  }

  const handleDeleteProposta = async () => {
    if (!deletePropostaId) return

    try {
      await deleteMutation.mutateAsync({
        id: deletePropostaId,
        proprietaId,
        contattoId
      })
      setDeletePropostaId(null)
    } catch (error) {
      console.error('Errore eliminazione proposta:', error)
    }
  }

  const handleViewProposta = (id: string) => {
    const proposta = proposte?.find(p => p.id === id)
    if (proposta) {
      setPropostaDetail(proposta)
    }
  }

  // Statistiche
  const stats = {
    totale: proposte?.length || 0,
    bozze: proposte?.filter(p => p.stato === 'bozza').length || 0,
    inviate: proposte?.filter(p => p.stato === 'inviata').length || 0,
    accettate: proposte?.filter(p => p.stato === 'accettata').length || 0,
    rifiutate: proposte?.filter(p => p.stato === 'rifiutata').length || 0
  }

  // La proprietà può ricevere proposte solo in fase P1 (onboarding)
  const canCreateProposta = faseProprieta === 'P1'

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Proposte Commerciali
              </CardTitle>
              <CardDescription>
                Gestisci le proposte per {proprietaNome || 'questa proprietà'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Aggiorna
              </Button>
              {canCreateProposta ? (
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuova Proposta
                </Button>
              ) : (
                <Button size="sm" disabled title="Disponibile solo in fase Onboarding (P1)">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuova Proposta
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Info fase */}
        {!canCreateProposta && faseProprieta && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Le proposte commerciali possono essere create solo quando la proprietà è in fase Onboarding (P1).
                {faseProprieta === 'P0' && ' Completa prima la fase Lead.'}
                {(faseProprieta === 'P2' || faseProprieta === 'P3' || faseProprieta === 'P4') && ' La proprietà ha già proposte accettate in erogazione.'}
              </span>
            </div>
          </CardContent>
        )}

        {/* Stats */}
        {stats.totale > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{stats.totale}</div>
                <div className="text-xs text-muted-foreground">Totale</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-2xl font-bold text-gray-600">{stats.bozze}</div>
                <div className="text-xs text-muted-foreground">Bozze</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">{stats.inviate}</div>
                <div className="text-xs text-muted-foreground">Inviate</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">{stats.accettate}</div>
                <div className="text-xs text-muted-foreground">Accettate</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">{stats.rifiutate}</div>
                <div className="text-xs text-muted-foreground">Rifiutate</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista proposte */}
      {!proposte || proposte.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessuna proposta</h3>
            <p className="text-muted-foreground mb-4">
              {canCreateProposta
                ? 'Crea una proposta commerciale per questa proprietà'
                : 'Non ci sono ancora proposte per questa proprietà'
              }
            </p>
            {canCreateProposta && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crea Prima Proposta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {proposte.map((proposta) => (
            <PropostaCard
              key={proposta.id}
              proposta={proposta}
              onView={handleViewProposta}
              onDelete={(id) => setDeletePropostaId(id)}
              onCambiaStato={handleCambiaStato}
              onGeneraDocumento={(p) => setPropostaPerDocumento(p)}
            />
          ))}
        </div>
      )}

      {/* Dialog crea proposta */}
      <CreaPropostaDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        proprietaId={proprietaId}
        contattoId={contattoId}
        onSuccess={(propostaId) => {
          refetch()
        }}
      />

      {/* Dialog conferma eliminazione */}
      <ConfirmDialog
        open={!!deletePropostaId}
        onOpenChange={(open) => !open && setDeletePropostaId(null)}
        title="Elimina Proposta"
        description="Sei sicuro di voler eliminare questa proposta? L'azione non può essere annullata."
        confirmText="Elimina"
        onConfirm={handleDeleteProposta}
        variant="destructive"
      />

      {/* Dialog conferma accettazione */}
      <ConfirmDialog
        open={!!accettaPropostaId}
        onOpenChange={(open) => !open && setAccettaPropostaId(null)}
        title="Accetta Proposta"
        description="Confermi l'accettazione? Verranno create le erogazioni per i pacchetti inclusi e la proprietà passerà in fase Avvio (P2)."
        confirmText="Conferma Accettazione"
        onConfirm={handleAccettaProposta}
      />

      {/* Dialog genera documento */}
      {propostaPerDocumento && (
        <GeneraDocumentoDialog
          open={!!propostaPerDocumento}
          onOpenChange={(open) => !open && setPropostaPerDocumento(null)}
          categoria="preventivo"
          cliente={propostaPerDocumento.contatto}
          proprieta={propostaPerDocumento.proprieta}
          proposta={{
            id: propostaPerDocumento.id,
            numero: propostaPerDocumento.numero ?? undefined,
            data: propostaPerDocumento.data_creazione,
            totale: propostaPerDocumento.totale ?? undefined,
            subtotale: propostaPerDocumento.subtotale ?? undefined,
            sconto_percentuale: propostaPerDocumento.sconto_percentuale ?? undefined,
            sconto_fisso: propostaPerDocumento.sconto_fisso ?? undefined,
            items: propostaPerDocumento.items?.map(item => ({
              nome: item.nome,
              descrizione: item.descrizione ?? undefined,
              quantita: item.quantita,
              prezzo_unitario: item.prezzo_unitario,
              prezzo_totale: item.prezzo_totale,
              sconto_percentuale: item.sconto_percentuale ?? undefined,
              note: item.note ?? undefined,
            })),
          }}
          onSuccess={() => setPropostaPerDocumento(null)}
        />
      )}

      {/* Dialog dettaglio proposta */}
      <PropostaDetailDialog
        proposta={propostaDetail}
        open={!!propostaDetail}
        onOpenChange={(open) => !open && setPropostaDetail(null)}
      />
    </div>
  )
}
