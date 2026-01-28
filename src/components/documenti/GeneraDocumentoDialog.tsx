'use client'

import { useState, useMemo } from 'react'
import { FileText, Loader2, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDocumentTemplates } from '@/lib/hooks/useDocumentTemplates'
import { useCreateDocumentoGenerato } from '@/lib/hooks/useDocumentiGenerati'
import { usePropertyManager } from '@/lib/hooks/use-property-manager'
import { TemplatePreview } from '@/components/templates/preview/TemplatePreview'
import { generateAndUploadPdf, downloadPdf } from '@/lib/pdf'
import type { TemplateContext, PropostaItem } from '@/lib/services/template-resolver'
import type { Contatto, Proprieta, CategoriaTemplate } from '@/types/database'
import { CATEGORIE_TEMPLATE } from '@/constants'
import { toast } from 'sonner'

interface GeneraDocumentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: CategoriaTemplate
  cliente?: Contatto | null
  proprieta?: Proprieta | null
  proposta?: {
    id: string
    numero?: string
    data?: string
    totale?: number
    subtotale?: number
    sconto_percentuale?: number
    sconto_fisso?: number
    items?: Array<{
      nome: string
      descrizione?: string | null
      quantita: number
      prezzo_unitario: number
      prezzo_totale: number
    }>
  } | null
  onSuccess?: () => void
}

