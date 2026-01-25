'use client'

import { useState } from 'react'
import { Plus, Package, Settings, FolderOpen, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PageHeader, LoadingSpinner, EmptyState, ConfirmDialog } from '@/components/shared'
import {
  useCatalogoServizi,
  useCategorieServizi,
  usePacchettiServizi,
  useDeleteCatalogoServizio,
  useUpdateCatalogoServizio,
  useDeletePacchettoServizio,
  useDeleteCategoriaServizio
} from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'
import type { CatalogoServizio, CategoriaServizio, PacchettoServizio } from '@/types/database'
import { TIPI_SERVIZIO, TIPI_PREZZO } from '@/constants'
import { ServizioDialog } from './components/servizio-dialog'
import { CategoriaDialog } from './components/categoria-dialog'
import { PacchettoDialog } from './components/pacchetto-dialog'

export default function ServiziPage() {
  const [tab, setTab] = useState<'catalogo' | 'pacchetti'>('catalogo')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Dialogs
  const [servizioDialogOpen, setServizioDialogOpen] = useState(false)
  const [selectedServizio, setSelectedServizio] = useState<CatalogoServizio | null>(null)
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaServizio | null>(null)
  const [pacchettoDialogOpen, setPacchettoDialogOpen] = useState(false)
  const [selectedPacchetto, setSelectedPacchetto] = useState<PacchettoServizio | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'servizio' | 'categoria' | 'pacchetto'; id: string; nome: string } | null>(null)

  // Data
  const { data: catalogo, isLoading: loadingCatalogo } = useCatalogoServizi()
  const { data: categorie, isLoading: loadingCategorie } = useCategorieServizi()
  const { data: pacchetti, isLoading: loadingPacchetti } = usePacchettiServizi()

  // Mutations
  const deleteServizio = useDeleteCatalogoServizio()
  const updateServizio = useUpdateCatalogoServizio()
  const deleteCategoria = useDeleteCategoriaServizio()
  const deletePacchetto = useDeletePacchettoServizio()

  const isLoading = loadingCatalogo || loadingCategorie || loadingPacchetti

  // Raggruppa servizi per categoria
  const serviziPerCategoria = catalogo?.reduce((acc, servizio) => {
    const catId = servizio.categoria_id || 'senza-categoria'
    if (!acc[catId]) acc[catId] = []
    acc[catId].push(servizio)
    return acc
  }, {} as Record<string, CatalogoServizio[]>) || {}

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set(categorie?.map(c => c.id) || [])
    if (serviziPerCategoria['senza-categoria']?.length > 0) {
      allIds.add('senza-categoria')
    }
    setExpandedCategories(allIds)
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  const handleEditServizio = (servizio: CatalogoServizio) => {
    setSelectedServizio(servizio)
    setServizioDialogOpen(true)
  }

  const handleNewServizio = (categoriaId?: string) => {
    setSelectedServizio(categoriaId ? { categoria_id: categoriaId } as CatalogoServizio : null)
    setServizioDialogOpen(true)
  }

  const handleToggleServizioAttivo = async (servizio: CatalogoServizio) => {
    await updateServizio.mutateAsync({ id: servizio.id, data: { attivo: !servizio.attivo } })
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    if (itemToDelete.type === 'servizio') {
      await deleteServizio.mutateAsync(itemToDelete.id)
    } else if (itemToDelete.type === 'categoria') {
      await deleteCategoria.mutateAsync(itemToDelete.id)
    } else if (itemToDelete.type === 'pacchetto') {
      await deletePacchetto.mutateAsync(itemToDelete.id)
    }

    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const formatPrezzo = (servizio: CatalogoServizio) => {
    if (!servizio.prezzo_base || servizio.prezzo_tipo === 'da_quotare') return 'Da quotare'
    if (servizio.prezzo_tipo === 'percentuale') return `${servizio.prezzo_base}%`
    return formatCurrency(servizio.prezzo_base)
  }

  // Usa il prezzo_base del pacchetto, non il calcolo dei singoli servizi
  const getPrezzoPackchetto = (pacchetto: PacchettoServizio) => {
    return pacchetto.prezzo_base
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogo Servizi"
        description="Gestisci i servizi che offri ai tuoi clienti"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCategoriaDialogOpen(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Nuova Categoria
            </Button>
            <Button onClick={() => handleNewServizio()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Servizio
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'catalogo' | 'pacchetti')}>
        <TabsList>
          <TabsTrigger value="catalogo" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Servizi ({catalogo?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pacchetti" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pacchetti ({pacchetti?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB CATALOGO SERVIZI */}
        <TabsContent value="catalogo" className="space-y-4 mt-6">
          {/* Azioni rapide */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Espandi tutto
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Comprimi tutto
            </Button>
          </div>

          {/* Categorie con servizi */}
          {categorie && categorie.length > 0 ? (
            <div className="space-y-3">
              {categorie.map((categoria) => {
                const serviziCategoria = serviziPerCategoria[categoria.id] || []
                const isExpanded = expandedCategories.has(categoria.id)
                const serviziAttivi = serviziCategoria.filter(s => s.attivo).length

                return (
                  <Card key={categoria.id}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoria.id)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: categoria.colore }}
                              />
                              <CardTitle className="text-base font-semibold">
                                {categoria.nome}
                              </CardTitle>
                              <Badge variant="secondary" className="ml-2">
                                {serviziAttivi}/{serviziCategoria.length} attivi
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNewServizio(categoria.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCategoria(categoria)
                                    setCategoriaDialogOpen(true)
                                  }}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Modifica categoria
                                  </DropdownMenuItem>
                                  {!categoria.predefinita && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setItemToDelete({ type: 'categoria', id: categoria.id, nome: categoria.nome })
                                          setDeleteDialogOpen(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Elimina categoria
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {categoria.descrizione && (
                            <p className="text-sm text-muted-foreground ml-11">{categoria.descrizione}</p>
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {serviziCategoria.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              Nessun servizio in questa categoria.{' '}
                              <button
                                className="text-primary hover:underline"
                                onClick={() => handleNewServizio(categoria.id)}
                              >
                                Aggiungine uno
                              </button>
                            </p>
                          ) : (
                            <div className="divide-y">
                              {serviziCategoria.map((servizio) => (
                                <ServizioRow
                                  key={servizio.id}
                                  servizio={servizio}
                                  onEdit={() => handleEditServizio(servizio)}
                                  onToggleAttivo={() => handleToggleServizioAttivo(servizio)}
                                  onDelete={() => {
                                    setItemToDelete({ type: 'servizio', id: servizio.id, nome: servizio.nome })
                                    setDeleteDialogOpen(true)
                                  }}
                                  formatPrezzo={formatPrezzo}
                                />
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )
              })}

              {/* Servizi senza categoria */}
              {serviziPerCategoria['senza-categoria']?.length > 0 && (
                <Card>
                  <Collapsible
                    open={expandedCategories.has('senza-categoria')}
                    onOpenChange={() => toggleCategory('senza-categoria')}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedCategories.has('senza-categoria') ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <CardTitle className="text-base font-semibold text-muted-foreground">
                              Senza categoria
                            </CardTitle>
                            <Badge variant="secondary" className="ml-2">
                              {serviziPerCategoria['senza-categoria'].length}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="divide-y">
                          {serviziPerCategoria['senza-categoria'].map((servizio) => (
                            <ServizioRow
                              key={servizio.id}
                              servizio={servizio}
                              onEdit={() => handleEditServizio(servizio)}
                              onToggleAttivo={() => handleToggleServizioAttivo(servizio)}
                              onDelete={() => {
                                setItemToDelete({ type: 'servizio', id: servizio.id, nome: servizio.nome })
                                setDeleteDialogOpen(true)
                              }}
                              formatPrezzo={formatPrezzo}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </div>
          ) : (
            <EmptyState
              title="Nessuna categoria"
              description="Crea delle categorie per organizzare i tuoi servizi"
              action={
                <Button onClick={() => setCategoriaDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea prima categoria
                </Button>
              }
            />
          )}
        </TabsContent>

        {/* TAB PACCHETTI */}
        <TabsContent value="pacchetti" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setSelectedPacchetto(null)
              setPacchettoDialogOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Pacchetto
            </Button>
          </div>

          {pacchetti && pacchetti.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pacchetti.map((pacchetto) => {
                const prezzoPacchetto = getPrezzoPackchetto(pacchetto)

                return (
                  <Card key={pacchetto.id} className={!pacchetto.attivo ? 'opacity-60' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{pacchetto.nome}</CardTitle>
                          {pacchetto.categoria && (
                            <Badge
                              variant="outline"
                              className="mt-1"
                              style={{ borderColor: pacchetto.categoria.colore, color: pacchetto.categoria.colore }}
                            >
                              {pacchetto.categoria.nome}
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedPacchetto(pacchetto)
                              setPacchettoDialogOpen(true)
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ type: 'pacchetto', id: pacchetto.id, nome: pacchetto.nome })
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {pacchetto.descrizione && (
                        <p className="text-sm text-muted-foreground mb-3">{pacchetto.descrizione}</p>
                      )}

                      <div className="space-y-1 mb-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          Servizi inclusi ({pacchetto.servizi?.length || 0})
                        </p>
                        {pacchetto.servizi?.map((item) => (
                          <div key={item.id} className="text-sm py-0.5">
                            <span>{item.servizio?.nome}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t flex items-center justify-between">
                        <span className="font-medium">Prezzo pacchetto</span>
                        <span className="text-lg font-bold">
                          {prezzoPacchetto ? formatCurrency(prezzoPacchetto) : 'Da quotare'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="Nessun pacchetto"
              description="Crea dei pacchetti per raggruppare servizi complementari"
              action={
                <Button onClick={() => setPacchettoDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea primo pacchetto
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ServizioDialog
        open={servizioDialogOpen}
        onOpenChange={setServizioDialogOpen}
        servizio={selectedServizio}
        categorie={categorie || []}
        onClose={() => {
          setServizioDialogOpen(false)
          setSelectedServizio(null)
        }}
      />

      <CategoriaDialog
        open={categoriaDialogOpen}
        onOpenChange={setCategoriaDialogOpen}
        categoria={selectedCategoria}
        onClose={() => {
          setCategoriaDialogOpen(false)
          setSelectedCategoria(null)
        }}
      />

      <PacchettoDialog
        open={pacchettoDialogOpen}
        onOpenChange={setPacchettoDialogOpen}
        pacchetto={selectedPacchetto}
        categorie={categorie || []}
        servizi={catalogo || []}
        onClose={() => {
          setPacchettoDialogOpen(false)
          setSelectedPacchetto(null)
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Elimina ${itemToDelete?.type === 'servizio' ? 'servizio' : itemToDelete?.type === 'categoria' ? 'categoria' : 'pacchetto'}`}
        description={`Sei sicuro di voler eliminare "${itemToDelete?.nome}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

// Componente riga servizio
function ServizioRow({
  servizio,
  onEdit,
  onToggleAttivo,
  onDelete,
  formatPrezzo,
}: {
  servizio: CatalogoServizio
  onEdit: () => void
  onToggleAttivo: () => void
  onDelete: () => void
  formatPrezzo: (s: CatalogoServizio) => string
}) {
  const tipo = TIPI_SERVIZIO.find(t => t.id === servizio.tipo)

  return (
    <div className={`flex items-center justify-between py-3 px-2 ${!servizio.attivo ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{servizio.nome}</p>
          <Badge variant="outline" className="text-xs">
            {tipo?.label}
          </Badge>
          {!servizio.attivo && (
            <Badge variant="secondary" className="text-xs">
              Disattivato
            </Badge>
          )}
        </div>
        {servizio.descrizione && (
          <p className="text-sm text-muted-foreground truncate">{servizio.descrizione}</p>
        )}
        {servizio.durata_stimata_ore && (
          <p className="text-xs text-muted-foreground">
            Durata: {servizio.durata_stimata_ore}h
            {servizio.durata_stimata_giorni && ` / ${servizio.durata_stimata_giorni}gg`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 ml-4">
        <p className="font-semibold whitespace-nowrap">{formatPrezzo(servizio)}</p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifica
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleAttivo}>
              {servizio.attivo ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Disattiva
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Attiva
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
