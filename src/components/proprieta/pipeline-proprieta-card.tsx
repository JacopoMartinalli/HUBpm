'use client'

import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Package,
  FileText,
  Rocket,
  Radio,
  Home,
  ArrowRight,
  FolderOpen,
  CheckSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { FaseProprieta } from '@/types/database'
import { useStatoCompletamentoFase } from '@/lib/hooks'

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
    description: 'Schedatura proprietà (planimetria, APE, catasto)',
  },
  {
    id: 'P2' as FaseProprieta,
    label: 'Avvio',
    icon: Rocket,
    color: 'purple',
    description: 'Erogazione servizi scelti',
  },
  {
    id: 'P4' as FaseProprieta,
    label: 'Live',
    icon: Radio,
    color: 'green',
    description: 'Gestione attiva',
  },
]

interface PipelineProprietaCardProps {
  faseCorrente: FaseProprieta
  proprietaId: string
  onCambioFase?: (nuovaFase: FaseProprieta) => void
  isCambioFaseLoading?: boolean
  pacchettiAttivi?: string[]
  onNavigateToServizi?: () => void
}

export function PipelineProprietaCard({
  faseCorrente,
  proprietaId,
  onCambioFase,
  isCambioFaseLoading,
  pacchettiAttivi = [],
  onNavigateToServizi,
}: PipelineProprietaCardProps) {
  // Mappa P3 a P2 per la visualizzazione (P2 e P3 sono entrambi "Avvio")
  const faseVisuale = faseCorrente === 'P3' ? 'P2' : faseCorrente
  const faseCorrenteIndex = FASI_PIPELINE.findIndex(f => f.id === faseVisuale)
  const faseCorrenteInfo = FASI_PIPELINE[faseCorrenteIndex]

  const prossimaFase = faseCorrenteIndex < FASI_PIPELINE.length - 1
    ? FASI_PIPELINE[faseCorrenteIndex + 1]
    : null

  // Hook per stato completamento fase
  const { data: statoCompletamento } = useStatoCompletamentoFase(
    'proprieta',
    faseCorrente,
    proprietaId
  )

  const getColorClasses = (color: string, isActive: boolean, isPast: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      gray: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
      blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
      purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
      green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
    }

    if (isActive) {
      return {
        bg: colors[color]?.bg || 'bg-primary',
        border: 'border-2 ' + (colors[color]?.border || 'border-primary'),
        text: colors[color]?.text || 'text-primary',
      }
    }

    if (isPast) {
      return {
        bg: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-700',
      }
    }

    return {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-400',
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pipeline</CardTitle>
          {faseCorrenteInfo && (
            <Badge
              variant="outline"
              className={cn(
                'text-sm',
                getColorClasses(faseCorrenteInfo.color, true, false).text,
                getColorClasses(faseCorrenteInfo.color, true, false).bg
              )}
            >
              {faseCorrenteInfo.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stepper visuale */}
        <div className="relative">
          <div className="flex justify-between items-center">
            {FASI_PIPELINE.map((fase, index) => {
              const isActive = fase.id === faseVisuale
              const isPast = index < faseCorrenteIndex
              const isFuture = index > faseCorrenteIndex
              const Icon = fase.icon
              const colors = getColorClasses(fase.color, isActive, isPast)

              return (
                <TooltipProvider key={fase.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center z-10">
                        <button
                          onClick={() => onCambioFase?.(fase.id)}
                          disabled={isCambioFaseLoading}
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center transition-all border-2',
                            colors.bg,
                            colors.border,
                            isActive && 'ring-2 ring-offset-2',
                            isActive && fase.color === 'green' && 'ring-green-400',
                            isActive && fase.color === 'blue' && 'ring-blue-400',
                            isActive && fase.color === 'purple' && 'ring-purple-400',
                            isActive && fase.color === 'gray' && 'ring-gray-400',
                            'cursor-pointer hover:scale-105',
                            isCambioFaseLoading && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          {isPast ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Icon className={cn('h-6 w-6', isActive ? colors.text : 'text-gray-400')} />
                          )}
                        </button>
                        <span className={cn(
                          'text-xs mt-2 font-medium',
                          isActive ? colors.text : isPast ? 'text-green-700' : 'text-gray-400'
                        )}>
                          {fase.label}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{fase.label}</p>
                        <p className="text-muted-foreground">{fase.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>

          {/* Linea di connessione */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-0" />
          <div
            className="absolute top-6 left-6 h-0.5 bg-green-500 -z-0 transition-all duration-500"
            style={{ width: `${(faseCorrenteIndex / (FASI_PIPELINE.length - 1)) * 100}%` }}
          />
        </div>

        {/* Info fase corrente */}
        {faseCorrenteInfo && (
          <div className={cn(
            'p-4 rounded-lg border',
            getColorClasses(faseCorrenteInfo.color, true, false).bg,
            getColorClasses(faseCorrenteInfo.color, true, false).border
          )}>
            <h4 className={cn('font-medium', getColorClasses(faseCorrenteInfo.color, true, false).text)}>
              {faseCorrenteInfo.label}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {faseCorrenteInfo.description}
            </p>

            {/* Mostra pacchetti attivi se ce ne sono */}
            {pacchettiAttivi.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dashed">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Servizi attivi:
                </p>
                <div className="flex flex-wrap gap-1">
                  {pacchettiAttivi.filter(Boolean).map(pacchetto => (
                    <Badge key={pacchetto} variant="secondary" className="text-xs">
                      {pacchetto}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA per aggiungere servizi se non ce ne sono */}
            {pacchettiAttivi.filter(Boolean).length === 0 && faseVisuale !== 'P0' && onNavigateToServizi && (
              <div className="mt-3 pt-3 border-t border-dashed">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onNavigateToServizi}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Aggiungi servizi dal catalogo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Progress bar requisiti fase */}
        {statoCompletamento && (statoCompletamento.documentiTotali > 0 || statoCompletamento.taskTotali > 0) && (
          <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Completamento Requisiti
              </h4>
              <Badge variant={statoCompletamento.puoAvanzare ? 'default' : 'secondary'}>
                {statoCompletamento.percentualeTotale}%
              </Badge>
            </div>

            {/* Progress generale */}
            <Progress value={statoCompletamento.percentualeTotale} className="h-2" />

            {/* Dettaglio documenti e task */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Documenti */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Documenti</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={statoCompletamento.percentualeDocumenti} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium">
                    {statoCompletamento.documentiCompletati}/{statoCompletamento.documentiTotali}
                  </span>
                </div>
                {statoCompletamento.documentiObbligatoriTotali > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Obbligatori: {statoCompletamento.documentiObbligatoriCompletati}/{statoCompletamento.documentiObbligatoriTotali}
                  </p>
                )}
              </div>

              {/* Task */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={statoCompletamento.percentualeTask} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium">
                    {statoCompletamento.taskCompletati}/{statoCompletamento.taskTotali}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prossima fase */}
        {prossimaFase && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Prossima: {prossimaFase.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {prossimaFase.description}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={isCambioFaseLoading}
              onClick={() => onCambioFase?.(prossimaFase.id)}
            >
              {isCambioFaseLoading ? 'Avanzamento...' : 'Avanza'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Fase finale raggiunta */}
        {faseVisuale === 'P4' && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Proprietà Live
              </p>
              <p className="text-xs text-green-600">
                Gestione attiva
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
