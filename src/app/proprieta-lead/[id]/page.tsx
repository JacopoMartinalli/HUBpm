'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  LoadingSpinner,
  FaseBadge,
  EsitoBadge,
  ConfirmDialog,
  PageHeader,
} from '@/components/shared'
import {
  useProprietaLead,
  useUpdateProprietaLead,
  useDeleteProprietaLead,
  useConfermaProprietaLead,
  useScartaProprietaLead,
  useCambioFase,
} from '@/lib/hooks'
import { formatDate, formatCurrency } from '@/lib/utils'
import { FASI_PROPRIETA_LEAD, TIPOLOGIE_PROPRIETA } from '@/constants'
import type { FaseProprietaLead } from '@/types/database'

export default function ProprietaLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: proprietaLead, isLoading } = useProprietaLead(id)
  const updateProprietaLead = useUpdateProprietaLead()
  const deleteProprietaLead = useDeleteProprietaLead()
  const confermaProprietaLead = useConfermaProprietaLead()
  const scartaProprietaLead = useScartaProprietaLead()
  const cambioFase = useCambioFase()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confermaDialogOpen, setConfermaDialogOpen] = useState(false)
  const [scartaDialogOpen, setScartaDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [motivoScarto, setMotivoScarto] = useState('')
  const [faseError, setFaseError] = useState<string | null>(null)

  // Form state per modifica
  const [editForm, setEditForm] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    tipologia: '',
    data_sopralluogo: '',
    revenue_stimato_annuo: '',
    commissione_proposta: '',
    note: '',
    note_sopralluogo: '',
  })

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!proprietaLead) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Proprietà non trovata</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Torna indietro
        </Button>
      </div>
    )
  }

  const faseInfo = FASI_PROPRIETA_LEAD.find(f => f.id === proprietaLead.fase)
  const tipologiaLabel = TIPOLOGIE_PROPRIETA.find(t => t.id === proprietaLead.tipologia)?.label || proprietaLead.tipologia || 'Non specificata'

  // Trova indice fase corrente
  const currentFaseIndex = FASI_PROPRIETA_LEAD.findIndex(f => f.id === proprietaLead.fase)
  const nextFase = currentFaseIndex < FASI_PROPRIETA_LEAD.length - 1 ? FASI_PROPRIETA_LEAD[currentFaseIndex + 1] : null
  const prevFase = currentFaseIndex > 0 ? FASI_PROPRIETA_LEAD[currentFaseIndex - 1] : null

  const handleDelete = () => {
    deleteProprietaLead.mutate(id, {
      onSuccess: () => router.back(),
    })
  }

  const handleConferma = () => {
    confermaProprietaLead.mutate(id, {
      onSuccess: () => {
        setConfermaDialogOpen(false)
        router.push('/proprieta')
      },
    })
  }

  const handleScarta = () => {
    if (!motivoScarto) return
    scartaProprietaLead.mutate(
      { id, motivo: motivoScarto },
      {
        onSuccess: () => {
          setScartaDialogOpen(false)
          setMotivoScarto('')
        },
      }
    )
  }

  const handleAvanzaFase = async () => {
    if (!nextFase) return
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'proprieta_lead',
        faseCorrente: proprietaLead.fase,
        nuovaFase: nextFase.id as FaseProprietaLead,
        entityId: id,
        contattoId: proprietaLead.contatto_id,
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
        tipoEntita: 'proprieta_lead',
        faseCorrente: proprietaLead.fase,
        nuovaFase: prevFase.id as FaseProprietaLead,
        entityId: id,
        contattoId: proprietaLead.contatto_id,
      })
    } catch (error) {
      if (error instanceof Error) {
        setFaseError(error.message)
      }
    }
  }

  const openEditDialog = () => {
    setEditForm({
      nome: proprietaLead.nome || '',
      indirizzo: proprietaLead.indirizzo || '',
      citta: proprietaLead.citta || '',
      cap: proprietaLead.cap || '',
      provincia: proprietaLead.provincia || '',
      tipologia: proprietaLead.tipologia || '',
      data_sopralluogo: proprietaLead.data_sopralluogo || '',
      revenue_stimato_annuo: proprietaLead.revenue_stimato_annuo?.toString() || '',
      commissione_proposta: proprietaLead.commissione_proposta?.toString() || '',
      note: proprietaLead.note || '',
      note_sopralluogo: proprietaLead.note_sopralluogo || '',
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    updateProprietaLead.mutate(
      {
        id,
        nome: editForm.nome,
        indirizzo: editForm.indirizzo,
        citta: editForm.citta,
        cap: editForm.cap || null,
        provincia: editForm.provincia || null,
        tipologia: editForm.tipologia as typeof proprietaLead.tipologia || null,
        data_sopralluogo: editForm.data_sopralluogo || null,
        revenue_stimato_annuo: editForm.revenue_stimato_annuo ? parseFloat(editForm.revenue_stimato_annuo) : null,
        commissione_proposta: editForm.commissione_proposta ? parseFloat(editForm.commissione_proposta) : null,
        note: editForm.note || null,
        note_sopralluogo: editForm.note_sopralluogo || null,
      },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    )
  }

  const isScartata = proprietaLead.esito === 'scartato'
  const isConfermata = proprietaLead.esito === 'confermato'

  return (
    <div className="container py-6 space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Torna indietro
      </Button>

      {/* Header */}
      <PageHeader
        title={proprietaLead.nome}
        description={`${proprietaLead.indirizzo}, ${proprietaLead.citta}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          </div>
        }
      />

      {/* Alert esito */}
      {isScartata && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Proprietà Scartata</AlertTitle>
          <AlertDescription>
            {proprietaLead.motivo_scartato || 'Nessun motivo specificato'}
          </AlertDescription>
        </Alert>
      )}

      {isConfermata && (
        <Alert className="border-green-500 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Proprietà Confermata</AlertTitle>
          <AlertDescription className="text-green-700">
            Questa proprietà è stata confermata e convertita in proprietà attiva.
          </AlertDescription>
        </Alert>
      )}

      {faseError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{faseError}</AlertDescription>
        </Alert>
      )}

      {/* Pipeline e Azioni */}
      {!isScartata && !isConfermata && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pipeline Valutazione</CardTitle>
                <CardDescription>
                  Fase attuale: {faseInfo?.label || proprietaLead.fase}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {prevFase && (
                  <Button variant="outline" onClick={handleTornaIndietro} disabled={cambioFase.isPending}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {prevFase.label}
                  </Button>
                )}
                {nextFase && (
                  <Button onClick={handleAvanzaFase} disabled={cambioFase.isPending}>
                    {nextFase.label}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-4">
              {FASI_PROPRIETA_LEAD.map((fase, index) => (
                <div key={fase.id} className="flex items-center flex-1">
                  <div
                    className={`h-2 flex-1 rounded-full ${
                      index <= currentFaseIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                  {index < FASI_PROPRIETA_LEAD.length - 1 && <div className="w-2" />}
                </div>
              ))}
            </div>

            {/* Fase labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              {FASI_PROPRIETA_LEAD.map((fase) => (
                <span
                  key={fase.id}
                  className={fase.id === proprietaLead.fase ? 'font-semibold text-primary' : ''}
                >
                  {fase.label}
                </span>
              ))}
            </div>

            {/* Azioni finali nella fase PL3 */}
            {proprietaLead.fase === 'PL3' && (
              <div className="mt-6 pt-4 border-t flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setScartaDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Scarta Proprietà
                </Button>
                <Button onClick={() => setConfermaDialogOpen(true)}>
                  <Check className="h-4 w-4 mr-2" />
                  Conferma e Converti
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informazioni */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Dettagli Proprietà */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dettagli Proprietà
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{proprietaLead.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipologia</p>
                <p className="font-medium capitalize">{tipologiaLabel}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Indirizzo
              </p>
              <p className="font-medium">{proprietaLead.indirizzo}</p>
              <p className="text-sm text-muted-foreground">
                {proprietaLead.cap} {proprietaLead.citta} ({proprietaLead.provincia})
              </p>
            </div>

            {proprietaLead.note && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p className="whitespace-pre-wrap">{proprietaLead.note}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Valutazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Valutazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data Sopralluogo</p>
                <p className="font-medium">
                  {proprietaLead.data_sopralluogo
                    ? formatDate(proprietaLead.data_sopralluogo)
                    : 'Non pianificato'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Esito</p>
                <EsitoBadge esito={proprietaLead.esito || 'in_corso'} tipo="proprieta_lead" />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Stimato Annuo</p>
                <p className="font-medium text-lg">
                  {proprietaLead.revenue_stimato_annuo
                    ? formatCurrency(proprietaLead.revenue_stimato_annuo)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commissione Proposta</p>
                <p className="font-medium text-lg">
                  {proprietaLead.commissione_proposta
                    ? `${proprietaLead.commissione_proposta}%`
                    : '-'}
                </p>
              </div>
            </div>

            {proprietaLead.investimento_richiesto && (
              <div>
                <p className="text-sm text-muted-foreground">Investimento Richiesto</p>
                <p className="font-medium">
                  {formatCurrency(proprietaLead.investimento_richiesto)}
                </p>
              </div>
            )}

            {proprietaLead.note_sopralluogo && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Note Sopralluogo</p>
                  <p className="whitespace-pre-wrap">{proprietaLead.note_sopralluogo}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Proprietario */}
        {proprietaLead.contatto && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Proprietario (Lead)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/lead/${proprietaLead.contatto_id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {proprietaLead.contatto.nome} {proprietaLead.contatto.cognome}
                  </p>
                  <p className="text-sm text-muted-foreground">{proprietaLead.contatto.email}</p>
                  {proprietaLead.contatto.telefono && (
                    <p className="text-sm text-muted-foreground">{proprietaLead.contatto.telefono}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Elimina */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Proprietà Lead"
        description="Sei sicuro di voler eliminare questa proprietà? L'azione è irreversibile."
        confirmText="Elimina"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteProprietaLead.isPending}
      />

      {/* Dialog Conferma */}
      <Dialog open={confermaDialogOpen} onOpenChange={setConfermaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Proprietà</DialogTitle>
            <DialogDescription>
              Confermi di voler convertire questa proprietà lead in una proprietà attiva?
              Il lead associato potrà poi essere convertito in cliente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfermaDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleConferma} disabled={confermaProprietaLead.isPending}>
              {confermaProprietaLead.isPending ? 'Conversione...' : 'Conferma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Scarta */}
      <Dialog open={scartaDialogOpen} onOpenChange={setScartaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scarta Proprietà</DialogTitle>
            <DialogDescription>
              Indica il motivo per cui questa proprietà non è idonea.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              placeholder="Es. Proprietà non adatta per affitti brevi..."
              value={motivoScarto}
              onChange={(e) => setMotivoScarto(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScartaDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleScarta}
              disabled={!motivoScarto || scartaProprietaLead.isPending}
            >
              {scartaProprietaLead.isPending ? 'Salvataggio...' : 'Scarta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Proprietà Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input
                  id="edit-nome"
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tipologia">Tipologia</Label>
                <Select
                  value={editForm.tipologia}
                  onValueChange={(value) => setEditForm({ ...editForm, tipologia: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipologia" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOLOGIE_PROPRIETA.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-indirizzo">Indirizzo</Label>
              <Input
                id="edit-indirizzo"
                value={editForm.indirizzo}
                onChange={(e) => setEditForm({ ...editForm, indirizzo: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-citta">Città</Label>
                <Input
                  id="edit-citta"
                  value={editForm.citta}
                  onChange={(e) => setEditForm({ ...editForm, citta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cap">CAP</Label>
                <Input
                  id="edit-cap"
                  value={editForm.cap}
                  onChange={(e) => setEditForm({ ...editForm, cap: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-provincia">Provincia</Label>
                <Input
                  id="edit-provincia"
                  value={editForm.provincia}
                  onChange={(e) => setEditForm({ ...editForm, provincia: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sopralluogo">Data Sopralluogo</Label>
                <Input
                  id="edit-sopralluogo"
                  type="date"
                  value={editForm.data_sopralluogo}
                  onChange={(e) => setEditForm({ ...editForm, data_sopralluogo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-revenue">Revenue Annuo (€)</Label>
                <Input
                  id="edit-revenue"
                  type="number"
                  value={editForm.revenue_stimato_annuo}
                  onChange={(e) => setEditForm({ ...editForm, revenue_stimato_annuo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-commissione">Commissione (%)</Label>
                <Input
                  id="edit-commissione"
                  type="number"
                  value={editForm.commissione_proposta}
                  onChange={(e) => setEditForm({ ...editForm, commissione_proposta: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note-sopralluogo">Note Sopralluogo</Label>
              <Textarea
                id="edit-note-sopralluogo"
                value={editForm.note_sopralluogo}
                onChange={(e) => setEditForm({ ...editForm, note_sopralluogo: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note">Note Generali</Label>
              <Textarea
                id="edit-note"
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateProprietaLead.isPending}>
              {updateProprietaLead.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
