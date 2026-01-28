'use client'

import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Trash2,
  Eye,
  Copy,
  FileDown
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { PropostaCommerciale, StatoProposta } from '@/types/database'

interface PropostaCardProps {
  proposta: PropostaCommerciale
  onView?: (id: string) => void
  onDelete?: (id: string) => void
  onDuplica?: (id: string) => void
  onCambiaStato?: (id: string, stato: StatoProposta) => void
  onGeneraDocumento?: (proposta: PropostaCommerciale) => void
  compact?: boolean
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

export function PropostaCard({
  proposta,
  onView,
  onDelete,
  onDuplica,
  onCambiaStato,
  onGeneraDocumento,
  compact = false
}: PropostaCardProps) {
  const statoConfig = STATO_CONFIG[proposta.stato]
  const StatoIcon = statoConfig.icon

  const itemsCount = proposta.items?.length || 0

  if (compact) {
    return (
      <div
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => onView?.(proposta.id)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-full', statoConfig.bgColor)}>
            <StatoIcon className={cn('h-4 w-4', statoConfig.color)} />
          </div>
          <div>
            <p className="font-medium text-sm">
              {proposta.numero || 'Bozza'}
              {proposta.titolo && ` - ${proposta.titolo}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {itemsCount} {itemsCount === 1 ? 'servizio' : 'servizi'} •{' '}
              {formatDate(proposta.data_creazione)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatCurrency(proposta.totale)}</span>
          <Badge variant="outline" className={cn('text-xs', statoConfig.color, statoConfig.bgColor)}>
            {statoConfig.label}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', statoConfig.bgColor)}>
              <StatoIcon className={cn('h-5 w-5', statoConfig.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {proposta.numero || 'Nuova Proposta'}
                </h3>
                <Badge variant="outline" className={cn('text-xs', statoConfig.color, statoConfig.bgColor)}>
                  {statoConfig.label}
                </Badge>
              </div>
              {proposta.titolo && (
                <p className="text-sm text-muted-foreground">{proposta.titolo}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(proposta.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizza
              </DropdownMenuItem>
              {onGeneraDocumento && (
                <DropdownMenuItem onClick={() => onGeneraDocumento(proposta)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Genera Preventivo
                </DropdownMenuItem>
              )}
              {proposta.stato === 'bozza' && onDuplica && (
                <DropdownMenuItem onClick={() => onDuplica(proposta.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplica
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {proposta.stato === 'bozza' && onCambiaStato && (
                <DropdownMenuItem onClick={() => onCambiaStato(proposta.id, 'inviata')}>
                  <Send className="h-4 w-4 mr-2" />
                  Segna come Inviata
                </DropdownMenuItem>
              )}
              {proposta.stato === 'inviata' && onCambiaStato && (
                <>
                  <DropdownMenuItem onClick={() => onCambiaStato(proposta.id, 'accettata')}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    Accetta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCambiaStato(proposta.id, 'rifiutata')}>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Rifiuta
                  </DropdownMenuItem>
                </>
              )}
              {(proposta.stato === 'bozza' || proposta.stato === 'rifiutata') && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(proposta.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info cliente/proprietà */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Cliente</p>
            <p className="font-medium">
              {proposta.contatto?.nome} {proposta.contatto?.cognome}
            </p>
          </div>
          {proposta.proprieta && (
            <div>
              <p className="text-muted-foreground">Proprietà</p>
              <p className="font-medium">{proposta.proprieta.nome}</p>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Creata</p>
            <p>{formatDate(proposta.data_creazione)}</p>
          </div>
          {proposta.data_scadenza && (
            <div>
              <p className="text-muted-foreground">Scadenza</p>
              <p>{formatDate(proposta.data_scadenza)}</p>
            </div>
          )}
        </div>

        {/* Items preview */}
        {proposta.items && proposta.items.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {itemsCount} {itemsCount === 1 ? 'servizio incluso' : 'servizi inclusi'}
            </p>
            <div className="space-y-1">
              {proposta.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate">{item.nome}</span>
                  <span className="font-medium">{formatCurrency(item.prezzo_totale)}</span>
                </div>
              ))}
              {itemsCount > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{itemsCount - 3} altri...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Totali */}
        <div className="pt-3 border-t">
          {proposta.sconto_percentuale > 0 || proposta.sconto_fisso > 0 ? (
            <>
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
            </>
          ) : null}
          <div className="flex justify-between font-semibold text-lg mt-1">
            <span>Totale</span>
            <span>{formatCurrency(proposta.totale)}</span>
          </div>
        </div>

        {/* Azioni rapide */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView?.(proposta.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Dettagli
          </Button>
          {proposta.stato === 'bozza' && onCambiaStato && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onCambiaStato(proposta.id, 'inviata')}
            >
              <Send className="h-4 w-4 mr-1" />
              Invia
            </Button>
          )}
          {proposta.stato === 'inviata' && onCambiaStato && (
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onCambiaStato(proposta.id, 'accettata')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Accetta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
