'use client'

import { useState } from 'react'
import {
  Plus,
  FileText,
  Copy,
  Pencil,
  Trash2,
  MoreHorizontal,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader, LoadingSpinner, EmptyState, ConfirmDialog } from '@/components/shared'
import {
  useDocumentTemplates,
  useDeleteDocumentTemplate,
  useUpdateDocumentTemplate,
  useDuplicateDocumentTemplate,
  useSetDefaultTemplate,
} from '@/lib/hooks/useDocumentTemplates'
import { CATEGORIE_TEMPLATE } from '@/constants'
import type { DocumentTemplate, CategoriaTemplate } from '@/types/database'
import { TemplateDialog } from './components/template-dialog'
import { TemplatePreviewDialog } from './components/template-preview-dialog'

export default function TemplatesPage() {
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaTemplate | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; nome: string } | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [templateToPreview, setTemplateToPreview] = useState<DocumentTemplate | null>(null)

  // Data
  const { data: templates, isLoading } = useDocumentTemplates(
    selectedCategoria === 'all' ? {} : { categoria: selectedCategoria }
  )

  // Mutations
  const deleteTemplate = useDeleteDocumentTemplate()
  const updateTemplate = useUpdateDocumentTemplate()
  const duplicateTemplate = useDuplicateDocumentTemplate()
  const setDefaultTemplate = useSetDefaultTemplate()

  const handleEdit = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleNew = (categoria?: CategoriaTemplate) => {
    setSelectedTemplate(categoria ? ({ categoria } as DocumentTemplate) : null)
    setDialogOpen(true)
  }

  const handlePreview = (template: DocumentTemplate) => {
    setTemplateToPreview(template)
    setPreviewDialogOpen(true)
  }

  const handleToggleAttivo = async (template: DocumentTemplate) => {
    await updateTemplate.mutateAsync({
      id: template.id,
      data: { attivo: !template.attivo },
    })
  }

  const handleTogglePredefinito = async (template: DocumentTemplate) => {
    if (template.predefinito) {
      // Rimuovi predefinito
      await updateTemplate.mutateAsync({
        id: template.id,
        data: { predefinito: false },
      })
    } else {
      // Imposta come predefinito (rimuove automaticamente dagli altri)
      await setDefaultTemplate.mutateAsync({
        id: template.id,
        categoria: template.categoria,
      })
    }
  }

  const handleDuplicate = async (template: DocumentTemplate) => {
    await duplicateTemplate.mutateAsync(template.id)
  }

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return
    await deleteTemplate.mutateAsync(templateToDelete.id)
    setDeleteDialogOpen(false)
    setTemplateToDelete(null)
  }

  // Raggruppa per categoria
  const templatesByCategory = templates?.reduce((acc, template) => {
    if (!acc[template.categoria]) {
      acc[template.categoria] = []
    }
    acc[template.categoria].push(template)
    return acc
  }, {} as Record<CategoriaTemplate, DocumentTemplate[]>)

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
        title="Template Documenti"
        description="Crea e personalizza i template per preventivi, proposte e contratti"
        actions={
          <Button onClick={() => handleNew()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Template
          </Button>
        }
      />

      {/* Filtro categorie */}
      <Tabs
        value={selectedCategoria}
        onValueChange={(v) => setSelectedCategoria(v as CategoriaTemplate | 'all')}
      >
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="text-sm">
            Tutti ({templates?.length || 0})
          </TabsTrigger>
          {CATEGORIE_TEMPLATE.map((cat) => {
            const count = templatesByCategory?.[cat.id]?.length || 0
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="text-sm">
                <span className="mr-1">{cat.icon}</span>
                {cat.label} ({count})
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Contenuto */}
        <TabsContent value={selectedCategoria} className="mt-6">
          {templates && templates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const categoria = CATEGORIE_TEMPLATE.find((c) => c.id === template.categoria)

                return (
                  <Card
                    key={template.id}
                    className={`transition-all ${!template.attivo ? 'opacity-60' : ''
                      } ${template.predefinito ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg truncate">
                              {template.nome}
                            </CardTitle>
                            {template.predefinito && (
                              <Badge variant="default" className="bg-blue-500 text-xs">
                                Predefinito
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {categoria?.icon} {categoria?.label}
                            </Badge>
                            {!template.attivo && (
                              <Badge variant="secondary" className="text-xs">
                                Disattivato
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(template)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Anteprima
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplica
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleAttivo(template)}>
                              {template.attivo ? (
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
                            <DropdownMenuItem onClick={() => handleTogglePredefinito(template)}>
                              {template.predefinito ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Rimuovi predefinito
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Imposta predefinito
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setTemplateToDelete({
                                  id: template.id,
                                  nome: template.nome,
                                })
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
                      {template.descrizione && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {template.descrizione}
                        </p>
                      )}

                      {/* Info variabili usate */}
                      <div className="space-y-2">
                        {template.variabili_utilizzate && template.variabili_utilizzate.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.variabili_utilizzate.slice(0, 4).map((v) => (
                              <Badge key={v} variant="secondary" className="text-xs">
                                @{v}
                              </Badge>
                            ))}
                            {template.variabili_utilizzate.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.variabili_utilizzate.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Formato: {template.formato_pagina} {template.orientamento}
                        </span>
                        <span>v{template.versione}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nessun template"
              description={
                selectedCategoria === 'all'
                  ? 'Crea il tuo primo template per iniziare a generare documenti'
                  : `Nessun template in questa categoria. Creane uno nuovo.`
              }
              action={
                <Button
                  onClick={() =>
                    handleNew(selectedCategoria === 'all' ? undefined : selectedCategoria)
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Template
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
        onClose={() => {
          setDialogOpen(false)
          setSelectedTemplate(null)
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina template"
        description={`Sei sicuro di voler eliminare "${templateToDelete?.nome}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <TemplatePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        template={templateToPreview}
      />
    </div>
  )
}
