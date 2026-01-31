'use client'

import { useState, useRef } from 'react'
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  FileUp,
  Trash2,
  ExternalLink,
  RefreshCw,
  Plus,
  Info,
  Link2,
  Euro,
  Calendar,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared'
import {
  useDocumentiByProprieta,
  useCreateDocumento,
  useUpdateDocumento,
  useDeleteDocumento,
  useUploadDocumentoFile
} from '@/lib/hooks'
import type { Documento, StatoDocumento, CategoriaDocumento } from '@/types/database'
import { cn } from '@/lib/utils'
import { getDocumentoWikiByNome, type DocumentoWiki } from '@/constants/documenti-wiki'

interface DocumentiSectionProps {
  proprietaId: string
  faseProprieta: string
}

const STATI_DOCUMENTO: { id: StatoDocumento; label: string; color: string; icon: typeof CheckCircle2 }[] = [
  { id: 'mancante', label: 'Mancante', color: 'text-gray-500 bg-gray-50', icon: XCircle },
  { id: 'richiesto', label: 'Richiesto', color: 'text-amber-600 bg-amber-50', icon: Clock },
  { id: 'ricevuto', label: 'Ricevuto', color: 'text-blue-600 bg-blue-50', icon: FileUp },
  { id: 'verificato', label: 'Verificato', color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
  { id: 'scaduto', label: 'Scaduto', color: 'text-red-600 bg-red-50', icon: AlertCircle },
]

const CATEGORIE_DOCUMENTO: { id: CategoriaDocumento; label: string }[] = [
  { id: 'identita', label: 'Identità' },
  { id: 'fiscale', label: 'Fiscale' },
  { id: 'proprieta', label: 'Proprietà' },
  { id: 'certificazioni', label: 'Certificazioni' },
  { id: 'contratti', label: 'Contratti' },
  { id: 'legale', label: 'Legale' },
  { id: 'operativo', label: 'Operativo' },
]

// Mappatura documenti per fase proprietà
type DocumentoRichiesto = {
  nome: string
  categoria: CategoriaDocumento
  obbligatorio: boolean
  descrizione?: string
}

const DOCUMENTI_PER_FASE: Record<string, DocumentoRichiesto[]> = {
  // P0: Lead/Valutazione - Documenti base per valutazione
  P0: [
    { nome: 'Documento identità proprietario', categoria: 'identita', obbligatorio: true, descrizione: 'CI o passaporto del proprietario' },
    { nome: 'Codice fiscale proprietario', categoria: 'fiscale', obbligatorio: true },
    { nome: 'Visura catastale', categoria: 'proprieta', obbligatorio: true, descrizione: 'Visura storica o attuale' },
    { nome: 'Planimetria catastale', categoria: 'proprieta', obbligatorio: true },
  ],

  // P1: Onboarding - Documenti per contratto e setup iniziale
  P1: [
    { nome: 'Atto di proprietà o contratto locazione', categoria: 'proprieta', obbligatorio: true, descrizione: 'Titolo che abilita alla sublocazione' },
    { nome: 'APE (Attestato Prestazione Energetica)', categoria: 'certificazioni', obbligatorio: true },
    { nome: 'Contratto di gestione firmato', categoria: 'contratti', obbligatorio: true },
    { nome: 'Delega operativa', categoria: 'contratti', obbligatorio: true, descrizione: 'Delega per pratiche burocratiche' },
    { nome: 'Modulo privacy GDPR firmato', categoria: 'contratti', obbligatorio: true },
    { nome: 'Coordinate bancarie proprietario', categoria: 'fiscale', obbligatorio: true, descrizione: 'IBAN per accrediti' },
    { nome: 'Regolamento condominiale', categoria: 'proprieta', obbligatorio: false, descrizione: 'Se applicabile' },
  ],

  // P2: Setup Legale - Pratiche burocratiche
  P2: [
    { nome: 'SCIA protocollata', categoria: 'legale', obbligatorio: true, descrizione: 'Segnalazione Certificata Inizio Attività' },
    { nome: 'Ricevuta SCIA SUAP', categoria: 'legale', obbligatorio: true },
    { nome: 'CIR - Codice Identificativo Regionale', categoria: 'legale', obbligatorio: true },
    { nome: 'Certificato CIR', categoria: 'certificazioni', obbligatorio: true },
    { nome: 'CIN - Codice Identificativo Nazionale', categoria: 'legale', obbligatorio: true },
    { nome: 'Certificato CIN', categoria: 'certificazioni', obbligatorio: true },
    { nome: 'Abilitazione ROSS 1000', categoria: 'operativo', obbligatorio: true, descrizione: 'Portale Alloggiati Web' },
    { nome: 'Registrazione Alloggiati Web', categoria: 'operativo', obbligatorio: true },
    { nome: 'Registrazione ISTAT iniziale', categoria: 'operativo', obbligatorio: true },
    { nome: 'Certificato conformità impianto elettrico', categoria: 'certificazioni', obbligatorio: true },
    { nome: 'Certificato conformità impianto gas', categoria: 'certificazioni', obbligatorio: false, descrizione: 'Se presente impianto gas' },
  ],

  // P3: Setup Operativo - Preparazione per Go-Live
  P3: [
    { nome: 'Foto professionali immobile', categoria: 'operativo', obbligatorio: true },
    { nome: 'Foto drone/esterni', categoria: 'operativo', obbligatorio: false },
    { nome: 'Welcome Book digitale', categoria: 'operativo', obbligatorio: true, descrizione: 'Guida per gli ospiti' },
    { nome: 'Inventario arredi e dotazioni', categoria: 'operativo', obbligatorio: true },
    { nome: 'Istruzioni elettrodomestici', categoria: 'operativo', obbligatorio: false },
    { nome: 'Contratto pulizie', categoria: 'contratti', obbligatorio: false, descrizione: 'Se servizio esternalizzato' },
    { nome: 'Contratto lavanderia', categoria: 'contratti', obbligatorio: false, descrizione: 'Se servizio esternalizzato' },
    { nome: 'Targhetta CIN esposta', categoria: 'certificazioni', obbligatorio: true, descrizione: 'Foto targhetta affissa' },
    { nome: 'Estintore certificato', categoria: 'certificazioni', obbligatorio: true },
    { nome: 'Rilevatore gas/fumo', categoria: 'certificazioni', obbligatorio: true },
  ],

  // P4: Operativa - Documenti per gestione corrente
  P4: [
    { nome: 'Polizza assicurativa RC', categoria: 'certificazioni', obbligatorio: true, descrizione: 'Responsabilità civile verso ospiti' },
    { nome: 'Polizza danni immobile', categoria: 'certificazioni', obbligatorio: false },
    { nome: 'Verbale consegna chiavi', categoria: 'operativo', obbligatorio: false },
    { nome: 'Registro manutenzioni', categoria: 'operativo', obbligatorio: false },
  ],

  // P5: Cessata - Documenti di chiusura
  P5: [
    { nome: 'Verbale riconsegna immobile', categoria: 'operativo', obbligatorio: true },
    { nome: 'Chiusura SCIA', categoria: 'legale', obbligatorio: true },
    { nome: 'Rendiconto finale', categoria: 'fiscale', obbligatorio: true },
    { nome: 'Disdetta contratto gestione', categoria: 'contratti', obbligatorio: true },
  ],
}

// Helper: ottiene tutti i documenti richiesti fino alla fase corrente (cumulativo)
function getDocumentiFinoAFase(fase: string): DocumentoRichiesto[] {
  const ordine = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5']
  const indice = ordine.indexOf(fase)
  if (indice === -1) return []

  const documenti: DocumentoRichiesto[] = []
  const nomiVisti = new Set<string>()

  for (let i = 0; i <= indice; i++) {
    const faseDocs = DOCUMENTI_PER_FASE[ordine[i]] || []
    for (const doc of faseDocs) {
      if (!nomiVisti.has(doc.nome)) {
        nomiVisti.add(doc.nome)
        documenti.push(doc)
      }
    }
  }

  return documenti
}

// Helper: ottiene solo i documenti della fase corrente
function getDocumentiFaseCorrente(fase: string): DocumentoRichiesto[] {
  return DOCUMENTI_PER_FASE[fase] || []
}

// Helper: label descrittiva per fase
const FASI_LABELS: Record<string, string> = {
  P0: 'Valutazione',
  P1: 'Onboarding',
  P2: 'Setup Legale',
  P3: 'Setup Operativo',
  P4: 'Operativa',
  P5: 'Cessata',
}

export function DocumentiSection({ proprietaId, faseProprieta }: DocumentiSectionProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null)
  const [deleteDocumentoId, setDeleteDocumentoId] = useState<string | null>(null)
  const [addDocumentoOpen, setAddDocumentoOpen] = useState(false)
  const [newDocumento, setNewDocumento] = useState({ nome: '', categoria: 'legale' as CategoriaDocumento })
  const [wikiDialogOpen, setWikiDialogOpen] = useState(false)
  const [selectedWikiDoc, setSelectedWikiDoc] = useState<DocumentoWiki | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Apre il dialog wiki per un documento
  const openWikiDialog = (nomeDocumento: string) => {
    const wiki = getDocumentoWikiByNome(nomeDocumento)
    if (wiki) {
      setSelectedWikiDoc(wiki)
      setWikiDialogOpen(true)
    }
  }

  const { data: documenti, isLoading, refetch } = useDocumentiByProprieta(proprietaId)
  const createDocumento = useCreateDocumento()
  const updateDocumento = useUpdateDocumento()
  const deleteDocumento = useDeleteDocumento()
  const uploadFile = useUploadDocumentoFile()

  // Statistiche
  const stats = {
    totale: documenti?.length || 0,
    mancanti: documenti?.filter(d => d.stato === 'mancante').length || 0,
    richiesti: documenti?.filter(d => d.stato === 'richiesto').length || 0,
    ricevuti: documenti?.filter(d => d.stato === 'ricevuto').length || 0,
    verificati: documenti?.filter(d => d.stato === 'verificato').length || 0,
    scaduti: documenti?.filter(d => d.stato === 'scaduto').length || 0,
  }

  const obbligatoriCompletati = documenti?.filter(d => d.obbligatorio && (d.stato === 'verificato' || d.stato === 'ricevuto')).length || 0
  const obbligatoriTotali = documenti?.filter(d => d.obbligatorio).length || 0
  const progressPercentuale = obbligatoriTotali > 0 ? Math.round((obbligatoriCompletati / obbligatoriTotali) * 100) : 0

  const getStatoConfig = (stato: StatoDocumento) => {
    return STATI_DOCUMENTO.find(s => s.id === stato) || STATI_DOCUMENTO[0]
  }

  const handleFileUpload = async (file: File) => {
    if (!selectedDocumento) return

    try {
      await uploadFile.mutateAsync({
        documentoId: selectedDocumento.id,
        proprietaId,
        file,
      })
      setUploadDialogOpen(false)
      setSelectedDocumento(null)
    } catch (error) {
      console.error('Errore upload:', error)
    }
  }

  const handleCambiaStato = async (documentoId: string, nuovoStato: StatoDocumento) => {
    try {
      await updateDocumento.mutateAsync({
        id: documentoId,
        stato: nuovoStato,
      })
    } catch (error) {
      console.error('Errore cambio stato:', error)
    }
  }

  const handleDeleteDocumento = async () => {
    if (!deleteDocumentoId) return
    try {
      await deleteDocumento.mutateAsync({
        id: deleteDocumentoId,
        proprietaId,
      })
      setDeleteDocumentoId(null)
    } catch (error) {
      console.error('Errore eliminazione:', error)
    }
  }

  const handleAddDocumento = async () => {
    if (!newDocumento.nome.trim()) return
    try {
      await createDocumento.mutateAsync({
        proprieta_id: proprietaId,
        contatto_id: null,
        template_id: null,
        nome: newDocumento.nome,
        descrizione: null,
        categoria: newDocumento.categoria,
        obbligatorio: false,
        stato: 'mancante',
        file_url: null,
        file_name: null,
        file_size: null,
        data_scadenza: null,
        data_caricamento: null,
        data_verifica: null,
        verificato_da: null,
        note: null,
      })
      setAddDocumentoOpen(false)
      setNewDocumento({ nome: '', categoria: 'legale' })
    } catch (error) {
      console.error('Errore creazione documento:', error)
    }
  }

  // Helper per normalizzare i nomi dei documenti (per confronto)
  const normalizzaNome = (nome: string): string => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
      .replace(/[^a-z0-9]/g, '') // rimuove caratteri speciali
  }

  const handleGeneraDocumentiMancanti = async (soloFaseCorrente: boolean = false) => {
    // Ottiene i documenti richiesti in base alla modalità
    const documentiRichiesti = soloFaseCorrente
      ? getDocumentiFaseCorrente(faseProprieta)
      : getDocumentiFinoAFase(faseProprieta)

    // Trova documenti richiesti che non esistono ancora (confronto normalizzato)
    const esistentiNormalizzati = new Set(
      documenti?.map(d => normalizzaNome(d.nome)) || []
    )
    const mancanti = documentiRichiesti.filter(
      doc => !esistentiNormalizzati.has(normalizzaNome(doc.nome))
    )

    if (mancanti.length === 0) {
      return // Nessun documento da creare
    }

    for (const doc of mancanti) {
      try {
        await createDocumento.mutateAsync({
          proprieta_id: proprietaId,
          contatto_id: null,
          template_id: null,
          nome: doc.nome,
          descrizione: doc.descrizione || null,
          categoria: doc.categoria,
          obbligatorio: doc.obbligatorio,
          stato: 'mancante',
          file_url: null,
          file_name: null,
          file_size: null,
          data_scadenza: null,
          data_caricamento: null,
          data_verifica: null,
          verificato_da: null,
          note: null,
        })
      } catch (error) {
        console.error('Errore creazione documento:', error)
      }
    }

    refetch()
  }

  // Raggruppa documenti per categoria
  const documentiPerCategoria = documenti?.reduce((acc, doc) => {
    if (!acc[doc.categoria]) {
      acc[doc.categoria] = []
    }
    acc[doc.categoria].push(doc)
    return acc
  }, {} as Record<string, Documento[]>) || {}

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
      {/* Header con statistiche */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documenti Proprietà
              </CardTitle>
              <CardDescription>
                Gestisci i documenti richiesti per questa proprietà
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddDocumentoOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Progress */}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Documenti obbligatori completati</span>
              <span className="font-medium">{obbligatoriCompletati}/{obbligatoriTotali}</span>
            </div>
            <Progress value={progressPercentuale} className="h-2" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{stats.totale}</div>
              <div className="text-xs text-muted-foreground">Totale</div>
            </div>
            {STATI_DOCUMENTO.map(stato => (
              <div key={stato.id} className={cn("text-center p-2 rounded-lg", stato.color)}>
                <div className="text-lg font-bold">{stats[`${stato.id === 'mancante' ? 'mancanti' : stato.id === 'richiesto' ? 'richiesti' : stato.id === 'ricevuto' ? 'ricevuti' : stato.id === 'verificato' ? 'verificati' : 'scaduti'}` as keyof typeof stats] || 0}</div>
                <div className="text-xs">{stato.label}</div>
              </div>
            ))}
          </div>

          {/* Bottoni genera documenti */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleGeneraDocumentiMancanti(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Genera documenti fase {FASI_LABELS[faseProprieta] || faseProprieta}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleGeneraDocumentiMancanti(false)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Genera tutti fino a fase corrente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info documenti richiesti per fase corrente */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-900">
            Documenti richiesti per fase {FASI_LABELS[faseProprieta] || faseProprieta}
          </CardTitle>
          <CardDescription className="text-blue-700">
            Elenco dei documenti necessari per completare questa fase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {getDocumentiFaseCorrente(faseProprieta).map((doc, index) => {
              const esistente = documenti?.find(d => d.nome.toLowerCase() === doc.nome.toLowerCase())
              const completato = esistente && (esistente.stato === 'verificato' || esistente.stato === 'ricevuto')

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded text-sm group cursor-pointer hover:bg-blue-100 transition-colors",
                    completato ? "bg-green-100 text-green-800" : "bg-white"
                  )}
                  onClick={() => openWikiDialog(doc.nome)}
                  title="Clicca per vedere procedura e dettagli"
                >
                  {completato ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className={cn("font-medium", completato && "line-through opacity-70")}>
                        {doc.nome}
                      </span>
                      <Info className="h-3 w-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {doc.obbligatorio && (
                      <Badge variant="outline" className="text-xs py-0 mt-1">
                        Obbligatorio
                      </Badge>
                    )}
                    {doc.descrizione && (
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.descrizione}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {getDocumentiFaseCorrente(faseProprieta).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun documento specifico richiesto per questa fase
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista documenti per categoria */}
      {Object.entries(documentiPerCategoria).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessun documento</h3>
            <p className="text-muted-foreground mb-4">
              Non ci sono ancora documenti per questa proprietà.
              La proprietà è in fase <strong>{FASI_LABELS[faseProprieta] || faseProprieta}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => handleGeneraDocumentiMancanti(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Genera documenti fase {FASI_LABELS[faseProprieta] || faseProprieta}
              </Button>
              <Button variant="outline" onClick={() => handleGeneraDocumentiMancanti(false)}>
                <Plus className="h-4 w-4 mr-2" />
                Genera tutti documenti necessari
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(documentiPerCategoria).map(([categoria, docs]) => (
          <Card key={categoria}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">
                {CATEGORIE_DOCUMENTO.find(c => c.id === categoria)?.label || categoria}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {docs.map(doc => {
                  const statoConfig = getStatoConfig(doc.stato)
                  const StatoIcon = statoConfig.icon

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <StatoIcon className={cn("h-5 w-5 flex-shrink-0", statoConfig.color.split(' ')[0])} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{doc.nome}</span>
                          {doc.obbligatorio && (
                            <Badge variant="outline" className="text-xs">Obbligatorio</Badge>
                          )}
                        </div>
                        {doc.file_name && (
                          <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Bottone info wiki */}
                        {getDocumentoWikiByNome(doc.nome) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            onClick={() => openWikiDialog(doc.nome)}
                            title="Vedi procedura e info"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Selector stato */}
                        <Select
                          value={doc.stato}
                          onValueChange={(value) => handleCambiaStato(doc.id, value as StatoDocumento)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATI_DOCUMENTO.map(stato => (
                              <SelectItem key={stato.id} value={stato.id}>
                                {stato.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Azioni */}
                        {doc.file_url ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(doc.file_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedDocumento(doc)
                              setUploadDialogOpen(true)
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDocumentoId(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog upload file */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carica documento</DialogTitle>
            <DialogDescription>
              {selectedDocumento?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Clicca per selezionare un file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, immagini o documenti (max 10MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog aggiungi documento */}
      <Dialog open={addDocumentoOpen} onOpenChange={setAddDocumentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi documento</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo documento alla proprietà
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome documento</Label>
              <Input
                value={newDocumento.nome}
                onChange={(e) => setNewDocumento(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Es. Visura catastale"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={newDocumento.categoria}
                onValueChange={(value) => setNewDocumento(prev => ({ ...prev, categoria: value as CategoriaDocumento }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIE_DOCUMENTO.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddDocumento}>
              Aggiungi documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma eliminazione */}
      <ConfirmDialog
        open={!!deleteDocumentoId}
        onOpenChange={(open) => !open && setDeleteDocumentoId(null)}
        title="Elimina documento"
        description="Sei sicuro di voler eliminare questo documento? L'azione non può essere annullata."
        confirmText="Elimina"
        onConfirm={handleDeleteDocumento}
        variant="destructive"
      />

      {/* Dialog Wiki Documento */}
      <Dialog open={wikiDialogOpen} onOpenChange={setWikiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedWikiDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedWikiDoc.nome}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge variant="outline">{FASI_LABELS[selectedWikiDoc.fase]}</Badge>
                  <Badge variant={selectedWikiDoc.obbligatorio ? "default" : "secondary"}>
                    {selectedWikiDoc.obbligatorio ? 'Obbligatorio' : 'Facoltativo'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {CATEGORIE_DOCUMENTO.find(c => c.id === selectedWikiDoc.categoria)?.label}
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Descrizione */}
                <div>
                  <h4 className="font-semibold text-sm mb-1">Descrizione</h4>
                  <p className="text-sm text-muted-foreground">{selectedWikiDoc.descrizione}</p>
                </div>

                {/* Procedura */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Procedura
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {selectedWikiDoc.procedura.map((step, index) => (
                      <li key={index} className="text-sm text-muted-foreground pl-2">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Info aggiuntive */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedWikiDoc.tempiStimati && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        Tempi
                      </div>
                      <p className="text-sm font-medium">{selectedWikiDoc.tempiStimati}</p>
                    </div>
                  )}
                  {selectedWikiDoc.costo && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Euro className="h-3 w-3" />
                        Costo
                      </div>
                      <p className="text-sm font-medium">{selectedWikiDoc.costo}</p>
                    </div>
                  )}
                  {selectedWikiDoc.scadenza && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Scadenza
                      </div>
                      <p className="text-sm font-medium">{selectedWikiDoc.scadenza}</p>
                    </div>
                  )}
                </div>

                {/* Note */}
                {selectedWikiDoc.note && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <h4 className="font-semibold text-sm mb-1 text-amber-800 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Note importanti
                    </h4>
                    <p className="text-sm text-amber-700">{selectedWikiDoc.note}</p>
                  </div>
                )}

                {/* Link utili */}
                {selectedWikiDoc.linkUtili && selectedWikiDoc.linkUtili.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Link utili
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedWikiDoc.linkUtili.map((link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {link.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documenti correlati */}
                {selectedWikiDoc.documentiCorrelati && selectedWikiDoc.documentiCorrelati.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Documenti correlati</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedWikiDoc.documentiCorrelati.map((docId, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {docId.replace('doc_', '').replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
