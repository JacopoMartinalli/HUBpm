'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Search,
  Clock,
  Euro,
  Calendar,
  ListChecks,
  AlertCircle,
  ExternalLink,
  Link2,
  CheckCircle2,
  Filter,
  Printer,
  ChevronLeft,
  BookOpen,
} from 'lucide-react'
import {
  DOCUMENTI_WIKI,
  STATS_DOCUMENTI_PER_FASE,
  type DocumentoWiki,
} from '@/constants/documenti-wiki'
import { cn } from '@/lib/utils'

// Configurazione fasi
const FASI_CONFIG = [
  { id: 'P0', label: 'Valutazione', color: 'bg-gray-500' },
  { id: 'P1', label: 'Onboarding', color: 'bg-blue-500' },
  { id: 'P2', label: 'Setup Legale', color: 'bg-purple-500' },
  { id: 'P3', label: 'Setup Operativo', color: 'bg-amber-500' },
  { id: 'P4', label: 'Operativa', color: 'bg-green-500' },
  { id: 'P5', label: 'Cessata', color: 'bg-red-500' },
]

const CATEGORIE_DOC_CONFIG: Record<string, { label: string; color: string }> = {
  identita: { label: 'Identità', color: 'bg-pink-100 text-pink-800' },
  fiscale: { label: 'Fiscale', color: 'bg-emerald-100 text-emerald-800' },
  proprieta: { label: 'Proprietà', color: 'bg-blue-100 text-blue-800' },
  certificazioni: { label: 'Certificazioni', color: 'bg-amber-100 text-amber-800' },
  contratti: { label: 'Contratti', color: 'bg-purple-100 text-purple-800' },
  legale: { label: 'Legale', color: 'bg-red-100 text-red-800' },
  operativo: { label: 'Operativo', color: 'bg-cyan-100 text-cyan-800' },
}