export function GeneraDocumentoDialog({
  open,
  onOpenChange,
  categoria,
  cliente,
  proprieta,
  proposta,
  onSuccess,
}: GeneraDocumentoDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [titolo, setTitolo] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch templates per la categoria
  const { data: templates, isLoading: templatesLoading } = useDocumentTemplates({ categoria, attivo: true })
  const { data: azienda } = usePropertyManager()
  const createDocumento = useCreateDocumentoGenerato()

  // Template selezionato
  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId && templates?.length) {
      // Seleziona il template predefinito o il primo disponibile
      const defaultTemplate = templates.find(t => t.predefinito) || templates[0]
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id)
        return defaultTemplate
      }
    }
    return templates?.find(t => t.id === selectedTemplateId)
  }, [selectedTemplateId, templates])

  // Calcola sconto totale
  const scontoTotale = useMemo(() => {
    if (!proposta) return 0
    const scontoPerc = proposta.sconto_percentuale
      ? (proposta.subtotale || 0) * (proposta.sconto_percentuale / 100)
      : 0
    return scontoPerc + (proposta.sconto_fisso || 0)
  }, [proposta])

  // Contesto per il template
  const templateContext: TemplateContext = useMemo(() => ({
    azienda: azienda || null,
    cliente: cliente || null,
    proprieta: proprieta || null,
    proposta: proposta ? {
      numero: proposta.numero,
      data: proposta.data || new Date().toISOString(),
      totale: proposta.totale,
      subtotale: proposta.subtotale,
      sconto: scontoTotale,
      items: proposta.items as PropostaItem[],
    } : null,
    documento: {
      numero: '', // Verrà generato dal DB
      data: new Date().toISOString(),
      scadenza: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 giorni
    },
  }), [azienda, cliente, proprieta, proposta, scontoTotale])

  // Titolo default
  const titoloDefault = useMemo(() => {
    const catLabel = CATEGORIE_TEMPLATE.find(c => c.id === categoria)?.label || categoria
    if (proprieta?.nome) {
      return `${catLabel} - ${proprieta.nome}`
    }
    if (cliente) {
      return `${catLabel} - ${cliente.nome} ${cliente.cognome}`
    }
    return catLabel
  }, [categoria, cliente, proprieta])

  const handleGenera = async () => {
    if (!selectedTemplate) {
      toast.error('Seleziona un template')
      return
    }

    setIsGenerating(true)

    try {
      const documentTitle = titolo || titoloDefault
      const templateContent = selectedTemplate.contenuto as Record<string, unknown>

      // 1. Genera e carica il PDF
      const { url: fileUrl, storagePath } = await generateAndUploadPdf({
        content: templateContent,
        context: templateContext,
        fileName: documentTitle,
        showHeaderFooter: true,
      })

      // 2. Crea il record nel database con l'URL del PDF
      await createDocumento.mutateAsync({
        template_id: selectedTemplate.id,
        template_nome: selectedTemplate.nome,
        template_versione: selectedTemplate.versione,
        contatto_id: cliente?.id,
        proprieta_id: proprieta?.id,
        proposta_id: proposta?.id,
        titolo: documentTitle,
        categoria: categoria,
        stato: 'generato',
        file_url: fileUrl,
        file_nome: `${documentTitle}.pdf`,
        dati_snapshot: {
          cliente: cliente ? {
            nome: cliente.nome,
            cognome: cliente.cognome,
            email: cliente.email,
            telefono: cliente.telefono,
            indirizzo: cliente.indirizzo,
            citta: cliente.citta,
            cap: cliente.cap,
            codice_fiscale: cliente.codice_fiscale,
            partita_iva: cliente.partita_iva,
          } : null,
          proprieta: proprieta ? {
            nome: proprieta.nome,
            indirizzo: proprieta.indirizzo,
            citta: proprieta.citta,
            tipologia: proprieta.tipologia,
          } : null,
          proposta: proposta ? {
            numero: proposta.numero,
            totale: proposta.totale,
            subtotale: proposta.subtotale,
            sconto: scontoTotale,
            items: proposta.items,
          } : null,
          azienda: azienda ? {
            nome: azienda.nome_commerciale || azienda.ragione_sociale,
            email: azienda.email,
            telefono: azienda.telefono,
          } : null,
          storage_path: storagePath,
        },
      })

      toast.success('Documento generato e salvato con successo')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Errore generazione documento:', error)
      toast.error('Errore nella generazione del documento')
    } finally {
      setIsGenerating(false)
    }
  }

  // Download diretto senza salvare nel DB
  const handleDownloadPreview = async () => {
    if (!selectedTemplate) return

    try {
      setIsGenerating(true)
      await downloadPdf({
        content: selectedTemplate.contenuto as Record<string, unknown>,
        context: templateContext,
        fileName: titolo || titoloDefault,
        showHeaderFooter: true,
      })
      toast.success('PDF scaricato')
    } catch (error) {
      console.error('Errore download PDF:', error)
      toast.error('Errore nel download del PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setSelectedTemplateId('')
    setTitolo('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Genera {CATEGORIE_TEMPLATE.find(c => c.id === categoria)?.label}
          </DialogTitle>
          <DialogDescription>
            Genera un documento usando il template selezionato
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-[300px_1fr] gap-4">
          {/* Sidebar configurazione */}
          <div className="space-y-4 overflow-y-auto pr-2">
            {/* Selezione template */}
            <div className="space-y-2">
              <Label>Template</Label>
              {templatesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento...
                </div>
              ) : templates?.length ? (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome} {t.predefinito && '(Predefinito)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-amber-600">
                  Nessun template attivo per questa categoria
                </p>
              )}
            </div>

            {/* Titolo documento */}
            <div className="space-y-2">
              <Label htmlFor="titolo">Titolo documento</Label>
              <Input
                id="titolo"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder={titoloDefault}
              />
            </div>

            {/* Info contesto */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Dati documento</h4>

              {cliente && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Cliente:</span>{' '}
                  <span className="font-medium">{cliente.nome} {cliente.cognome}</span>
                </div>
              )}

              {proprieta && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Proprietà:</span>{' '}
                  <span className="font-medium">{proprieta.nome}</span>
                </div>
              )}

              {proposta && (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Proposta:</span>{' '}
                    <span className="font-medium">{proposta.numero}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Totale:</span>{' '}
                    <span className="font-medium">
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(proposta.totale || 0)}
                    </span>
                  </div>
                  {proposta.items && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Servizi:</span>{' '}
                      <span className="font-medium">{proposta.items.length}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-y-auto border rounded-lg bg-white">
            {selectedTemplate ? (
              <TemplatePreview
                content={selectedTemplate.contenuto as Record<string, unknown>}
                context={templateContext}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Seleziona un template per vedere l&apos;anteprima
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Annulla
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPreview}
            disabled={!selectedTemplate || isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            Scarica Anteprima
          </Button>
          <Button
            onClick={handleGenera}
            disabled={!selectedTemplate || isGenerating || createDocumento.isPending}
          >
            {isGenerating || createDocumento.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generazione PDF...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Genera e Salva
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
