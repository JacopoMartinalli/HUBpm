'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, UserCheck, UserX, Building2, AlertTriangle, ChevronRight, ChevronLeft, Plus, RefreshCw, Home, Pencil } from 'lucide-react'
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
  useUpdateContatto,
  useConvertLeadToCliente,
  useMarkLeadAsLost,
  useDeleteContatto,
  useProprietaLeadList,
  useCambioFase,
  useTaskCountPerFase,
  useGeneraTaskPerFase,
} from '@/lib/hooks'
import { ProprietaDialog } from '@/app/proprieta/components/proprieta-dialog'
import { CreaProprietaWizard } from '@/app/lead/components/crea-proprieta-wizard'
import { FASI_LEAD, MOTIVI_LEAD_PERSO } from '@/constants'
import { formatDate, getFullName } from '@/lib/utils'
import type { FaseLead, MotivoLeadPerso } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export default function LeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [lostDialogOpen, setLostDialogOpen] = useState(false)
  const [proprietaDialogOpen, setProprietaDialogOpen] = useState(false)
  const [avanzaL1DialogOpen, setAvanzaL1DialogOpen] = useState(false)
  const [faseError, setFaseError] = useState<string | null>(null)
  const [motivoPerso, setMotivoPerso] = useState<MotivoLeadPerso | ''>('')
  const [notePerso, setNotePerso] = useState('')

  const { data: lead, isLoading } = useContatto(id)
  const { data: proprieta } = useProprietaLeadList(id)
  const { data: taskCounts } = useTaskCountPerFase('lead', id)
  const cambioFase = useCambioFase()
  const convertToCliente = useConvertLeadToCliente()
  const markAsLost = useMarkLeadAsLost()
  const deleteContatto = useDeleteContatto()
  const generaTask = useGeneraTaskPerFase()
  const updateContatto = useUpdateContatto()

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

    // Se stiamo passando da L0 a L1 e NON ci sono proprietà, mostra il wizard
    // Se ci sono già proprietà (es. retrocesso da L1 e ritorna), passa direttamente
    if (lead.fase_lead === 'L0' && nextFase.id === 'L1' && (!proprieta || proprieta.length === 0)) {
      setAvanzaL1DialogOpen(true)
      return
    }

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

  // Aggiorna il numero di proprietà sul lead
  const handleUpdateNumeroProprieta = async (value: number) => {
    await updateContatto.mutateAsync({
      id: lead.id,
      numero_proprieta: value,
    })
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
    if (!motivoPerso) return
    await markAsLost.mutateAsync({
      id: lead.id,
      motivoCodice: motivoPerso,
      note: notePerso || undefined,
    })
    setLostDialogOpen(false)
    setMotivoPerso('')
    setNotePerso('')
  }

  const handleDelete = async () => {
    await deleteContatto.mutateAsync(lead.id)
    router.push('/lead')
  }

  const handleGeneraTask = async () => {
    if (!lead.fase_lead) return
    await generaTask.mutateAsync({
      tipoEntita: 'lead',
      fase: lead.fase_lead,
      entityId: lead.id,
    })
  }

  const canConvert = lead.fase_lead === 'L3' && lead.esito_lead === 'in_corso'
  const isClosedLead = lead.esito_lead !== 'in_corso'
  const currentFaseKey = lead.fase_lead || 'L0'
  const hasTaskForCurrentPhase = (taskCounts && taskCounts[currentFaseKey]?.totali > 0) || false

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
                // Mostra contatore solo per la fase corrente (non per le completate o future)
                const showCount = isCurrent && count && count.totali > 0

                return (
                  <div key={fase.id} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[44px]">
                      {/* Container per mantenere allineamento verticale */}
                      <div className="h-11 flex items-center justify-center">
                        <div
                          className={`
                            flex items-center justify-center rounded-full font-medium transition-all
                            ${isCurrent ? 'h-11 w-11 text-sm bg-primary text-primary-foreground shadow-lg' : 'h-8 w-8 text-xs'}
                            ${isCompleted && 'bg-green-500 text-white'}
                            ${isPending && 'bg-muted text-muted-foreground'}
                          `}
                          title={fase.label}
                        >
                          {fase.id}
                        </div>
                      </div>
                      {/* Spazio riservato per il contatore - sempre presente per allineamento */}
                      <div className="h-4 flex items-center justify-center">
                        {showCount && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {count.completati}/{count.totali}
                          </span>
                        )}
                      </div>
                    </div>
                    {index < FASI_LEAD.length - 1 && (
                      <div
                        className={`h-1 w-6 mx-1 rounded ${isCompleted ? 'bg-green-500' : 'bg-muted'}`}
                        style={{ marginTop: '-16px' }} // Allinea la linea al centro dei pallini
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
        <div className="space-y-4">
          {!hasTaskForCurrentPhase && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nessun task per questa fase</p>
                    <p className="text-sm text-muted-foreground">
                      Genera i task dalla checklist predefinita per la fase {lead.fase_lead}
                    </p>
                  </div>
                  <Button onClick={handleGeneraTask} disabled={generaTask.isPending}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${generaTask.isPending ? 'animate-spin' : ''}`} />
                    {generaTask.isPending ? 'Generazione...' : 'Genera Task'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <CosaMancaCard
            tipoEntita="lead"
            fase={lead.fase_lead || 'L0'}
            entityId={lead.id}
          />
        </div>
      )}

      {/* Grid Info Lead */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Dettagli Lead */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dettagli Lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Fonte</p>
              <p className="font-medium">{lead.fonte_lead || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Creazione</p>
              <p className="font-medium">{formatDate(lead.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Home className="h-3 w-3" />
                N. Proprietà
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={lead.numero_proprieta || 1}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1)
                    handleUpdateNumeroProprieta(val)
                  }}
                  className="w-16 h-8"
                  disabled={isClosedLead}
                />
                {(proprieta?.length || 0) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({proprieta?.length} create)
                  </span>
                )}
              </div>
            </div>
            {(lead.motivo_perso_codice || lead.motivo_perso) && (
              <div>
                <p className="text-sm text-muted-foreground">Motivo Perso</p>
                <p className="font-medium text-red-600">
                  {lead.motivo_perso_codice
                    ? MOTIVI_LEAD_PERSO.find(m => m.id === lead.motivo_perso_codice)?.label || lead.motivo_perso_codice
                    : lead.motivo_perso}
                </p>
                {lead.motivo_perso && lead.motivo_perso_codice && (
                  <p className="text-sm text-muted-foreground mt-1">{lead.motivo_perso}</p>
                )}
              </div>
            )}
            {lead.note && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Note</p>
                <p className="text-sm">{lead.note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Proprietà in Valutazione - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proprietà in Valutazione
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {proprieta && proprieta.length > 0
                ? `${proprieta.length} proprietà associate a questo lead`
                : 'Nessuna proprietà ancora creata per questo lead'
              }
            </p>
          </div>
          <Button onClick={() => setProprietaDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Proprietà
          </Button>
        </CardHeader>
        <CardContent>
          {proprieta && proprieta.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {proprieta.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/proprieta/${prop.id}`}
                  className="block"
                >
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold truncate">{prop.nome}</h3>
                        <FaseBadge fase={prop.fase} tipo="proprieta" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Home className="h-3.5 w-3.5" />
                          {prop.tipologia ? prop.tipologia.charAt(0).toUpperCase() + prop.tipologia.slice(1).replace('_', ' ') : 'Non specificata'}
                        </p>
                        <p className="text-muted-foreground truncate">
                          {prop.indirizzo}, {prop.citta}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                          <span className="capitalize">{prop.tipologia || 'N/D'}</span>
                          <span>Fase: {prop.fase}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Nessuna proprietà</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                  Aggiungi la prima proprietà per questo lead o avanza alla fase L1 per crearle automaticamente
                </p>
                <Button variant="outline" onClick={() => setProprietaDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Proprietà
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuova Proprietà */}
      <ProprietaDialog
        open={proprietaDialogOpen}
        onOpenChange={setProprietaDialogOpen}
        contattoId={lead.id}
      />

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

      {/* Wizard Creazione Proprietà L0 → L1 */}
      <CreaProprietaWizard
        open={avanzaL1DialogOpen}
        onOpenChange={setAvanzaL1DialogOpen}
        lead={lead}
        proprietaEsistenti={proprieta || []}
        onComplete={() => setFaseError(null)}
      />

      {/* Dialog Segna come Perso */}
      <Dialog open={lostDialogOpen} onOpenChange={(open) => {
        setLostDialogOpen(open)
        if (!open) {
          setMotivoPerso('')
          setNotePerso('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Segna come Perso</DialogTitle>
            <DialogDescription>
              Seleziona il motivo per cui il lead non è andato a buon fine.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Select value={motivoPerso} onValueChange={(v) => setMotivoPerso(v as MotivoLeadPerso)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVI_LEAD_PERSO.map((motivo) => (
                    <SelectItem key={motivo.id} value={motivo.id}>
                      <div className="flex flex-col">
                        <span>{motivo.label}</span>
                        <span className="text-xs text-muted-foreground">{motivo.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note aggiuntive</Label>
              <Textarea
                id="note"
                placeholder="Dettagli aggiuntivi sul motivo..."
                value={notePerso}
                onChange={(e) => setNotePerso(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkAsLost}
              disabled={!motivoPerso || markAsLost.isPending}
            >
              {markAsLost.isPending ? 'Salvataggio...' : 'Conferma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
