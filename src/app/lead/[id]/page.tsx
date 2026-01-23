'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, UserCheck, UserX, Building2, AlertTriangle, ChevronRight, ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  PageHeader,
  FaseBadge,
  EsitoBadge,
  LoadingPage,
  ConfirmDialog,
  CosaMancaCard,
} from '@/components/shared'
import {
  useContatto,
  useConvertLeadToCliente,
  useMarkLeadAsLost,
  useDeleteContatto,
  useProprietaLeadList,
  useCambioFase,
  useTaskCountPerFase,
} from '@/lib/hooks'
import { FASI_LEAD } from '@/constants'
import { formatDate, getFullName } from '@/lib/utils'
import type { FaseLead } from '@/types/database'

export default function LeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [lostDialogOpen, setLostDialogOpen] = useState(false)
  const [faseError, setFaseError] = useState<string | null>(null)

  const { data: lead, isLoading } = useContatto(id)
  const { data: proprietaLead } = useProprietaLeadList(id)
  const { data: taskCounts } = useTaskCountPerFase('lead', id)
  const cambioFase = useCambioFase()
  const convertToCliente = useConvertLeadToCliente()
  const markAsLost = useMarkLeadAsLost()
  const deleteContatto = useDeleteContatto()

  if (isLoading) {
    return <LoadingPage />
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Lead non trovato</p>
      </div>
    )
  }

  // Trova indice fase corrente, prossima fase e fase precedente
  const currentFaseIndex = FASI_LEAD.findIndex(f => f.id === (lead.fase_lead || 'L0'))
  const currentFase = FASI_LEAD[currentFaseIndex]
  const nextFase = currentFaseIndex < FASI_LEAD.length - 1 ? FASI_LEAD[currentFaseIndex + 1] : null
  const prevFase = currentFaseIndex > 0 ? FASI_LEAD[currentFaseIndex - 1] : null

  const handleAvanzaFase = async () => {
    if (!nextFase) return
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'lead',
        faseCorrente: lead.fase_lead || 'L0',
        nuovaFase: nextFase.id as FaseLead,
        entityId: lead.id,
      })
    } catch (error) {
      if (error instanceof Error) {
        setFaseError(error.message)
      }
    }
  }

  const handleTornaIndietro = async () => {
    if (!prevFase) return
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'lead',
        faseCorrente: lead.fase_lead || 'L0',
        nuovaFase: prevFase.id as FaseLead,
        entityId: lead.id,
      })
    } catch (error) {
      if (error instanceof Error) {
        setFaseError(error.message)
      }
    }
  }

  const handleConvert = async () => {
    await convertToCliente.mutateAsync(lead.id)
    router.push('/clienti')
  }

  const handleMarkAsLost = async () => {
    await markAsLost.mutateAsync({ id: lead.id, motivo: 'Non interessato' })
    setLostDialogOpen(false)
  }

  const handleDelete = async () => {
    await deleteContatto.mutateAsync(lead.id)
    router.push('/lead')
  }

  const canConvert = lead.fase_lead === 'L3' && lead.esito_lead === 'in_corso'
  const isClosedLead = lead.esito_lead !== 'in_corso'

  return (
    <div className="space-y-6">
      <PageHeader
        title={getFullName(lead.nome, lead.cognome)}
        description={lead.email || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/lead')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            {!isClosedLead && (
              <Button variant="outline" onClick={() => setLostDialogOpen(true)}>
                <UserX className="h-4 w-4 mr-2" />
                Segna come Perso
              </Button>
            )}
            <Button variant="destructive" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Pipeline e Azioni Fase */}
      <Card>
        <CardContent className="pt-6">
          {/* Barra progresso fasi */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              {FASI_LEAD.map((fase, index) => {
                const isCompleted = index < currentFaseIndex
                const isCurrent = index === currentFaseIndex
                const isPending = index > currentFaseIndex
                const count = taskCounts?.[fase.id]

                return (
                  <div key={fase.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          flex items-center justify-center rounded-full text-xs font-medium transition-all
                          ${isCurrent ? 'h-10 w-10 bg-primary text-primary-foreground' : 'h-8 w-8'}
                          ${isCompleted && 'bg-green-500 text-white'}
                          ${isPending && 'bg-muted text-muted-foreground'}
                        `}
                        title={fase.label}
                      >
                        {fase.id}
                      </div>
                      {count && count.totali > 0 && (
                        <span
                          className={`text-[10px] font-medium mt-0.5 ${
                            count.completati === count.totali
                              ? 'text-green-600'
                              : isCompleted || isCurrent
                                ? 'text-muted-foreground'
                                : 'text-muted-foreground/50'
                          }`}
                        >
                          {count.completati}/{count.totali}
                        </span>
                      )}
                    </div>
                    {index < FASI_LEAD.length - 1 && (
                      <div
                        className={`h-1 w-6 mx-1 rounded self-start mt-4 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {lead.esito_lead && (
              <EsitoBadge esito={lead.esito_lead} tipo="lead" />
            )}
          </div>

          {/* Info fase corrente e azione */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Fase corrente</p>
              <p className="text-lg font-semibold">{currentFase?.id} - {currentFase?.label}</p>
              {currentFase?.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentFase.description}</p>
              )}
            </div>

            {!isClosedLead && (
              <div className="flex items-center gap-2">
                {prevFase && (
                  <Button variant="outline" onClick={handleTornaIndietro} disabled={cambioFase.isPending}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span>Torna a {prevFase.id}</span>
                  </Button>
                )}
                {canConvert ? (
                  <Button onClick={() => setConvertDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Converti a Cliente
                  </Button>
                ) : nextFase && (
                  <Button onClick={handleAvanzaFase} disabled={cambioFase.isPending}>
                    <span>Avanza a {nextFase.id}</span>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {faseError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Impossibile avanzare</AlertTitle>
              <AlertDescription>{faseError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cosa Manca */}
      {!isClosedLead && (
        <CosaMancaCard
          tipoEntita="lead"
          fase={lead.fase_lead || 'L0'}
          entityId={lead.id}
        />
      )}

      {/* Grid principale */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonna sinistra - Info Lead */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Anagrafica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anagrafica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{lead.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cognome</p>
                    <p className="font-medium">{lead.cognome}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {lead.tipo_persona === 'persona_giuridica' ? 'Società' : 'Persona Fisica'}
                  </p>
                </div>
                {lead.codice_fiscale && (
                  <div>
                    <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                    <p className="font-medium">{lead.codice_fiscale}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contatti */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contatti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{lead.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{lead.telefono || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dettagli Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dettagli Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fonte</p>
                  <p className="font-medium">{lead.fonte_lead || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Creazione</p>
                  <p className="font-medium">{formatDate(lead.created_at)}</p>
                </div>
                {lead.motivo_perso && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motivo Perso</p>
                    <p className="font-medium text-red-600">{lead.motivo_perso}</p>
                  </div>
                )}
              </div>
              {lead.note && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Note</p>
                  <p className="text-sm">{lead.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonna destra - Proprietà */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Proprietà in Valutazione</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/proprieta-lead?leadId=${lead.id}`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {proprietaLead && proprietaLead.length > 0 ? (
                <div className="space-y-3">
                  {proprietaLead.map((prop) => (
                    <Link
                      key={prop.id}
                      href={`/proprieta-lead/${prop.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{prop.nome}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {prop.indirizzo}, {prop.citta}
                          </p>
                        </div>
                        <FaseBadge fase={prop.fase} tipo="proprieta_lead" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nessuna proprietà in valutazione
                  </p>
                  <Button variant="link" size="sm" asChild className="mt-2">
                    <Link href={`/proprieta-lead?leadId=${lead.id}`}>
                      Aggiungi la prima proprietà
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Lead"
        description="Sei sicuro di voler eliminare questo lead? L&apos;azione non può essere annullata."
        confirmText="Elimina"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteContatto.isPending}
      />

      <ConfirmDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        title="Converti a Cliente"
        description="Il lead verrà convertito in cliente e passerà alla fase di onboarding (C0)."
        confirmText="Converti"
        onConfirm={handleConvert}
        isLoading={convertToCliente.isPending}
      />

      <ConfirmDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        title="Segna come Perso"
        description="Il lead verrà segnato come perso. Potrai comunque visualizzarlo nella lista."
        confirmText="Conferma"
        variant="destructive"
        onConfirm={handleMarkAsLost}
        isLoading={markAsLost.isPending}
      />
    </div>
  )
}
