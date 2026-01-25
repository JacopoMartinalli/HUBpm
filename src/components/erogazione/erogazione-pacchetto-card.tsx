'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Lock,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MoreVertical,
  Trash2,
  Play,
  Pause
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ErogazioneServizioCard } from './erogazione-servizio-card'
import type {
  ErogazionePacchetto,
  ErogazioneServizio,
  StatoErogazionePacchetto
} from '@/types/database'

interface ErogazionePacchettoCardProps {
  erogazione: ErogazionePacchetto
  isBloccato?: boolean
  dipendenzeNonSoddisfatte?: string[]
  onDeletePacchetto?: (id: string) => void
  onUpdateTaskStato?: (taskId: string, stato: string) => void
}

const statoConfig: Record<StatoErogazionePacchetto, {
  label: string
  icon: typeof Circle
  color: string
  bgColor: string
}> = {
  bloccato: {
    label: 'Bloccato',
    icon: Lock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  },
  da_iniziare: {
    label: 'Da iniziare',
    icon: Circle,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100'
  },
  in_corso: {
    label: 'In corso',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  completato: {
    label: 'Completato',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  annullato: {
    label: 'Annullato',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  }
}

export function ErogazionePacchettoCard({
  erogazione,
  isBloccato = false,
  dipendenzeNonSoddisfatte = [],
  onDeletePacchetto,
  onUpdateTaskStato
}: ErogazionePacchettoCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const stato = isBloccato ? 'bloccato' : erogazione.stato
  const config = statoConfig[stato]
  const StatoIcon = config.icon

  // Calcola percentuale completamento
  const servizi = erogazione.servizi || []
  const serviziCompletati = servizi.filter(s => s.stato === 'completato').length
  const percentuale = servizi.length > 0
    ? Math.round((serviziCompletati / servizi.length) * 100)
    : 0

  // Non permettere apertura se bloccato
  const canOpen = !isBloccato && stato !== 'annullato'

  return (
    <Collapsible open={isOpen && canOpen} onOpenChange={canOpen ? setIsOpen : undefined}>
      <div className={cn(
        'border rounded-lg overflow-hidden transition-all',
        isBloccato && 'opacity-60',
        stato === 'completato' && 'border-green-200 bg-green-50/30',
        stato === 'in_corso' && 'border-blue-200',
        stato === 'annullato' && 'border-red-200 bg-red-50/30'
      )}>
        {/* Header */}
        <CollapsibleTrigger asChild disabled={!canOpen}>
          <div className={cn(
            'flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors',
            !canOpen && 'cursor-not-allowed'
          )}>
            {/* Expand icon */}
            <div className="flex-shrink-0">
              {canOpen ? (
                isOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Stato icon */}
            <div className={cn('p-2 rounded-full', config.bgColor)}>
              <StatoIcon className={cn('h-5 w-5', config.color)} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">
                  {erogazione.pacchetto?.nome || 'Pacchetto'}
                </h3>
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  {config.label}
                </Badge>
                {erogazione.pacchetto?.tipo_esito === 'gestione' && (
                  <Badge variant="secondary" className="text-xs">
                    Gestione
                  </Badge>
                )}
              </div>
              {erogazione.pacchetto?.descrizione && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {erogazione.pacchetto.descrizione}
                </p>
              )}
              {isBloccato && dipendenzeNonSoddisfatte.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Richiede: {dipendenzeNonSoddisfatte.join(', ')}
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="w-32 hidden sm:block">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{serviziCompletati}/{servizi.length} servizi</span>
                  <span>{percentuale}%</span>
                </div>
                <Progress value={percentuale} className="h-2" />
              </div>

              {/* Prezzo */}
              {erogazione.prezzo_totale && (
                <div className="text-right hidden md:block">
                  <span className="font-semibold">
                    {erogazione.prezzo_totale.toLocaleString('it-IT', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
              )}

              {/* Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {stato === 'da_iniziare' && (
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />
                      Avvia
                    </DropdownMenuItem>
                  )}
                  {stato === 'in_corso' && (
                    <DropdownMenuItem>
                      <Pause className="h-4 w-4 mr-2" />
                      Sospendi
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeletePacchetto?.(erogazione.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Rimuovi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content - Servizi */}
        <CollapsibleContent>
          <div className="border-t bg-muted/20">
            <div className="p-4 space-y-3">
              {servizi.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun servizio in questo pacchetto
                </p>
              ) : (
                servizi.map((servizio) => (
                  <ErogazioneServizioCard
                    key={servizio.id}
                    servizio={servizio}
                    onUpdateTaskStato={onUpdateTaskStato}
                  />
                ))
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