export default function WikiDocumentiPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFase, setSelectedFase] = useState<string | null>(null)
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<DocumentoWiki | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filtra documenti
  const filteredDocs = useMemo(() => {
    return DOCUMENTI_WIKI.filter(doc => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNome = doc.nome.toLowerCase().includes(query)
        const matchDesc = doc.descrizione.toLowerCase().includes(query)
        const matchProc = doc.procedura.some(p => p.toLowerCase().includes(query))
        if (!matchNome && !matchDesc && !matchProc) return false
      }
      if (selectedFase && doc.fase !== selectedFase) return false
      if (selectedCategoria && doc.categoria !== selectedCategoria) return false
      return true
    })
  }, [searchQuery, selectedFase, selectedCategoria])

  // Documenti raggruppati per fase
  const docsByFase = useMemo(() => {
    const grouped: Record<string, DocumentoWiki[]> = {}
    for (const fase of FASI_CONFIG) {
      grouped[fase.id] = filteredDocs.filter(d => d.fase === fase.id)
    }
    return grouped
  }, [filteredDocs])

  const openDocDetail = (doc: DocumentoWiki) => {
    setSelectedDoc(doc)
    setDialogOpen(true)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedFase(null)
    setSelectedCategoria(null)
  }

  const hasActiveFilters = searchQuery || selectedFase || selectedCategoria

  return (
    <div className="space-y-6">
      {/* Header con breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/wiki" className="hover:text-foreground transition-colors flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Wiki
            </Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <span>Documenti</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Wiki Documenti
          </h1>
          <p className="text-muted-foreground">
            Guida completa ai {DOCUMENTI_WIKI.length} documenti richiesti per la gestione delle proprietà
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Stampa
        </Button>
      </div>

      {/* Statistiche per fase */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
        {FASI_CONFIG.map(fase => {
          const stats = STATS_DOCUMENTI_PER_FASE[fase.id as keyof typeof STATS_DOCUMENTI_PER_FASE]
          return (
            <Card
              key={fase.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedFase === fase.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedFase(selectedFase === fase.id ? null : fase.id)}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", fase.color)} />
                  <CardTitle className="text-xs font-medium">{fase.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-xl font-bold">{stats.totale}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.obbligatori} obbligatori
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Ricerca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca documento per nome, descrizione o procedura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro categoria */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORIE_DOC_CONFIG).map(([id, config]) => (
                <Badge
                  key={id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all text-xs",
                    selectedCategoria === id
                      ? config.color
                      : "hover:bg-muted"
                  )}
                  onClick={() => setSelectedCategoria(selectedCategoria === id ? null : id)}
                >
                  {config.label}
                </Badge>
              ))}
            </div>

            {/* Reset filtri */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <Filter className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {filteredDocs.length} documenti trovati
            {hasActiveFilters && ` (su ${DOCUMENTI_WIKI.length} totali)`}
          </div>
        </CardContent>
      </Card>

      {/* Lista documenti per fase con Accordion */}
      <Accordion type="multiple" defaultValue={FASI_CONFIG.map(f => f.id)} className="space-y-3">
        {FASI_CONFIG.map(fase => {
          const docs = docsByFase[fase.id] || []
          if (docs.length === 0 && hasActiveFilters) return null

          return (
            <AccordionItem key={fase.id} value={fase.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", fase.color)} />
                  <span className="font-semibold text-sm">{fase.id} - {fase.label}</span>
                  <Badge variant="secondary" className="text-xs">{docs.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 py-2">
                  {docs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => openDocDetail(doc)}
                    >
                      <div className="mt-0.5">
                        {doc.obbligatorio ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">
                            {doc.nome}
                          </span>
                          {doc.obbligatorio && (
                            <Badge variant="default" className="text-xs py-0 h-5">Obb.</Badge>
                          )}
                          <Badge className={cn("text-xs py-0 h-5", CATEGORIE_DOC_CONFIG[doc.categoria]?.color)}>
                            {CATEGORIE_DOC_CONFIG[doc.categoria]?.label}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {doc.descrizione}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          {doc.tempiStimati && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {doc.tempiStimati}
                            </span>
                          )}
                          {doc.costo && (
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {doc.costo}
                            </span>
                          )}
                        </div>
                      </div>

                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  ))}
                  {docs.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Nessun documento in questa fase
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Dialog dettaglio documento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedDoc.nome}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge className={FASI_CONFIG.find(f => f.id === selectedDoc.fase)?.color}>
                    {selectedDoc.fase}
                  </Badge>
                  <Badge variant={selectedDoc.obbligatorio ? "default" : "secondary"}>
                    {selectedDoc.obbligatorio ? 'Obbligatorio' : 'Facoltativo'}
                  </Badge>
                  <Badge className={CATEGORIE_DOC_CONFIG[selectedDoc.categoria]?.color}>
                    {CATEGORIE_DOC_CONFIG[selectedDoc.categoria]?.label}
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* Descrizione */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Descrizione</h4>
                  <p className="text-sm text-muted-foreground">{selectedDoc.descrizione}</p>
                </div>

                {/* Procedura */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Procedura
                  </h4>
                  <ol className="space-y-2">
                    {selectedDoc.procedura.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedDoc.tempiStimati && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        Tempi stimati
                      </div>
                      <p className="text-sm font-medium">{selectedDoc.tempiStimati}</p>
                    </div>
                  )}
                  {selectedDoc.costo && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Euro className="h-3 w-3" />
                        Costo
                      </div>
                      <p className="text-sm font-medium">{selectedDoc.costo}</p>
                    </div>
                  )}
                  {selectedDoc.scadenza && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Scadenza
                      </div>
                      <p className="text-sm font-medium">{selectedDoc.scadenza}</p>
                    </div>
                  )}
                </div>

                {/* Note */}
                {selectedDoc.note && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <h4 className="font-semibold text-sm mb-1 text-amber-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Note importanti
                    </h4>
                    <p className="text-sm text-amber-700">{selectedDoc.note}</p>
                  </div>
                )}

                {/* Link utili */}
                {selectedDoc.linkUtili && selectedDoc.linkUtili.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Link utili
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.linkUtili.map((link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {link.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documenti correlati */}
                {selectedDoc.documentiCorrelati && selectedDoc.documentiCorrelati.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Documenti correlati</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.documentiCorrelati.map((docId, index) => {
                        const relatedDoc = DOCUMENTI_WIKI.find(d => d.id === docId)
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => {
                              if (relatedDoc) {
                                setSelectedDoc(relatedDoc)
                              }
                            }}
                          >
                            {relatedDoc?.nome || docId.replace('doc_', '').replace(/_/g, ' ')}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
