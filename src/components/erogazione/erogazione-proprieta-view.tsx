'use client'

import { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lock,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ErogazionePacchettoCard } from './erogazione-pacchetto-card'
import { AggiungiPacchettoDialog } from './aggiungi-pacchetto-dialog'
import {
  useErogazionePacchettiByProprieta,
  useProprietaErogazione,
  useAllPacchettiDipendenze,
  useUpdateErogazioneTask,
  useDeleteErogazionePacchetto
} from '@/lib/hooks'
import type { ErogazionePacchetto, StatoErogazioneTask } from '@/types/database'

interface ErogazioneProprietaViewProps {
  proprietaId: string
  proprietaNome?: string
}

export function ErogazioneProprietaView({
  proprietaId,
  proprietaNome
}: ErogazioneProprietaViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const {
    data: erogazioni,
    isLoading: isLoadingErogazioni,
    refetch: refetchErogazioni
  } = useErogazionePacchettiByProprieta(proprietaId)

  const {
    data: riepilogo,
    isLoading: isLoadingRiepilogo
  } = useProprietaErogazione(proprietaId)

  const { data: dipendenze } = useAllPacchettiDipendenze()

  const updateTaskMutation = useUpdateErogazioneTask()
  const deletePacchettoMutation = useDeleteErogazionePacchetto()

  // Calcola quali pacchetti sono bloccati
  const pacchettiConStato = useMemo(() => {
    if (!erogazioni || !dipendenze) return []

    // Mappa pacchetti completati
    const pacchettiCompletati = new Set(
      erogazioni
        .filter(e => e.stato === 'completato')
        .map(e => e.pacchetto_id)
    )

    return erogazioni.map(erogazione => {
      // Trova le dipendenze di questo pacchetto
      const dipendenzeDelPacchetto = dipendenze.filter(
        d => d.pacchetto_id === erogazione.pacchetto_id
      )

      // Trova le dipendenze non soddisfatte
      const dipendenzeNonSoddisfatte = dipendenzeDelPacchetto
        .filter(d => !pacchettiCompletati.has(d.dipende_da_id))
        .map(d => (d as any).dipende_da?.nome || 'Pacchetto')

      const isBloccato = dipendenzeNonSoddisfatte.length > 0

      return {
        erogazione,
        isBloccato,
        dipendenzeNonSoddisfatte
      }
    })
  }, [erogazioni, dipendenze])

  const handleUpdateTaskStato = async (taskId: string, stato: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: {
          stato: stato as StatoErogazioneTask,
          ...(stato === 'completata' && {
            data_completamento: new Date().toISOString()
          }),
          ...(stato === 'in_corso' && {
            data_inizio: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.error('Errore aggiornamento task:', error)
    }
  }

  const handleDeletePacchetto = async (id: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo pacchetto?')) return

    try {
      await deletePacchettoMutation.mutateAsync({ id, proprietaId })
    } catch (error) {
      console.error('Errore eliminazione pacchetto:', error)
    }
  }

  if (isLoadingErogazioni || isLoadingRiepilogo) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const hasErogazioni = erogazioni && erogazioni.length > 0

  return (
    <div className="space-y-6">
      {/* Header con riepilogo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Erogazione Servizi
              </CardTitle>
              <CardDescription>
                Gestione pacchetti e servizi per {proprietaNome || 'questa proprietà'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchErogazioni()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Aggiorna
              </Button>
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi Pacchetto
              </Button>
            </div>
          </div>
        </CardHeader>

        {hasErogazioni && riepilogo && (
          <CardContent>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{riepilogo.totale_pacchetti}</div>
                <div className="text-xs text-muted-foreground">Totale</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  <CheckCircle2 className="h-5 w-5 inline mr-1" />
                  {riepilogo.pacchetti_completati}
                </div>
                <div className="text-xs text-muted-foreground">Completati</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  <Clock className="h-5 w-5 inline mr-1" />
                  {riepilogo.pacchetti_in_corso}
                </div>
                <div className="text-xs text-muted-foreground">In corso</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-2xl font-bold text-gray-500">
                  <Lock className="h-5 w-5 inline mr-1" />
                  {riepilogo.pacchetti_bloccati}
                </div>
                <div className="text-xs text-muted-foreground">Bloccati</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">
                  {riepilogo.valore_totale?.toLocaleString('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                  }) || '€ 0'}
                </div>
                <div className="text-xs text-muted-foreground">Valore totale</div>
              </div>
            </div>

            {/* Progress complessivo */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Avanzamento complessivo</span>
                <span>
                  {riepilogo.totale_pacchetti > 0
                    ? Math.round((riepilogo.pacchetti_completati / riepilogo.totale_pacchetti) * 100)
                    : 0}%
                </span>
              </div>
              <Progress
                value={
                  riepilogo.totale_pacchetti > 0
                    ? (riepilogo.pacchetti_completati / riepilogo.totale_pacchetti) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            {/* Pronto per Live */}
            {riepilogo.pronto_per_live && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Proprietà pronta per passare in Gestione Live!
                </span>
                <Button size="sm" variant="default" className="ml-auto bg-green-600 hover:bg-green-700">
                  Attiva Gestione
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Lista pacchetti */}
      {!hasErogazioni ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessun pacchetto assegnato</h3>
            <p className="text-muted-foreground mb-4">
              Inizia aggiungendo un pacchetto di servizi a questa proprietà
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Pacchetto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pacchettiConStato.map(({ erogazione, isBloccato, dipendenzeNonSoddisfatte }) => (
            <ErogazionePacchettoCard
              key={erogazione.id}
              erogazione={erogazione}
              isBloccato={isBloccato}
              dipendenzeNonSoddisfatte={dipendenzeNonSoddisfatte}
              onDeletePacchetto={handleDeletePacchetto}
              onUpdateTaskStato={handleUpdateTaskStato}
            />
          ))}
        </div>
      )}

      {/* Dialog aggiungi pacchetto */}
      <AggiungiPacchettoDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        proprietaId={proprietaId}
        pacchettiGiaAssegnati={erogazioni?.map(e => e.pacchetto_id) || []}
      />
    </div>
  )
}

// Skeleton component
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className}`} />
  )
}
