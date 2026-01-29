'use client'

import {
  Clock,
  Download,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { PropostaCommerciale, StatoProposta } from '@/types/database'
import { useState } from 'react'
import { usePropertyManager } from '@/lib/hooks/use-property-manager'
import { useDefaultTemplate } from '@/lib/hooks/useDocumentTemplates'
import { downloadPdf } from '@/lib/pdf/generatePdf'
import { toast } from 'sonner'
import type { TemplateContext } from '@/lib/services/template-resolver'

interface PropostaDetailDialogProps {
  proposta: PropostaCommerciale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATO_CONFIG: Record<StatoProposta, {
  label: string
  color: string
  bgColor: string
  icon: typeof FileText
}> = {
  bozza: {
    label: 'Bozza',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: FileText
  },
  inviata: {
    label: 'Inviata',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Send
  },
  accettata: {
    label: 'Accettata',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2
  },
  rifiutata: {
    label: 'Rifiutata',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle
  },
  scaduta: {
    label: 'Scaduta',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Clock
  }
}

export function PropostaDetailDialog({
  proposta,
  open,
  onOpenChange
}: PropostaDetailDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { data: propertyManager } = usePropertyManager()
  const { data: defaultTemplate } = useDefaultTemplate('preventivo')

  if (!proposta) return null

  const statoConfig = STATO_CONFIG[proposta.stato]
  const StatoIcon = statoConfig.icon

  const handleDownload = async () => {
    if (!defaultTemplate) {
      toast.error('Nessun template predefinito trovato per i preventivi')
      return
    }

    try {
      setIsDownloading(true)

      const context: TemplateContext = {
        azienda: propertyManager || null,
        cliente: proposta.contatto || null,
        proprieta: proposta.proprieta || null,
        proposta: {
          numero: proposta.numero || undefined,
          data: proposta.data_creazione,
          totale: proposta.totale,
          subtotale: proposta.subtotale,
          sconto: proposta.sconto_fisso + (proposta.subtotale * proposta.sconto_percentuale / 100),
          items: proposta.items?.map(item => ({
            nome: item.nome,
            descrizione: item.descrizione,
            quantita: item.quantita,
            prezzo_unitario: item.prezzo_unitario,
            prezzo_totale: item.prezzo_totale
          }))
        }
      }

      const fileName = proposta.numero
        ? `Preventivo_${proposta.numero}`
        : `Preventivo_${proposta.contatto?.cognome || 'Cliente'}`

      await downloadPdf({
        content: defaultTemplate.contenuto as Record<string, unknown>,
        context,
        fileName,
        showHeaderFooter: true
      })

      toast.success('PDF generato con successo')
    } catch (error) {
      console.error('Errore generazione PDF:', error)
      toast.error('Errore durante la generazione del PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', statoConfig.bgColor)}>
              <StatoIcon className={cn('h-5 w-5', statoConfig.color)} />
            </div>
            <div>
              <span className="font-semibold">
                {proposta.numero || 'Nuova Proposta'}
              </span>
              {proposta.titolo && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {proposta.titolo}
                </span>
              )}
            </div>
            <Badge variant="outline" className={cn('ml-auto', statoConfig.color, statoConfig.bgColor)}>
              {statoConfig.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Info Cliente e Proprietà */}
          <div className="grid grid-cols-2 gap-4">
            {proposta.contatto && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Cliente</span>
                </div>
                <p className="font-medium">
                  {proposta.contatto.nome} {proposta.contatto.cognome}
                </p>
                {proposta.contatto.email && (
                  <p className="text-sm text-muted-foreground">{proposta.contatto.email}</p>
                )}
                {proposta.contatto.telefono && (
                  <p className="text-sm text-muted-foreground">{proposta.contatto.telefono}</p>
                )}
              </div>
            )}
            {proposta.proprieta && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Proprietà</span>
                </div>
                <p className="font-medium">{proposta.proprieta.nome}</p>
                {proposta.proprieta.indirizzo && (
                  <p className="text-sm text-muted-foreground">
                    {proposta.proprieta.indirizzo}
                    {proposta.proprieta.citta && `, ${proposta.proprieta.citta}`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Creata</span>
              </div>
              <p className="font-medium">{formatDate(proposta.data_creazione)}</p>
            </div>
            {proposta.data_invio && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Send className="h-4 w-4" />
                  <span>Inviata</span>
                </div>
                <p className="font-medium">{formatDate(proposta.data_invio)}</p>
              </div>
            )}
            {proposta.data_scadenza && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Scadenza</span>
                </div>
                <p className="font-medium">{formatDate(proposta.data_scadenza)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Servizi/Pacchetti */}
          <div>
            <h4 className="font-medium mb-3">
              Servizi inclusi ({proposta.items?.length || 0})
            </h4>
            {proposta.items && proposta.items.length > 0 ? (
              <div className="space-y-2">
                {proposta.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.nome}</p>
                      {item.descrizione && (
                        <p className="text-sm text-muted-foreground">{item.descrizione}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.quantita} x {formatCurrency(item.prezzo_unitario)}
                        {item.sconto_percentuale > 0 && (
                          <span className="text-green-600 ml-2">
                            -{item.sconto_percentuale}%
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.prezzo_totale)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nessun servizio aggiunto
              </p>
            )}
          </div>

          <Separator />

          {/* Totali */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotale</span>
              <span>{formatCurrency(proposta.subtotale)}</span>
            </div>
            {proposta.sconto_percentuale > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Sconto {proposta.sconto_percentuale}%</span>
                <span>-{formatCurrency(proposta.subtotale * proposta.sconto_percentuale / 100)}</span>
              </div>
            )}
            {proposta.sconto_fisso > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Sconto fisso</span>
                <span>-{formatCurrency(proposta.sconto_fisso)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Totale</span>
              <span>{formatCurrency(proposta.totale)}</span>
            </div>
          </div>

          {/* Note */}
          {(proposta.note_cliente || proposta.note_interne) && (
            <>
              <Separator />
              <div className="space-y-3">
                {proposta.note_cliente && (
                  <div>
                    <h4 className="font-medium mb-2">Note per il cliente</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {proposta.note_cliente}
                    </p>
                  </div>
                )}
                {proposta.note_interne && (
                  <div>
                    <h4 className="font-medium mb-2">Note interne</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {proposta.note_interne}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Motivo rifiuto */}
          {proposta.stato === 'rifiutata' && proposta.motivo_rifiuto && (
            <>
              <Separator />
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-700 mb-1">Motivo rifiuto</h4>
                <p className="text-sm text-red-600">{proposta.motivo_rifiuto}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading || !defaultTemplate}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generazione...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Scarica PDF
              </>
            )}
          </Button>
          {!defaultTemplate && (
            <p className="text-[10px] text-muted-foreground mt-1 text-center w-full">
              Configura un template predefinito in Impostazioni > Documenti
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
