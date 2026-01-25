'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ErogazioneTaskItem } from './erogazione-task-item'
import type {
  ErogazioneServizio,
  ErogazioneTask,
  StatoErogazioneServizio
} from '@/types/database'

interface ErogazioneServizioCardProps {
  servizio: ErogazioneServizio
  onUpdateTaskStato?: (taskId: string, stato: string) => void
}

const statoConfig: Record<StatoErogazioneServizio, {
  label: string
  icon: typeof Circle
  color: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}> = {
  da_iniziare: {
    label: 'Da iniziare',
    icon: Circle,
    color: 'text-slate-400',
    badgeVariant: 'outline'
  },
  in_corso: {
    label: 'In corso',
    icon: Clock,
    color: 'text-blue-500',
    badgeVariant: 'default'
  },
  completato: {
    label: 'Completato',
    icon: CheckCircle2,
    color: 'text-green-500',
    badgeVariant: 'secondary'
  },
  bloccato: {
    label: 'Bloccato',
    icon: AlertCircle,
    color: 'text-amber-500',
    badgeVariant: 'outline'
  },
  annullato: {
    label: 'Annullato',
    icon: AlertCircle,
    color: 'text-red-500',
    badgeVariant: 'destructive'
  }
}

export function ErogazioneServizioCard({
  servizio,
  onUpdateTaskStato
}: ErogazioneServizioCardProps) {
  const [isOpen, setIsOpen] = useState(servizio.stato === 'in_corso')

  const config = statoConfig[servizio.stato]
  const StatoIcon = config.icon

  const tasks = (servizio.task || []) as ErogazioneTask[]
  const taskCompletate = tasks.filter(t => t.stato === 'completata').length
  const taskObbligatorie = tasks.filter(t => t.obbligatoria).length
  const taskObbCompletate = tasks.filter(t => t.obbligatoria && t.stato === 'completata').length

  const percentuale = taskObbligatorie > 0
    ? Math.round((taskObbCompletate / taskObbligatorie) * 100)
    : (tasks.length > 0 ? Math.round((taskCompletate / tasks.length) * 100) : 100)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        'border rounded-md bg-background transition-all',
        servizio.stato === 'completato' && 'border-green-200',
        servizio.stato === 'in_corso' && 'border-blue-200'
      )}>
        {/* Header servizio */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            {/* Expand */}
            <div className="flex-shrink-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Icon stato */}
            <StatoIcon className={cn('h-5 w-5 flex-shrink-0', config.color)} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {servizio.servizio?.nome || 'Servizio'}
                </span>
                {servizio.servizio?.tipo === 'ricorrente' && (
                  <Badge variant="outline" className="text-xs">
                    Ricorrente
                  </Badge>
                )}
              </div>
            </div>

            {/* Assegnato */}
            {servizio.assegnato_a && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Assegnato</span>
              </div>
            )}

            {/* Progress mini */}
            <div className="flex items-center gap-2 w-24">
              <Progress value={percentuale} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {percentuale}%
              </span>
            </div>

            {/* Badge stato */}
            <Badge
              variant={config.badgeVariant}
              className={cn('text-xs', config.badgeVariant === 'outline' && config.color)}
            >
              {config.label}
            </Badge>
          </div>
        </CollapsibleTrigger>

        {/* Content - Task */}
        <CollapsibleContent>
          <div className="border-t px-3 py-2 space-y-1 bg-muted/30">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Nessuna task definita
              </p>
            ) : (
              tasks
                .sort((a, b) => a.ordine - b.ordine)
                .map((task) => (
                  <ErogazioneTaskItem
                    key={task.id}
                    task={task}
                    onUpdateStato={(stato) => onUpdateTaskStato?.(task.id, stato)}
                  />
                ))
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
