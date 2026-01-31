'use client'

import {
  CheckCircle2,
  Home,
  FileText,
  Rocket,
  Radio,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { FaseProprieta } from '@/types/database'

// Definizione delle 4 fasi principali
const FASI_PIPELINE = [
  {
    id: 'P0' as FaseProprieta,
    label: 'Lead',
    icon: Home,
    color: 'gray',
    description: 'Raccolta info, sopralluogo, valutazione',
  },
  {
    id: 'P1' as FaseProprieta,
    label: 'Onboarding',
    icon: FileText,
    color: 'blue',
    description: 'Schedatura proprietà',
  },
  {
    id: 'P2' as FaseProprieta,
    label: 'Avvio',
    icon: Rocket,
    color: 'purple',
    description: 'Erogazione servizi',
  },
  {
    id: 'P4' as FaseProprieta,
    label: 'Live',
    icon: Radio,
    color: 'green',
    description: 'Gestione attiva',
  },
]

interface PipelineStepperInlineProps {
  faseCorrente: FaseProprieta
  onCambioFase?: (nuovaFase: FaseProprieta) => void
  isCambioFaseLoading?: boolean
  compact?: boolean
}

export function PipelineStepperInline({
  faseCorrente,
  onCambioFase,
  isCambioFaseLoading,
  compact = false,
}: PipelineStepperInlineProps) {
  // Mappa P3 a P2 per la visualizzazione (P2 e P3 sono entrambi "Avvio")
  const faseVisuale = faseCorrente === 'P3' ? 'P2' : faseCorrente
  const faseCorrenteIndex = FASI_PIPELINE.findIndex(f => f.id === faseVisuale)

  const getColorClasses = (color: string, isActive: boolean, isPast: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; ring: string }> = {
      gray: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', ring: 'ring-gray-400' },
      blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-600', ring: 'ring-blue-400' },
      purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-600', ring: 'ring-purple-400' },
      green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-600', ring: 'ring-green-400' },
    }

    if (isActive) {
      return colors[color] || colors.gray
    }

    if (isPast) {
      return {
        bg: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-600',
        ring: 'ring-green-400',
      }
    }

    return {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-400',
      ring: 'ring-gray-200',
    }
  }

  return (
    <div className="flex items-center gap-1">
      {FASI_PIPELINE.map((fase, index) => {
        const isActive = fase.id === faseVisuale
        const isPast = index < faseCorrenteIndex
        const Icon = fase.icon
        const colors = getColorClasses(fase.color, isActive, isPast)

        return (
          <TooltipProvider key={fase.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onCambioFase?.(fase.id)}
                  disabled={isCambioFaseLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all',
                    colors.bg,
                    colors.border,
                    isActive && 'ring-1 ring-offset-1',
                    isActive && colors.ring,
                    'cursor-pointer hover:scale-105',
                    isCambioFaseLoading && 'opacity-50 cursor-not-allowed',
                    compact && 'px-1.5 py-0.5'
                  )}
                >
                  {isPast ? (
                    <CheckCircle2 className={cn('text-green-600', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                  ) : (
                    <Icon className={cn(colors.text, compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                  )}
                  {!compact && (
                    <span className={cn('text-xs font-medium', colors.text)}>
                      {fase.label}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm">
                  <p className="font-medium">{fase.label}</p>
                  <p className="text-muted-foreground text-xs">{fase.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

// Badge singolo per la fase corrente (ancora più compatto)
export function FaseBadgeCompact({ fase }: { fase: FaseProprieta }) {
  const faseVisuale = fase === 'P3' ? 'P2' : fase
  const faseInfo = FASI_PIPELINE.find(f => f.id === faseVisuale)

  if (!faseInfo) return null

  const Icon = faseInfo.icon

  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    green: 'bg-green-100 text-green-700 border-green-300',
  }

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', colorClasses[faseInfo.color])}
    >
      <Icon className="h-3.5 w-3.5" />
      {faseInfo.label}
    </Badge>
  )
}
