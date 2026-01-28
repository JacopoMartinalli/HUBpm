'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Trash2, UserCheck, UserX, Building2, AlertTriangle,
  ChevronRight, Plus, Phone, XCircle,
  CheckCircle2, Clock, ArrowRight, CalendarDays,
  MessageSquare, Mail, Users, FileText, PhoneCall,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  PageHeader,
  FaseBadge,
  LoadingPage,
  ConfirmDialog,
} from '@/components/shared'
import {
  useContatto,
  useUpdateContatto,
  useConvertLeadToCliente,
  useMarkLeadAsLost,
  useDeleteContatto,
  useProprietaByContatto,
  useCambioFase,
  useInterazioni,
  useCreateInterazione,
} from '@/lib/hooks'
import { ProprietaDialog } from '@/app/proprieta/components/proprieta-dialog'
import { CreaProprietaWizard } from '@/app/lead/components/crea-proprieta-wizard'
import { FASI_PROPRIETA, MOTIVI_LEAD_PERSO, FONTI_LEAD } from '@/constants'
import { formatDate, getFullName } from '@/lib/utils'
import type { FaseLead, MotivoLeadPerso, TipoInterazione, EsitoInterazione } from '@/types/database'
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

import { AppuntamentoSuggestionCard } from '@/components/appuntamenti/AppuntamentoSuggestionCard'
import { AppuntamentiListCard } from '@/components/appuntamenti/AppuntamentiListCard'

const TIPI_INTERAZIONE: { id: TipoInterazione; label: string; icon: typeof Phone }[] = [
  { id: 'chiamata', label: 'Chiamata', icon: PhoneCall },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'messaggio', label: 'Messaggio', icon: MessageSquare },
  { id: 'incontro', label: 'Incontro', icon: Users },
  { id: 'nota', label: 'Nota', icon: FileText },
]

const ESITI_INTERAZIONE: { id: string; label: string }[] = [
  { id: 'risposto', label: 'Risposto' },
  { id: 'non_risposto', label: 'Non risposto' },
  { id: 'occupato', label: 'Occupato' },
  { id: 'richiamato', label: 'Richiamato' },
  { id: 'inviato', label: 'Inviato' },
  { id: 'ricevuto', label: 'Ricevuto' },
]

