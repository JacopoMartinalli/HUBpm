'use client'

import { useState, useMemo } from 'react'
import {
  Package,
  Wrench,
  Plus,
  Trash2,
  Check,
  ChevronDown
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  usePacchettiServiziAttivi,
  useCatalogoServiziAttivi,
  useCreateProposta,
  useAddPropostaItem
} from '@/lib/hooks'
import { useCreateDocumentoGenerato } from '@/lib/hooks/useDocumentiGenerati'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { PacchettoServizio, CatalogoServizio, CategoriaTemplate } from '@/types/database'
import { toast } from 'sonner'

interface CreaPropostaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proprietaId: string
  contattoId: string
  onSuccess?: (propostaId: string) => void
}

interface SelectedItem {
  tipo: 'pacchetto' | 'servizio'
  id: string
  nome: string
  descrizione?: string | null
  prezzo: number
  quantita: number
}

export function CreaPropostaDialog({
  open,
  onOpenChange,
  proprietaId,
  contattoId,
  onSuccess
}: CreaPropostaDialogProps) {
  const [titolo, setTitolo] = useState('')
  const [noteCliente, setNoteCliente] = useState('')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [scontoPercentuale, setScontoPercentuale] = useState('')
  const [scontoFisso, setScontoFisso] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pacchettiOpen, setPacchettiOpen] = useState(true)
  const [serviziOpen, setServiziOpen] = useState(false)

  const { data: pacchetti, isLoading: loadingPacchetti } = usePacchettiServiziAttivi()
  const { data: servizi, isLoading: loadingServizi } = useCatalogoServiziAttivi()

  const createProposta = useCreateProposta()
  const addItem = useAddPropostaItem()
  const createDocumento = useCreateDocumentoGenerato()

  // Funzione per recuperare il template predefinito di una categoria
  const getDefaultTemplate = async (categoria: CategoriaTemplate) => {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .eq('categoria', categoria)
      .eq('attivo', true)
      .order('predefinito', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data
  }

  // Funzione per generare documenti automaticamente
  const generaDocumentiAutomatici = async (
    propostaId: string,
    propostaNumero: string,
    contattoId: string,
    proprietaId: string,
    items: SelectedItem[],
    subtotale: number,
    scontoPerc: number,
    scontoFissoVal: number,
    totale: number
  ) => {
    const categorieDaGenerare: CategoriaTemplate[] = ['proposta', 'preventivo']

    for (const categoria of categorieDaGenerare) {
      const template = await getDefaultTemplate(categoria)

      if (!template) {
        console.warn(`Nessun template attivo trovato per categoria: ${categoria}`)
        continue
      }

      try {
        // Recupera i dati del contatto per lo snapshot
        const { data: contatto } = await supabase
          .from('contatti')
          .select('nome, cognome, email, telefono, indirizzo, citta, cap, codice_fiscale, partita_iva')
          .eq('id', contattoId)
          .single()

        // Recupera i dati della proprietà per lo snapshot
        const { data: proprieta } = await supabase
          .from('proprieta')
          .select('nome, indirizzo, citta, tipologia')
          .eq('id', proprietaId)
          .single()

        // Recupera i dati dell'azienda
        const { data: azienda } = await supabase
          .from('property_managers')
          .select('nome_commerciale, ragione_sociale, email, telefono')
          .eq('tenant_id', DEFAULT_TENANT_ID)
          .single()

        const categoriaLabel = categoria === 'proposta' ? 'Proposta Commerciale' : 'Preventivo'
        const titoloDocumento = proprieta?.nome
          ? `${categoriaLabel} - ${proprieta.nome}`
          : contatto
            ? `${categoriaLabel} - ${contatto.nome} ${contatto.cognome}`
            : categoriaLabel

        await createDocumento.mutateAsync({
          template_id: template.id,
          template_nome: template.nome,
          template_versione: template.versione,
          contatto_id: contattoId,
          proprieta_id: proprietaId,
          proposta_id: propostaId,
          titolo: titoloDocumento,
          categoria: categoria,
          stato: 'generato',
          data_generazione: new Date().toISOString(),
          dati_snapshot: {
            cliente: contatto ? {
              nome: contatto.nome,
              cognome: contatto.cognome,
              email: contatto.email,
              telefono: contatto.telefono,
              indirizzo: contatto.indirizzo,
              citta: contatto.citta,
              cap: contatto.cap,
              codice_fiscale: contatto.codice_fiscale,
              partita_iva: contatto.partita_iva,
            } : null,
            proprieta: proprieta ? {
              nome: proprieta.nome,
              indirizzo: proprieta.indirizzo,
              citta: proprieta.citta,
              tipologia: proprieta.tipologia,
            } : null,
            proposta: {
              numero: propostaNumero,
              totale: totale,
              subtotale: subtotale,
              sconto: subtotale * (scontoPerc / 100) + scontoFissoVal,
              items: items.map(item => ({
                nome: item.nome,
                descrizione: item.descrizione,
                quantita: item.quantita,
                prezzo_unitario: item.prezzo,
                prezzo_totale: item.prezzo * item.quantita,
              })),
            },
            azienda: azienda ? {
              nome: azienda.nome_commerciale || azienda.ragione_sociale,
              email: azienda.email,
              telefono: azienda.telefono,
            } : null,
          },
        })
      } catch (error) {
        console.error(`Errore generazione documento ${categoria}:`, error)
      }
    }
  }

  // Filtra servizi vendibili singolarmente
  const serviziSingoli = useMemo(() => {
    return servizi?.filter(s => s.vendibile_singolarmente) || []
  }, [servizi])

  // Calcola totali
  const subtotale = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.prezzo * item.quantita), 0)
  }, [selectedItems])

  const scontoPercValue = parseFloat(scontoPercentuale) || 0
  const scontoFissoValue = parseFloat(scontoFisso) || 0
  const totale = subtotale * (1 - scontoPercValue / 100) - scontoFissoValue

  const toggleItem = (tipo: 'pacchetto' | 'servizio', item: PacchettoServizio | CatalogoServizio) => {
    const exists = selectedItems.find(i => i.tipo === tipo && i.id === item.id)

    if (exists) {
      setSelectedItems(prev => prev.filter(i => !(i.tipo === tipo && i.id === item.id)))
    } else {
      setSelectedItems(prev => [
        ...prev,
        {
          tipo,
          id: item.id,
          nome: item.nome,
          descrizione: item.descrizione,
          prezzo: item.prezzo_base || 0,
          quantita: 1
        }
      ])
    }
  }

  const updateItemQuantita = (tipo: 'pacchetto' | 'servizio', id: string, quantita: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.tipo === tipo && item.id === id
          ? { ...item, quantita: Math.max(1, quantita) }
          : item
      )
    )
  }

  const updateItemPrezzo = (tipo: 'pacchetto' | 'servizio', id: string, prezzo: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.tipo === tipo && item.id === id
          ? { ...item, prezzo }
          : item
      )
    )
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return

    setIsSubmitting(true)
    try {
      // 1. Crea la proposta
      const proposta = await createProposta.mutateAsync({
        proprieta_id: proprietaId,
        contatto_id: contattoId,
        titolo: titolo || null,
        note_cliente: noteCliente || null,
        sconto_percentuale: scontoPercValue,
        sconto_fisso: scontoFissoValue,
        stato: 'bozza'
      })

      // 2. Aggiungi gli items
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i]
        await addItem.mutateAsync({
          proposta_id: proposta.id,
          servizio_id: item.tipo === 'servizio' ? item.id : null,
          pacchetto_id: item.tipo === 'pacchetto' ? item.id : null,
          nome: item.nome,
          descrizione: item.descrizione,
          quantita: item.quantita,
          prezzo_unitario: item.prezzo,
          prezzo_totale: item.prezzo * item.quantita,
          ordine: i
        })
      }

      // 3. Genera automaticamente i documenti (Proposta Commerciale + Preventivo)
      try {
        await generaDocumentiAutomatici(
          proposta.id,
          proposta.numero || '',
          contattoId,
          proprietaId,
          selectedItems,
          subtotale,
          scontoPercValue,
          scontoFissoValue,
          totale
        )
        toast.success('Proposta creata con documenti generati')
      } catch (docError) {
        console.error('Errore generazione documenti:', docError)
        toast.warning('Proposta creata, ma alcuni documenti non sono stati generati')
      }

      // Reset e chiudi
      setTitolo('')
      setNoteCliente('')
      setSelectedItems([])
      setScontoPercentuale('')
      setScontoFisso('')
      onOpenChange(false)
      onSuccess?.(proposta.id)
    } catch (error) {
      console.error('Errore creazione proposta:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isItemSelected = (tipo: 'pacchetto' | 'servizio', id: string) => {
    return selectedItems.some(i => i.tipo === tipo && i.id === id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nuova Proposta Commerciale</DialogTitle>
          <DialogDescription>
            Seleziona i servizi e pacchetti da includere nella proposta
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Titolo */}
          <div className="space-y-2">
            <Label htmlFor="titolo">Titolo (opzionale)</Label>
            <Input
              id="titolo"
              placeholder="Es: Proposta gestione completa"
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
            />
          </div>

          {/* Selezione Pacchetti */}
          <Collapsible open={pacchettiOpen} onOpenChange={setPacchettiOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">Pacchetti</span>
                  {selectedItems.filter(i => i.tipo === 'pacchetto').length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedItems.filter(i => i.tipo === 'pacchetto').length}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  pacchettiOpen && 'rotate-180'
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {loadingPacchetti ? (
                <p className="text-sm text-muted-foreground p-2">Caricamento...</p>
              ) : pacchetti?.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">Nessun pacchetto disponibile</p>
              ) : (
                pacchetti?.map((pacchetto) => {
                  const selected = isItemSelected('pacchetto', pacchetto.id)
                  return (
                    <div
                      key={pacchetto.id}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer transition-all',
                        selected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                      )}
                      onClick={() => toggleItem('pacchetto', pacchetto)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                          selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        )}>
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pacchetto.nome}</span>
                            {pacchetto.tipo_esito === 'gestione' && (
                              <Badge variant="secondary" className="text-xs">Gestione</Badge>
                            )}
                          </div>
                          {pacchetto.descrizione && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {pacchetto.descrizione}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold flex-shrink-0">
                          {formatCurrency(pacchetto.prezzo_base || 0)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Selezione Servizi Singoli */}
          <Collapsible open={serviziOpen} onOpenChange={setServiziOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  <span className="font-medium">Servizi Singoli</span>
                  {selectedItems.filter(i => i.tipo === 'servizio').length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedItems.filter(i => i.tipo === 'servizio').length}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  serviziOpen && 'rotate-180'
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {loadingServizi ? (
                <p className="text-sm text-muted-foreground p-2">Caricamento...</p>
              ) : serviziSingoli.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">
                  Nessun servizio vendibile singolarmente
                </p>
              ) : (
                serviziSingoli.map((servizio) => {
                  const selected = isItemSelected('servizio', servizio.id)
                  return (
                    <div
                      key={servizio.id}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer transition-all',
                        selected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                      )}
                      onClick={() => toggleItem('servizio', servizio)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                          selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        )}>
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{servizio.nome}</span>
                          {servizio.descrizione && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {servizio.descrizione}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold flex-shrink-0">
                          {formatCurrency(servizio.prezzo_base || 0)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Items Selezionati con modifica prezzi */}
          {selectedItems.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Servizi selezionati</h4>
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => toggleItem(item.tipo, { id: item.id, nome: item.nome } as any)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.nome}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.tipo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantita}
                        onChange={(e) => updateItemQuantita(item.tipo, item.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center"
                      />
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.prezzo}
                        onChange={(e) => updateItemPrezzo(item.tipo, item.id, parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-right"
                      />
                    </div>
                    <span className="font-medium w-24 text-right">
                      {formatCurrency(item.prezzo * item.quantita)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Sconti */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Sconto %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={scontoPercentuale}
                      onChange={(e) => setScontoPercentuale(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Sconto fisso €</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={scontoFisso}
                      onChange={(e) => setScontoFisso(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Totale */}
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotale</span>
                  <span>{formatCurrency(subtotale)}</span>
                </div>
                {(scontoPercValue > 0 || scontoFissoValue > 0) && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Sconto</span>
                    <span>-{formatCurrency(subtotale - totale)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg mt-1">
                  <span>Totale</span>
                  <span>{formatCurrency(totale)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note per il cliente (opzionale)</Label>
            <Textarea
              id="note"
              placeholder="Note visibili nella proposta..."
              value={noteCliente}
              onChange={(e) => setNoteCliente(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              'Creazione...'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Crea Proposta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
