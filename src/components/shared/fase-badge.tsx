import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  FASI_LEAD,
  FASI_PROPRIETA_LEAD,
  FASI_CLIENTE,
  FASI_PROPRIETA,
  ESITI_LEAD,
  ESITI_PROPRIETA_LEAD,
} from '@/constants'
import type {
  FaseLead,
  FaseProprietaLead,
  FaseCliente,
  FaseProprieta,
  EsitoLead,
  EsitoProprietaLead,
} from '@/types/database'

interface FaseBadgeProps {
  fase: string
  tipo: 'lead' | 'proprieta_lead' | 'cliente' | 'proprieta'
  className?: string
}

export function FaseBadge({ fase, tipo, className }: FaseBadgeProps) {
  let fasi: readonly { id: string; label: string; color: string; textColor?: string }[] = []

  switch (tipo) {
    case 'lead':
      fasi = FASI_LEAD
      break
    case 'proprieta_lead':
      fasi = FASI_PROPRIETA_LEAD
      break
    case 'cliente':
      fasi = FASI_CLIENTE
      break
    case 'proprieta':
      fasi = FASI_PROPRIETA
      break
  }

  const faseInfo = fasi.find((f) => f.id === fase)

  if (!faseInfo) {
    return <Badge variant="outline">{fase}</Badge>
  }

  return (
    <Badge
      variant="outline"
      className={cn(faseInfo.color, faseInfo.textColor, 'border-0', className)}
    >
      {faseInfo.label}
    </Badge>
  )
}

interface EsitoBadgeProps {
  esito: string
  tipo: 'lead' | 'proprieta_lead'
  className?: string
}

export function EsitoBadge({ esito, tipo, className }: EsitoBadgeProps) {
  const esiti = tipo === 'lead' ? ESITI_LEAD : ESITI_PROPRIETA_LEAD
  const esitoInfo = esiti.find((e) => e.id === esito)

  if (!esitoInfo) {
    return <Badge variant="outline">{esito}</Badge>
  }

  return (
    <Badge variant="outline" className={cn(esitoInfo.color, 'border-0', className)}>
      {esitoInfo.label}
    </Badge>
  )
}

interface TaskCountPerFase {
  [fase: string]: {
    totali: number
    completati: number
  }
}

interface FaseProgressProps {
  faseCorrente: string
  tipo: 'lead' | 'proprieta_lead' | 'cliente' | 'proprieta'
  className?: string
  taskCounts?: TaskCountPerFase
}

export function FaseProgress({ faseCorrente, tipo, className, taskCounts }: FaseProgressProps) {
  let fasi: readonly { id: string; label: string; color: string }[] = []

  switch (tipo) {
    case 'lead':
      fasi = FASI_LEAD
      break
    case 'proprieta_lead':
      fasi = FASI_PROPRIETA_LEAD
      break
    case 'cliente':
      fasi = FASI_CLIENTE
      break
    case 'proprieta':
      fasi = FASI_PROPRIETA
      break
  }

  const currentIndex = fasi.findIndex((f) => f.id === faseCorrente)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {fasi.map((fase, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex
        const count = taskCounts?.[fase.id]

        return (
          <div key={fase.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isPending && 'bg-muted text-muted-foreground'
                )}
                title={fase.label}
              >
                {fase.id}
              </div>
              {count && count.totali > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-medium mt-0.5',
                    count.completati === count.totali
                      ? 'text-green-600'
                      : isCompleted || isCurrent
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/50'
                  )}
                >
                  {count.completati}/{count.totali}
                </span>
              )}
            </div>
            {index < fasi.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 self-start mt-4',
                  isCompleted ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
