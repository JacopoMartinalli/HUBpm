'use client'

import { useState } from 'react'
import { FileText, Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProposteProprietaView } from '@/components/proposte'
import { ErogazioneProprietaView } from '@/components/erogazione'

interface CommercialeSectionProps {
  proprietaId: string
  contattoId: string
  proprietaNome: string
  faseProprieta: string
  onPropostaAccettata?: () => void
}

export function CommercialeSection({ proprietaId, contattoId, proprietaNome, faseProprieta, onPropostaAccettata }: CommercialeSectionProps) {
  const [subView, setSubView] = useState<'proposte' | 'servizi'>('proposte')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setSubView('proposte')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
            subView === 'proposte' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Proposte
        </button>
        <button
          onClick={() => setSubView('servizi')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
            subView === 'servizi' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Boxes className="h-3.5 w-3.5" />
          Servizi Erogati
        </button>
      </div>

      {subView === 'proposte' ? (
        <ProposteProprietaView
          proprietaId={proprietaId}
          contattoId={contattoId}
          proprietaNome={proprietaNome}
          faseProprieta={faseProprieta}
          onPropostaAccettata={onPropostaAccettata}
        />
      ) : (
        <ErogazioneProprietaView
          proprietaId={proprietaId}
          proprietaNome={proprietaNome}
        />
      )}
    </div>
  )
}