function getStatoBadge(lead: { fase_lead?: string | null; esito_lead?: string | null }, hasProprietaInGestione: boolean) {
  if (lead.esito_lead === 'perso') return { label: 'Perso', color: 'bg-red-100 text-red-700', icon: XCircle }
  if (hasProprietaInGestione) return { label: 'Già cliente', color: 'bg-green-100 text-green-700', icon: UserCheck }
  if (lead.fase_lead === 'L1') return { label: 'Qualificato', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
  return { label: 'Nuovo', color: 'bg-gray-100 text-gray-700', icon: Clock }
}

function getFaseInfo(fase: string) {
  return FASI_PROPRIETA.find(f => f.id === fase)
}

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
  // Interazione form
  const [showInterazioneForm, setShowInterazioneForm] = useState(false)
  const [intTipo, setIntTipo] = useState<TipoInterazione>('chiamata')
  const [intEsito, setIntEsito] = useState('')
  const [intNote, setIntNote] = useState('')
  const [intData, setIntData] = useState('')

  const { data: lead, isLoading } = useContatto(id)
  const { data: proprieta } = useProprietaByContatto(id)
  const { data: interazioni } = useInterazioni(id)
  const cambioFase = useCambioFase()
  const convertToCliente = useConvertLeadToCliente()
  const markAsLost = useMarkLeadAsLost()
  const deleteContatto = useDeleteContatto()
  const updateContatto = useUpdateContatto()
  const createInterazione = useCreateInterazione()

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

  const hasProprietaInGestione = proprieta?.some(p => ['P3', 'P4'].includes(p.fase)) || false
  const isClosedLead = lead.esito_lead !== 'in_corso'
  const canConvert = lead.fase_lead === 'L1' && lead.esito_lead === 'in_corso' && !hasProprietaInGestione
  const stato = getStatoBadge(lead, hasProprietaInGestione)
  const StatoIcon = stato.icon

  const fonteLabel = lead.fonte_lead
    ? FONTI_LEAD?.find((f: { id: string; label: string }) => f.id === lead.fonte_lead)?.label || lead.fonte_lead
    : null

  const handleQualifica = async () => {
    if (lead.fase_lead === 'L0' && (!proprieta || proprieta.length === 0)) {
      setAvanzaL1DialogOpen(true)
      return
    }
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'lead',
        faseCorrente: lead.fase_lead || 'L0',
        nuovaFase: 'L1' as FaseLead,
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

  const handleFollowupChange = async (date: string) => {
    await updateContatto.mutateAsync({
      id: lead.id,
      data_prossimo_followup: date || null,
    })
  }

  const handleAddInterazione = async () => {
    await createInterazione.mutateAsync({
      contatto_id: lead.id,
      tipo: intTipo,
      esito: (intEsito as EsitoInterazione) || undefined,
      note: intNote || undefined,
      data: intData || undefined,
    })
    setShowInterazioneForm(false)
    setIntTipo('chiamata')
    setIntEsito('')
    setIntNote('')
    setIntData('')
  }

  const getInterazioneIcon = (tipo: string) => {
    const found = TIPI_INTERAZIONE.find(t => t.id === tipo)
    return found ? found.icon : Phone
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={getFullName(lead.nome, lead.cognome, lead.ragione_sociale)}
        description={lead.email || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge className={`${stato.color} border-0 text-sm px-3 py-1`}>
              <StatoIcon className="h-4 w-4 mr-1" />
              {stato.label}
            </Badge>
            <Button variant="outline" onClick={() => router.push('/lead')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            {!isClosedLead && (
              <Button variant="outline" onClick={() => setLostDialogOpen(true)}>
                <UserX className="h-4 w-4 mr-2" />
                Perso
              </Button>
            )}
            <Button variant="destructive" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Sezione Azione Principale */}
      {!isClosedLead && lead.fase_lead === 'L0' && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Contatta e qualifica il lead</p>
                  <p className="text-sm text-muted-foreground">
                    Chiama il lead, verifica l&apos;interesse e aggiungi la proprietà da valutare
                  </p>
                </div>
              </div>
              <Button onClick={handleQualifica} disabled={cambioFase.isPending}>
                Qualifica Lead
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isClosedLead && lead.fase_lead === 'L1' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Lead qualificato</p>
                  <p className="text-sm text-muted-foreground">
                    Gestisci le proprietà dal pannello sotto, oppure converti a cliente
                  </p>
                </div>
              </div>
              {canConvert && (
                <Button onClick={() => setConvertDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Converti a Cliente
                </Button>
              )}
              {hasProprietaInGestione && (
                <Badge className="bg-green-100 text-green-700 border-0 text-sm px-3 py-1">
                  <UserCheck className="h-4 w-4 mr-1" />
                  Già cliente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggerimenti Appuntamenti (solo L1) */}
      {!isClosedLead && lead.fase_lead === 'L1' && (
        <AppuntamentoSuggestionCard
          tipoEntita="lead"
          fase="L1"
          entityId={lead.id}
          contattoId={lead.id}
          proprietaId={proprieta?.[0]?.id}
        />
      )}

      {/* Lead perso */}
      {lead.esito_lead === 'perso' && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-700">Lead perso</p>
                <p className="text-sm text-muted-foreground">
                  {lead.motivo_perso_codice
                    ? MOTIVI_LEAD_PERSO.find(m => m.id === lead.motivo_perso_codice)?.label || lead.motivo_perso_codice
                    : 'Nessun motivo specificato'}
                  {lead.motivo_perso && ` — ${lead.motivo_perso}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {faseError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Impossibile avanzare</AlertTitle>
          <AlertDescription>{faseError}</AlertDescription>
        </Alert>
      )}

      {/* Proprietà */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proprietà
            </CardTitle>
            {proprieta && proprieta.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {proprieta.length} proprietà associate
              </p>
            )}
          </div>
          {!isClosedLead && (
            <Button onClick={() => setProprietaDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Proprietà
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {proprieta && proprieta.length > 0 ? (
            <div className="space-y-3">
              {proprieta.map((prop) => {
                const faseInfo = getFaseInfo(prop.fase)
                const isOperativa = prop.fase === 'P4'
                const borderColor = isOperativa ? 'border-l-green-500' : prop.fase === 'P5' ? 'border-l-gray-300' : 'border-l-blue-500'
                return (
                  <Link key={prop.id} href={`/proprieta/${prop.id}`}>
                    <Card className={`p-4 hover:bg-muted/50 transition-colors border-l-4 ${borderColor} ${prop.fase === 'P5' ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{prop.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {prop.indirizzo}, {prop.citta}
                            {prop.tipologia && ` · ${prop.tipologia.charAt(0).toUpperCase() + prop.tipologia.slice(1).replace('_', ' ')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <FaseBadge fase={prop.fase} tipo="proprieta" />
                            {faseInfo && (
                              <p className="text-xs text-muted-foreground mt-1">{faseInfo.description}</p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Nessuna proprietà</h3>
              <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                {lead.fase_lead === 'L0'
                  ? 'Qualifica il lead per aggiungere la prima proprietà'
                  : 'Aggiungi una proprietà per avviare la valutazione'}
              </p>
              {!isClosedLead && (
                <Button variant="outline" onClick={() => setProprietaDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Proprietà
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info unificate + Follow-up */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card unica: Informazioni Lead */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informazioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.tipo_persona === 'persona_giuridica' ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Ragione Sociale</p>
                  <p className="font-medium">{lead.ragione_sociale || `${lead.nome} ${lead.cognome}`}</p>
                </div>
                {lead.partita_iva && (
                  <div>
                    <p className="text-sm text-muted-foreground">Partita IVA</p>
                    <p className="font-medium">{lead.partita_iva}</p>
                  </div>
                )}
              </>
            ) : (
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
            )}
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{lead.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefono</p>
              <p className="font-medium">{lead.telefono || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fonte</p>
                <p className="font-medium">{fonteLabel || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acquisito il</p>
                <p className="font-medium">{formatDate(lead.created_at)}</p>
              </div>
            </div>
            {lead.valore_stimato && (
              <div>
                <p className="text-sm text-muted-foreground">Valore Stimato</p>
                <p className="font-medium">€ {lead.valore_stimato.toLocaleString()}</p>
              </div>
            )}
            {lead.note && (
              <div>
                <p className="text-sm text-muted-foreground">Note</p>
                <p className="text-sm">{lead.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appuntamenti + Follow-up stacked */}
        <div className="space-y-6">
          <AppuntamentiListCard contattoId={lead.id} />

          {/* Follow-up */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="followup-date">Prossimo follow-up</Label>
                <Input
                  id="followup-date"
                  type="date"
                  className="mt-1"
                  value={lead.data_prossimo_followup || ''}
                  onChange={(e) => handleFollowupChange(e.target.value)}
                />
                {lead.data_prossimo_followup && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lead.data_prossimo_followup) < new Date(new Date().toDateString())
                      ? '⚠️ Follow-up scaduto'
                      : new Date(lead.data_prossimo_followup).toDateString() === new Date().toDateString()
                        ? '📞 Da richiamare oggi'
                        : `Tra ${Math.ceil((new Date(lead.data_prossimo_followup).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} giorni`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Storico Interazioni */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Storico Interazioni
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInterazioneForm(!showInterazioneForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi
          </Button>
        </CardHeader>
        <CardContent>
          {/* Quick add form */}
          {showInterazioneForm && (
            <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={intTipo} onValueChange={(v) => setIntTipo(v as TipoInterazione)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPI_INTERAZIONE.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Esito</Label>
                  <Select value={intEsito} onValueChange={setIntEsito}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Opzionale" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESITI_INTERAZIONE.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={intData}
                    onChange={(e) => setIntData(e.target.value)}
                    placeholder="Oggi"
                  />
                </div>
              </div>
              <div>
                <Label>Note</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  placeholder="Note brevi sull'interazione..."
                  value={intNote}
                  onChange={(e) => setIntNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowInterazioneForm(false)}>
                  Annulla
                </Button>
                <Button size="sm" onClick={handleAddInterazione} disabled={createInterazione.isPending}>
                  {createInterazione.isPending ? 'Salvataggio...' : 'Salva'}
                </Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {interazioni && interazioni.length > 0 ? (
            <div className="space-y-3">
              {interazioni.map((int) => {
                const Icon = getInterazioneIcon(int.tipo)
                const tipoLabel = TIPI_INTERAZIONE.find(t => t.id === int.tipo)?.label || int.tipo
                const esitoLabel = int.esito ? ESITI_INTERAZIONE.find(e => e.id === int.esito)?.label : null
                return (
                  <div key={int.id} className="flex gap-3 items-start">
                    <div className="mt-0.5 p-1.5 rounded-full bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tipoLabel}</span>
                        {esitoLabel && (
                          <Badge variant="outline" className="text-xs">{esitoLabel}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(int.data)}
                        </span>
                      </div>
                      {int.note && (
                        <p className="text-sm text-muted-foreground mt-0.5">{int.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nessuna interazione registrata
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProprietaDialog
        open={proprietaDialogOpen}
        onOpenChange={setProprietaDialogOpen}
        contattoId={lead.id}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Lead"
        description="Sei sicuro di voler eliminare questo lead? L'azione non può essere annullata."
        confirmText="Elimina"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteContatto.isPending}
      />

      <ConfirmDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        title="Converti a Cliente"
        description="Il lead verrà convertito in cliente."
        confirmText="Converti"
        onConfirm={handleConvert}
        isLoading={convertToCliente.isPending}
      />

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
