'use client'

import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Zap,
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ErogazioneTask, StatoErogazioneTask } from '@/types/database'

interface ErogazioneTaskItemProps {
  task: ErogazioneTask
  onUpdateStato?: (stato: StatoErogazioneTask) => void
}

const statoConfig: Record<StatoErogazioneTask, {
  icon: typeof Circle
  color: string
  bgColor: string
}> = {
  da_fare: {
    icon: Circle,
    color: 'text-slate-400',
    bgColor: 'bg-slate-100'
  },
  in_corso: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  completata: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  bloccata: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100'
  },
  annullata: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-100'
  }
}

export function ErogazioneTaskItem({ task, onUpdateStato }: ErogazioneTaskItemProps) {
  const config = statoConfig[task.stato]
  const isCompletabile = task.stato === 'da_fare' || task.stato === 'in_corso'
  const isCompleta = task.stato === 'completata'

  const handleToggle = () => {
    if (isCompletabile) {
      onUpdateStato?.('completata')
    } else if (isCompleta) {
      onUpdateStato?.('da_fare')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short'
    })
  }

  const isScaduta = task.data_scadenza && new Date(task.data_scadenza) < new Date() && !isCompleta

  return (
    <div className={cn(
      'flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors',
      'hover:bg-muted/50',
      isCompleta && 'opacity-60'
    )}>
      {/* Checkbox / Status */}
      <div className="flex-shrink-0">
        {task.tipo === 'automatica' ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('p-1 rounded', config.bgColor)}>
                  <Zap className={cn('h-3.5 w-3.5', config.color)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Task automatica</p>
                {task.trigger_automatico && (
                  <p className="text-xs text-muted-foreground">
                    Trigger: {task.trigger_automatico}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Checkbox
            checked={isCompleta}
            onCheckedChange={handleToggle}
            disabled={task.stato === 'bloccata' || task.stato === 'annullata'}
            className="h-4 w-4"
          />
        )}
      </div>

      {/* Titolo e info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-sm truncate',
            isCompleta && 'line-through text-muted-foreground'
          )}>
            {task.titolo}
          </span>
          {task.obbligatoria && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </div>
        {task.descrizione && (
          <p className="text-xs text-muted-foreground truncate">
            {task.descrizione}
          </p>
        )}
      </div>

      {/* Scadenza */}
      {task.data_scadenza && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'flex items-center gap-1 text-xs',
                isScaduta ? 'text-red-500' : 'text-muted-foreground'
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.data_scadenza)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isScaduta ? 'Scaduta!' : 'Scadenza'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Stato badge (solo se non da_fare o completata) */}
      {(task.stato === 'in_corso' || task.stato === 'bloccata') && (
        <Badge
          variant="outline"
          className={cn('text-xs h-5 px-1.5', config.color)}
        >
          {task.stato === 'in_corso' ? 'In corso' : 'Bloccata'}
        </Badge>
      )}

      {/* Menu azioni */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {task.stato !== 'completata' && task.stato !== 'annullata' && (
            <>
              <DropdownMenuItem onClick={() => onUpdateStato?.('in_corso')}>
                <Clock className="h-3.5 w-3.5 mr-2" />
                In corso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStato?.('completata')}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                Completa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {task.stato === 'completata' && (
            <DropdownMenuItem onClick={() => onUpdateStato?.('da_fare')}>
              <Circle className="h-3.5 w-3.5 mr-2" />
              Riapri
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onUpdateStato?.('bloccata')}>
            <AlertCircle className="h-3.5 w-3.5 mr-2" />
            Blocca
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
