'use client'

import { useState } from 'react'
import {
  FileText,
  Upload,
  Check,
  Clock,
  AlertCircle,
  X,
  Eye,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useDocumentiByContatto,
  useDocumentiByProprieta,
  useUpdateDocumento,
  useGeneraDocumentiDaTemplate,
} from '@/lib/hooks'
import type { Documento, StatoDocumento } from '@/types/database'

interface DocumentiListProps {
  tipo: 'cliente' | 'proprieta'
  entityId: string
  fase: string
  showGeneraButton?: boolean
}

const STATO_CONFIG: Record<StatoDocumento, { label: string; icon: typeof Check; color: string }> = {
  mancante: { label: 'Mancante', icon: X, color: 'bg-red-100 text-red-800' },
  richiesto: { label: 'Richiesto', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  ricevuto: { label: 'Ricevuto', icon: Check, color: 'bg-blue-100 text-blue-800' },
  verificato: { label: 'Verificato', icon: Check, color: 'bg-green-100 text-green-800' },
  scaduto: { label: 'Scaduto', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
}

const CATEGORIA_LABELS: Record<string, string> = {
  identita: 'Identita',
  fiscale: 'Fiscale',
  proprieta: 'Proprieta',
  certificazioni: 'Certificazioni',
  contratti: 'Contratti',
  procure: 'Procure',
  legale: 'Legale',
  operativo: 'Operativo',
  marketing: 'Marketing',
}

export function DocumentiList({ tipo, entityId, fase, showGeneraButton = true }: DocumentiListProps) {
  // Call both hooks unconditionally to satisfy React's rules of hooks
  const clienteQuery = useDocumentiByContatto(tipo === 'cliente' ? entityId : '')
  const proprietaQuery = useDocumentiByProprieta(tipo === 'proprieta' ? entityId : '')

  // Select the appropriate result based on tipo
  const { data: documenti, isLoading } = tipo === 'cliente' ? clienteQuery : proprietaQuery

  const updateDocumento = useUpdateDocumento()
  const generaDocumenti = useGeneraDocumentiDaTemplate()

  const handleGeneraDocumenti = async () => {
    await generaDocumenti.mutateAsync({
      tipoEntita: tipo,
      fase,
      contattoId: tipo === 'cliente' ? entityId : undefined,
      proprietaId: tipo === 'proprieta' ? entityId : undefined,
    })
  }

  const handleCambiaStato = async (id: string, nuovoStato: StatoDocumento) => {
    await updateDocumento.mutateAsync({ id, stato: nuovoStato })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Caricamento documenti...</p>
        </CardContent>
      </Card>
    )
  }

  // Raggruppa documenti per categoria
  const documentiPerCategoria = (documenti || []).reduce((acc, doc) => {
    if (!acc[doc.categoria]) {
      acc[doc.categoria] = []
    }
    acc[doc.categoria].push(doc)
    return acc
  }, {} as Record<string, Documento[]>)

  const categorie = Object.keys(documentiPerCategoria).sort()

  // Statistiche
  const totali = documenti?.length || 0
  const completati = documenti?.filter(d => d.stato === 'ricevuto' || d.stato === 'verificato').length || 0
  const obbligatoriTotali = documenti?.filter(d => d.obbligatorio).length || 0
  const obbligatoriCompletati = documenti?.filter(d => d.obbligatorio && (d.stato === 'ricevuto' || d.stato === 'verificato')).length || 0

  return (
    <div className="space-y-4">
      {/* Header con statistiche */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium">{completati}/{totali}</span>
            <span className="text-muted-foreground"> documenti completati</span>
          </div>
          {obbligatoriTotali > 0 && (
            <Badge variant={obbligatoriCompletati >= obbligatoriTotali ? 'default' : 'destructive'}>
              {obbligatoriCompletati}/{obbligatoriTotali} obbligatori
            </Badge>
          )}
        </div>
        {showGeneraButton && totali === 0 && (
          <Button
            size="sm"
            onClick={handleGeneraDocumenti}
            disabled={generaDocumenti.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generaDocumenti.isPending ? 'animate-spin' : ''}`} />
            Genera Documenti
          </Button>
        )}
      </div>

      {/* Lista per categoria */}
      {categorie.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nessun documento presente</p>
              {showGeneraButton && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleGeneraDocumenti}
                  disabled={generaDocumenti.isPending}
                >
                  Genera documenti per questa fase
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        categorie.map((categoria) => (
          <Card key={categoria}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">
                {CATEGORIA_LABELS[categoria] || categoria}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {documentiPerCategoria[categoria].map((doc) => (
                  <DocumentoRow
                    key={doc.id}
                    documento={doc}
                    onCambiaStato={handleCambiaStato}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

interface DocumentoRowProps {
  documento: Documento
  onCambiaStato: (id: string, stato: StatoDocumento) => void
}

function DocumentoRow({ documento, onCambiaStato }: DocumentoRowProps) {
  const statoConfig = STATO_CONFIG[documento.stato]
  const Icon = statoConfig.icon

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${statoConfig.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{documento.nome}</p>
            {documento.obbligatorio && (
              <Badge variant="outline" className="text-xs">
                Obbligatorio
              </Badge>
            )}
          </div>
          {documento.descrizione && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {documento.descrizione}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className={statoConfig.color}>{statoConfig.label}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'richiesto')}>
              <Clock className="h-4 w-4 mr-2" />
              Segna come Richiesto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'ricevuto')}>
              <Check className="h-4 w-4 mr-2" />
              Segna come Ricevuto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'verificato')}>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Segna come Verificato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'mancante')}>
              <X className="h-4 w-4 mr-2" />
              Segna come Mancante
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
