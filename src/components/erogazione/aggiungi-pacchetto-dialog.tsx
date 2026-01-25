'use client'

import { useState } from 'react'
import {
  Package,
  Check,
  Lock,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  usePacchettiServiziAttivi,
  useAllPacchettiDipendenze,
  useCreateErogazionePacchetto
} from '@/lib/hooks'
import type { PacchettoServizio } from '@/types/database'

interface AggiungiPacchettoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proprietaId: string
  pacchettiGiaAssegnati: string[]
}

export function AggiungiPacchettoDialog({
  open,
  onOpenChange,
  proprietaId,
  pacchettiGiaAssegnati
}: AggiungiPacchettoDialogProps) {
  const [selectedPacchettoId, setSelectedPacchettoId] = useState<string | null>(null)
  const [prezzoCustom, setPrezzoCustom] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: pacchetti, isLoading } = usePacchettiServiziAttivi()
  const { data: dipendenze } = useAllPacchettiDipendenze()
  const createMutation = useCreateErogazionePacchetto()

  // Filtra pacchetti già assegnati
  const pacchettiDisponibili = pacchetti?.filter(
    p => !pacchettiGiaAssegnati.includes(p.id)
  ) || []

  // Ottieni dipendenze per un pacchetto
  const getDipendenze = (pacchettoId: string) => {
    return dipendenze?.filter(d => d.pacchetto_id === pacchettoId) || []
  }

  // Verifica se le dipendenze sono soddisfatte
  const checkDipendenzeSoddisfatte = (pacchettoId: string) => {
    const deps = getDipendenze(pacchettoId)
    return deps.every(d => pacchettiGiaAssegnati.includes(d.dipende_da_id))
  }

  const selectedPacchetto = pacchettiDisponibili.find(p => p.id === selectedPacchettoId)

  const handleSubmit = async () => {
    if (!selectedPacchettoId) return

    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync({
        proprieta_id: proprietaId,
        pacchetto_id: selectedPacchettoId,
        stato: checkDipendenzeSoddisfatte(selectedPacchettoId) ? 'da_iniziare' : 'bloccato',
        prezzo_totale: prezzoCustom ? parseFloat(prezzoCustom) : selectedPacchetto?.prezzo_base || null,
        data_inizio: new Date().toISOString().split('T')[0]
      })
      onOpenChange(false)
      setSelectedPacchettoId(null)
      setPrezzoCustom('')
    } catch (error) {
      console.error('Errore creazione erogazione:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi Pacchetto</DialogTitle>
          <DialogDescription>
            Seleziona un pacchetto da assegnare a questa proprietà
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Caricamento...
          </div>
        ) : pacchettiDisponibili.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Tutti i pacchetti sono già stati assegnati</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista pacchetti */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {pacchettiDisponibili.map((pacchetto) => {
                const deps = getDipendenze(pacchetto.id)
                const dipendenzeSoddisfatte = checkDipendenzeSoddisfatte(pacchetto.id)
                const isSelected = selectedPacchettoId === pacchetto.id

                return (
                  <div
                    key={pacchetto.id}
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/50',
                      !dipendenzeSoddisfatte && 'opacity-60'
                    )}
                    onClick={() => setSelectedPacchettoId(pacchetto.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={cn(
                        'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pacchetto.nome}</span>
                          {pacchetto.tipo_esito === 'gestione' && (
                            <Badge variant="secondary" className="text-xs">
                              Gestione
                            </Badge>
                          )}
                          {!dipendenzeSoddisfatte && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        {pacchetto.descrizione && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {pacchetto.descrizione}
                          </p>
                        )}

                        {/* Dipendenze */}
                        {deps.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <span>Richiede:</span>
                            {deps.map((d, i) => (
                              <span key={d.id}>
                                <Badge
                                  variant={pacchettiGiaAssegnati.includes(d.dipende_da_id) ? 'default' : 'outline'}
                                  className="text-xs h-5"
                                >
                                  {(d as any).dipende_da?.nome || 'Pacchetto'}
                                </Badge>
                                {i < deps.length - 1 && <span className="mx-1">+</span>}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Servizi inclusi */}
                        {pacchetto.servizi && pacchetto.servizi.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {pacchetto.servizi.length} servizi inclusi
                          </div>
                        )}
                      </div>

                      {/* Prezzo */}
                      {pacchetto.prezzo_base && (
                        <div className="text-right flex-shrink-0">
                          <span className="font-semibold">
                            {pacchetto.prezzo_base.toLocaleString('it-IT', {
                              style: 'currency',
                              currency: 'EUR'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Prezzo custom */}
            {selectedPacchetto && (
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor="prezzo">Prezzo concordato</Label>
                    <Input
                      id="prezzo"
                      type="number"
                      step="0.01"
                      placeholder={selectedPacchetto.prezzo_base?.toString() || '0'}
                      value={prezzoCustom}
                      onChange={(e) => setPrezzoCustom(e.target.value)}
                    />
                  </div>
                  {selectedPacchetto.prezzo_base && prezzoCustom && (
                    <div className="text-xs text-muted-foreground pt-5">
                      Listino: {selectedPacchetto.prezzo_base.toLocaleString('it-IT', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </div>
                  )}
                </div>

                {/* Warning dipendenze */}
                {!checkDipendenzeSoddisfatte(selectedPacchetto.id) && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Questo pacchetto rimarrà bloccato fino al completamento delle dipendenze
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPacchettoId || isSubmitting}
          >
            {isSubmitting ? (
              'Aggiunta in corso...'
            ) : (
              <>
                Aggiungi
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
