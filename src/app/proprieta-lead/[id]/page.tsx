'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Check, X, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  PageHeader,
  FaseProgress,
  LoadingPage,
  ConfirmDialog,
  CosaMancaCard,
} from '@/components/shared'
import {
  useProprietaLead,
  useConfermaProprietaLead,
  useScartaProprietaLead,
  useDeleteProprietaLead,
  useCambioFase,
  useTaskCountPerFase,
} from '@/lib/hooks'
import { FASI_PROPRIETA_LEAD, TIPOLOGIE_PROPRIETA } from '@/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FaseProprietaLead } from '@/types/database'

export default function ProprietaLeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confermaDialogOpen, setConfermaDialogOpen] = useState(false)
  const [scartaDialogOpen, setScartaDialogOpen] = useState(false)
  const [faseError, setFaseError] = useState<string | null>(null)

  const { data: proprietaLead, isLoading } = useProprietaLead(id)
  const { data: taskCounts } = useTaskCountPerFase('proprieta_lead', id)
  const cambioFase = useCambioFase()
  const conferma = useConfermaProprietaLead()
  const scarta = useScartaProprietaLead()
  const deleteProprieta = useDeleteProprietaLead()

  if (isLoading) {
    return <LoadingPage />
  }

  if (!proprietaLead) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Proprietà non trovata</p>
      </div>
    )
  }

  const handleFaseChange = async (nuovaFase: string) => {
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'proprieta_lead',
        faseCorrente: proprietaLead.fase,
        nuovaFase: nuovaFase as FaseProprietaLead,
        entityId: proprietaLead.id,
        contattoId: proprietaLead.contatto_id,
      })
    } catch (error) {
      if (error instanceof Error) {
        setFaseError(error.message)
      }
    }
  }

  const handleConferma = async () => {
    await conferma.mutateAsync(proprietaLead.id)
    router.push('/proprieta')
  }

  const handleScarta = async () => {
    await scarta.mutateAsync({ id: proprietaLead.id, motivo: 'Non idonea' })
    setScartaDialogOpen(false)
  }

  const handleDelete = async () => {
    await deleteProprieta.mutateAsync(proprietaLead.id)
    router.push('/proprieta-lead')
  }

  const canConferma = proprietaLead.fase === 'PL3' && proprietaLead.esito === 'in_corso'
  const isClosed = proprietaLead.esito !== 'in_corso'
  const tipologiaLabel = TIPOLOGIE_PROPRIETA.find(t => t.id === proprietaLead.tipologia)?.label

  return (
    <div>
      <PageHeader
        title={proprietaLead.nome}
        description={`${proprietaLead.indirizzo}, ${proprietaLead.citta}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/proprieta-lead')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            {!isClosed && (
              <>
                {canConferma && (
                  <Button onClick={() => setConfermaDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4 mr-2" />
                    Conferma
                  </Button>
                )}
                <Button variant="outline" onClick={() => setScartaDialogOpen(true)}>
                  <X className="h-4 w-4 mr-2" />
                  Scarta
                </Button>
              </>
            )}
            <Button variant="destructive" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Fase Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <FaseProgress faseCorrente={proprietaLead.fase} tipo="proprieta_lead" taskCounts={taskCounts} />
            {!isClosed && (
              <Select
                value={proprietaLead.fase}
                onValueChange={handleFaseChange}
                disabled={cambioFase.isPending}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FASI_PROPRIETA_LEAD.map((fase) => (
                    <SelectItem key={fase.id} value={fase.id}>
                      {fase.id} - {fase.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {faseError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Impossibile cambiare fase</AlertTitle>
              <AlertDescription>{faseError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cosa Manca Card */}
      {!isClosed && (
        <div className="mb-6">
          <CosaMancaCard
            tipoEntita="proprieta_lead"
            fase={proprietaLead.fase}
            entityId={proprietaLead.id}
            contattoId={proprietaLead.contatto_id}
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info Base */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informazioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipologia</p>
                <p className="font-medium">{tipologiaLabel || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Città</p>
                <p className="font-medium">{proprietaLead.citta}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Indirizzo</p>
              <p className="font-medium">{proprietaLead.indirizzo}</p>
            </div>
            {proprietaLead.contatto && (
              <div>
                <p className="text-sm text-muted-foreground">Proprietario (Lead)</p>
                <Link
                  href={`/lead/${proprietaLead.contatto_id}`}
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  {proprietaLead.contatto.nome} {proprietaLead.contatto.cognome}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Valutazione */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valutazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Stimato</p>
                <p className="font-medium">
                  {proprietaLead.revenue_stimato_annuo
                    ? formatCurrency(proprietaLead.revenue_stimato_annuo) + '/anno'
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investimento</p>
                <p className="font-medium">
                  {proprietaLead.investimento_richiesto
                    ? formatCurrency(proprietaLead.investimento_richiesto)
                    : '-'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Sopralluogo</p>
              <p className="font-medium">
                {proprietaLead.data_sopralluogo
                  ? formatDate(proprietaLead.data_sopralluogo)
                  : 'Non programmato'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commissione Proposta</p>
              <p className="font-medium">
                {proprietaLead.commissione_proposta
                  ? `${proprietaLead.commissione_proposta}%`
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Note Sopralluogo */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Note Sopralluogo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{proprietaLead.note_sopralluogo || 'Nessuna nota'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Proprietà Lead"
        description="Sei sicuro di voler eliminare questa proprietà? L'azione non può essere annullata."
        confirmText="Elimina"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteProprieta.isPending}
      />

      <ConfirmDialog
        open={confermaDialogOpen}
        onOpenChange={setConfermaDialogOpen}
        title="Conferma Proprietà"
        description="La proprietà verrà creata come proprietà cliente in fase P0 (Onboarding)."
        confirmText="Conferma"
        onConfirm={handleConferma}
        isLoading={conferma.isPending}
      />

      <ConfirmDialog
        open={scartaDialogOpen}
        onOpenChange={setScartaDialogOpen}
        title="Scarta Proprietà"
        description="La proprietà verrà segnata come scartata."
        confirmText="Scarta"
        variant="destructive"
        onConfirm={handleScarta}
        isLoading={scarta.isPending}
      />
    </div>
  )
}
