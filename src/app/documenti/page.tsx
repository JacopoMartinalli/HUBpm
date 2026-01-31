'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  FileText,
  Copy,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Download,
  FilePlus,
  Archive,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, LoadingSpinner, ConfirmDialog } from '@/components/shared'
import {
  useDocumentTemplates,
  useDeleteDocumentTemplate,
  useUpdateDocumentTemplate,
  useDuplicateDocumentTemplate,
  useSetDefaultTemplate,
} from '@/lib/hooks/useDocumentTemplates'
import { useDocumentiGenerati, useDeleteDocumentoGenerato } from '@/lib/hooks/useDocumentiGenerati'
import { CATEGORIE_TEMPLATE, GRUPPI_TEMPLATE, STATI_DOCUMENTO_GENERATO } from '@/constants'
import type { DocumentTemplate, CategoriaTemplate } from '@/types/database'
import { TemplateDialog } from './components/template-dialog'
import { TemplatePreviewDialog } from './components/template-preview-dialog'

export default function DocumentiPage() {
  const [activeTab, setActiveTab] = useState('archivio')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; nome: string } | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [templateToPreview, setTemplateToPreview] = useState<DocumentTemplate | null>(null)
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<{ id: string; titolo: string } | null>(null)

  // Data
  const { data: templates, isLoading: templatesLoading } = useDocumentTemplates({})
  const { data: documentiGenerati, isLoading: documentiLoading } = useDocumentiGenerati()

  // Mutations
  const deleteTemplate = useDeleteDocumentTemplate()
  const updateTemplate = useUpdateDocumentTemplate()
  const duplicateTemplate = useDuplicateDocumentTemplate()
  const setDefaultTemplate = useSetDefaultTemplate()
  const deleteDocumento = useDeleteDocumentoGenerato()

  // Template completion stats
  const templateStats = useMemo(() => {
    const categorieConTemplate = CATEGORIE_TEMPLATE.filter((cat) =>
      templates?.some((t) => t.categoria === cat.id && t.attivo)
    ).length
    return {
      completate: categorieConTemplate,
      totale: CATEGORIE_TEMPLATE.length,
      tutteComplete: categorieConTemplate === CATEGORIE_TEMPLATE.length,
    }
  }, [templates])

  const handleEdit = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedTemplate(null)
    setDialogOpen(true)
  }

  const handleNewWithCategoria = (categoria: CategoriaTemplate) => {
    setSelectedTemplate({ categoria } as DocumentTemplate)
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
      await updateTemplate.mutateAsync({
        id: template.id,
        data: { predefinito: false },
      })
    } else {
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

  const handleDeleteDocConfirm = async () => {
    if (!docToDelete) return
    await deleteDocumento.mutateAsync(docToDelete.id)
    setDeleteDocDialogOpen(false)
    setDocToDelete(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documenti"
        description="Archivio documenti generati e gestione template"
        actions={
          activeTab === 'templates' ? (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Template
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="archivio">
            <Archive className="h-4 w-4 mr-1.5" />
            Archivio ({documentiGenerati?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FilePlus className="h-4 w-4 mr-1.5" />
            Template ({templates?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* =================== TAB ARCHIVIO =================== */}
        <TabsContent value="archivio" className="mt-4">
          {documentiLoading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              {GRUPPI_TEMPLATE.map((gruppo) => {
                const categorieGruppo = CATEGORIE_TEMPLATE.filter((cat) => cat.gruppo === gruppo.id)
                const documentiGruppo = documentiGenerati?.filter((doc) =>
                  categorieGruppo.some((cat) => cat.id === doc.categoria)
                ) || []

                return (
                  <div key={gruppo.id} className="space-y-3">
                    {/* Header gruppo */}
                    <div className="flex items-center gap-3 px-1">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{gruppo.label}</h3>
                        <p className="text-xs text-muted-foreground">{gruppo.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {documentiGruppo.length} {documentiGruppo.length === 1 ? 'documento' : 'documenti'}
                      </Badge>
                    </div>

                    {/* Categorie del gruppo */}
                    <div className="space-y-2 pl-2">
                      {categorieGruppo.map((cat) => {
                        const documentiCategoria = documentiGruppo.filter((doc) => doc.categoria === cat.id)
                        const hasDocumenti = documentiCategoria.length > 0

                        return (
                          <Card key={cat.id} className={!hasDocumenti ? 'border-dashed opacity-60' : ''}>
                            <CardContent className="p-0">
                              {/* Header categoria */}
                              <div className={`flex items-center justify-between px-4 py-2.5 ${hasDocumenti ? 'border-b bg-muted/30' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{cat.label}</span>
                                  {hasDocumenti && (
                                    <Badge variant="secondary" className="text-xs">
                                      {documentiCategoria.length}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Documenti della categoria */}
                              {hasDocumenti && (
                                <div className="divide-y">
                                  {documentiCategoria.map((doc) => {
                                    const statoConfig = STATI_DOCUMENTO_GENERATO.find((s) => s.id === doc.stato)
                                    const riferimento = doc.contatto
                                      ? `${(doc.contatto as any).nome || ''} ${(doc.contatto as any).cognome || ''}`.trim()
                                      : doc.proprieta
                                        ? (doc.proprieta as any).nome || ''
                                        : '\u2014'

                                    return (
                                      <div
                                        key={doc.id}
                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{doc.titolo}</p>
                                            {doc.numero && (
                                              <p className="text-xs text-muted-foreground">{doc.numero}</p>
                                            )}
                                          </div>
                                          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                                            {riferimento}
                                          </span>
                                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(doc.data_generazione).toLocaleDateString('it-IT', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                            })}
                                          </span>
                                          <Badge className={`text-xs whitespace-nowrap ${statoConfig?.color || ''}`}>
                                            {statoConfig?.label || doc.stato}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                          {doc.file_url ? (
                                            <>
                                              {/* Apri in nuova tab */}
                                              <a
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Apri PDF"
                                              >
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                  <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                              </a>
                                              {/* Scarica */}
                                              <a href={doc.file_url} download title="Scarica PDF">
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                  <Download className="h-3.5 w-3.5" />
                                                </Button>
                                              </a>
                                            </>
                                          ) : (
                                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                              PDF non disponibile
                                            </Badge>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => {
                                              setDocToDelete({ id: doc.id, titolo: doc.titolo })
                                              setDeleteDocDialogOpen(true)
                                            }}
                                            title="Elimina"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* =================== TAB TEMPLATE =================== */}
        <TabsContent value="templates" className="mt-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner completamento */}
              {!templateStats.tutteComplete && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {templateStats.completate} di {templateStats.totale} categorie hanno un template attivo
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Crea i template mancanti per poter generare tutti i tipi di documento
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-amber-700">
                    {templateStats.completate}/{templateStats.totale}
                  </div>
                </div>
              )}

              {templateStats.tutteComplete && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Tutte le categorie hanno almeno un template attivo
                  </p>
                </div>
              )}

              {/* Lista per gruppi */}
              <div className="space-y-6">
                {GRUPPI_TEMPLATE.map((gruppo) => {
                  const categorieGruppo = CATEGORIE_TEMPLATE.filter((cat) => cat.gruppo === gruppo.id)
                  const templatesGruppo = templates?.filter((t) =>
                    categorieGruppo.some((cat) => cat.id === t.categoria)
                  ) || []
                  const categorieComplete = categorieGruppo.filter((cat) =>
                    templates?.some((t) => t.categoria === cat.id && t.attivo)
                  ).length

                  return (
                    <div key={gruppo.id} className="space-y-3">
                      {/* Header gruppo */}
                      <div className="flex items-center gap-3 px-1">
                        <span className="text-xl">{gruppo.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{gruppo.label}</h3>
                          <p className="text-xs text-muted-foreground">{gruppo.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {categorieComplete}/{categorieGruppo.length} complete
                        </Badge>
                      </div>

                      {/* Categorie del gruppo */}
                      <div className="space-y-2 pl-2">
                        {categorieGruppo.map((cat) => {
                          const catTemplates = templates?.filter((t) => t.categoria === cat.id) || []
                          const hasTemplates = catTemplates.length > 0
                          const hasActiveTemplate = catTemplates.some((t) => t.attivo)

                          return (
                            <Card key={cat.id} className={!hasActiveTemplate ? 'border-amber-200 dark:border-amber-900' : ''}>
                              <CardContent className="p-0">
                                {/* Header categoria */}
                                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${hasActiveTemplate ? 'bg-muted/30' : 'bg-amber-50/50 dark:bg-amber-950/20'}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{cat.icon}</span>
                                    <div>
                                      <span className="font-medium text-sm">{cat.label}</span>
                                      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{cat.description}</span>
                                    </div>
                                    {!hasActiveTemplate && (
                                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                                        Da creare
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant={hasActiveTemplate ? 'ghost' : 'default'}
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleNewWithCategoria(cat.id as CategoriaTemplate)}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    {hasActiveTemplate ? 'Aggiungi' : 'Crea Template'}
                                  </Button>
                                </div>

                                {/* Template della categoria */}
                                {hasTemplates ? (
                                  <div className="divide-y">
                                    {catTemplates.map((template) => (
                                      <div
                                        key={template.id}
                                        className={`flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors ${
                                          !template.attivo ? 'opacity-50' : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          <span className="text-sm truncate">{template.nome}</span>
                                          {template.predefinito && (
                                            <Badge variant="default" className="bg-blue-500 text-xs flex-shrink-0">
                                              Predefinito
                                            </Badge>
                                          )}
                                          {!template.attivo && (
                                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                                              Disattivato
                                            </Badge>
                                          )}
                                          <span className="text-xs text-muted-foreground flex-shrink-0">
                                            v{template.versione}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(template)} title="Anteprima">
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(template)} title="Modifica">
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(template)} title="Duplica">
                                            <Copy className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTogglePredefinito(template)} title={template.predefinito ? 'Rimuovi predefinito' : 'Imposta predefinito'}>
                                            {template.predefinito ? <StarOff className="h-3.5 w-3.5 text-yellow-500" /> : <Star className="h-3.5 w-3.5" />}
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleAttivo(template)} title={template.attivo ? 'Disattiva' : 'Attiva'}>
                                            {template.attivo ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => {
                                              setTemplateToDelete({ id: template.id, nome: template.nome })
                                              setDeleteDialogOpen(true)
                                            }}
                                            title="Elimina"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="px-4 py-4 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">Nessun template</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleNewWithCategoria(cat.id as CategoriaTemplate)}
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1" />
                                      Crea Template
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
        existingTemplates={templates || []}
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

      <ConfirmDialog
        open={deleteDocDialogOpen}
        onOpenChange={setDeleteDocDialogOpen}
        title="Elimina documento"
        description={`Sei sicuro di voler eliminare "${docToDelete?.titolo}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        variant="destructive"
        onConfirm={handleDeleteDocConfirm}
      />
    </div>
  )
}
