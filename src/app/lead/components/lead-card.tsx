'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { EsitoBadge } from '@/components/shared'
import { FASI_LEAD, MOTIVI_LEAD_PERSO } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { useUpdateContatto, useMarkLeadAsLost, useConvertLeadToCliente } from '@/lib/hooks'
import type { Contatto, FaseLead, MotivoLeadPerso } from '@/types/database'
import {
  Phone,
  Mail,
  MoreVertical,
  ArrowRight,
  XCircle,
  UserCheck,
  Edit,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface LeadCardProps {
  lead: Contatto
  onLeadClick: (leadId: string) => void
  isDragging?: boolean
}

export function LeadCard({ lead, onLeadClick, isDragging }: LeadCardProps) {
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false)
  const [lostMotivo, setLostMotivo] = useState<MotivoLeadPerso | ''>('')
  const [lostNote, setLostNote] = useState('')
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)

  const updateContatto = useUpdateContatto()
  const markAsLost = useMarkLeadAsLost()
  const convertToCliente = useConvertLeadToCliente()

  const currentFaseIndex = FASI_LEAD.findIndex(f => f.id === lead.fase_lead)
  const nextFase = currentFaseIndex < FASI_LEAD.length - 1 ? FASI_LEAD[currentFaseIndex + 1] : null

  const handleChangeFase = async (nuovaFase: FaseLead) => {
    try {
      await updateContatto.mutateAsync({
        id: lead.id,
        fase_lead: nuovaFase,
      })
      toast.success(`Lead spostato in "${FASI_LEAD.find(f => f.id === nuovaFase)?.label}"`)
    } catch (error) {
      toast.error('Errore nel cambio fase')
    }
  }

  const handleAdvanceFase = async () => {
    if (!nextFase) return
    await handleChangeFase(nextFase.id)
  }

  const handleMarkAsLost = async () => {
    if (!lostMotivo) {
      toast.error('Seleziona un motivo')
      return
    }
    try {
      await markAsLost.mutateAsync({
        id: lead.id,
        motivoCodice: lostMotivo,
        note: lostNote || undefined,
      })
      toast.success('Lead segnato come perso')
      setIsLostDialogOpen(false)
      setLostMotivo('')
      setLostNote('')
    } catch (error) {
      toast.error('Errore nel segnare come perso')
    }
  }

  const handleConvert = async () => {
    try {
      await convertToCliente.mutateAsync(lead.id)
      toast.success('Lead convertito in cliente!')
      setIsConvertDialogOpen(false)
    } catch (error) {
      toast.error('Errore nella conversione')
    }
  }

  const isLost = lead.esito_lead === 'perso'
  const isWon = lead.esito_lead === 'vinto'
  const canAdvance = !isLost && !isWon && nextFase
  const canConvert = !isLost && !isWon && (lead.fase_lead as string) === 'L3'
  const canMarkLost = !isLost && !isWon

  return (
    <>
      <Card className={`p-3 hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {lead.nome} {lead.cognome}
            </p>
            {lead.fonte_lead && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Fonte: {lead.fonte_lead}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {lead.esito_lead && lead.esito_lead !== 'in_corso' && (
              <EsitoBadge esito={lead.esito_lead} tipo="lead" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Azioni Rapide</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Visualizza dettagli */}
                <DropdownMenuItem onClick={() => onLeadClick(lead.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizza
                </DropdownMenuItem>

                {/* Avanza fase */}
                {canAdvance && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAdvanceFase()
                    }}
                    disabled={updateContatto.isPending}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Avanza a {nextFase.label}
                  </DropdownMenuItem>
                )}

                {/* Cambia fase - submenu */}
                {!isLost && !isWon && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Sposta in...
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {FASI_LEAD.map((fase) => (
                        <DropdownMenuItem
                          key={fase.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleChangeFase(fase.id)
                          }}
                          disabled={fase.id === lead.fase_lead || updateContatto.isPending}
                        >
                          {fase.label}
                          {fase.id === lead.fase_lead && ' (corrente)'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                <DropdownMenuSeparator />

                {/* Converti in cliente */}
                {canConvert && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsConvertDialogOpen(true)
                    }}
                    className="text-green-600"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Converti in Cliente
                  </DropdownMenuItem>
                )}

                {/* Segna come perso */}
                {canMarkLost && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsLostDialogOpen(true)
                    }}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Segna come Perso
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {lead.email && (
            <div className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {lead.valore_stimato && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs font-medium text-green-600">
              {formatCurrency(lead.valore_stimato)}
            </p>
          </div>
        )}
      </Card>

      {/* Dialog Segna come Perso */}
      <Dialog open={isLostDialogOpen} onOpenChange={setIsLostDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Segna Lead come Perso</DialogTitle>
            <DialogDescription>
              Indica il motivo per cui questo lead non è andato a buon fine.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select value={lostMotivo} onValueChange={(v) => setLostMotivo(v as MotivoLeadPerso)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVI_LEAD_PERSO.map((motivo) => (
                    <SelectItem key={motivo.id} value={motivo.id}>
                      {motivo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note aggiuntive</Label>
              <Textarea
                value={lostNote}
                onChange={(e) => setLostNote(e.target.value)}
                placeholder="Dettagli opzionali..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLostDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkAsLost}
              disabled={!lostMotivo || markAsLost.isPending}
            >
              {markAsLost.isPending ? 'Salvataggio...' : 'Conferma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Converti in Cliente */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Converti Lead in Cliente</DialogTitle>
            <DialogDescription>
              Stai per convertire {lead.nome} {lead.cognome} in cliente.
              Le proprietà lead confermate verranno convertite in proprietà attive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertToCliente.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {convertToCliente.isPending ? 'Conversione...' : 'Converti in Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
