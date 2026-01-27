'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { TemplateEditor } from '@/components/templates/editor'
import {
  useCreateDocumentTemplate,
  useUpdateDocumentTemplate,
} from '@/lib/hooks/useDocumentTemplates'
import { CATEGORIE_TEMPLATE, FORMATI_PAGINA, ORIENTAMENTI_PAGINA } from '@/constants'
import type { DocumentTemplate, CategoriaTemplate } from '@/types/database'
import '@/styles/template-editor.css'

const templateSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio'),
  descrizione: z.string().optional(),
  categoria: z.enum(['preventivo', 'proposta', 'contratto', 'privacy', 'mandato', 'lettera', 'report']),
  formato_pagina: z.enum(['A4', 'A5', 'Letter']),
  orientamento: z.enum(['portrait', 'landscape']),
  attivo: z.boolean(),
  predefinito: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: DocumentTemplate | null
  onClose: () => void
}

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  onClose,
}: TemplateDialogProps) {
  const [activeTab, setActiveTab] = useState('info')
  const [editorContent, setEditorContent] = useState<Record<string, unknown>>({})

  const createTemplate = useCreateDocumentTemplate()
  const updateTemplate = useUpdateDocumentTemplate()

  const isEditing = !!template?.id

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nome: '',
      descrizione: '',
      categoria: 'preventivo',
      formato_pagina: 'A4',
      orientamento: 'portrait',
      attivo: true,
      predefinito: false,
    },
  })

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      form.reset({
        nome: template.nome || '',
        descrizione: template.descrizione || '',
        categoria: template.categoria || 'preventivo',
        formato_pagina: template.formato_pagina || 'A4',
        orientamento: template.orientamento || 'portrait',
        attivo: template.attivo ?? true,
        predefinito: template.predefinito ?? false,
      })
      setEditorContent(template.contenuto || {})
    } else {
      form.reset({
        nome: '',
        descrizione: '',
        categoria: 'preventivo',
        formato_pagina: 'A4',
        orientamento: 'portrait',
        attivo: true,
        predefinito: false,
      })
      setEditorContent({})
    }
    setActiveTab('info')
  }, [template, form])

  // Estrai variabili usate dal contenuto
  const extractVariables = (content: Record<string, unknown>): string[] => {
    const variables: string[] = []
    const contentStr = JSON.stringify(content)

    // Trova tutte le variabili menzionate
    const regex = /"id":\s*"([^"]+)"/g
    let match
    while ((match = regex.exec(contentStr)) !== null) {
      if (match[1] && match[1].includes('.')) {
        variables.push(match[1])
      }
    }

    return Array.from(new Set(variables))
  }

  const onSubmit = async (data: TemplateFormData) => {
    try {
      const variabili = extractVariables(editorContent)

      const payload = {
        ...data,
        contenuto: editorContent,
        variabili_utilizzate: variabili,
        margini: { top: 20, right: 20, bottom: 20, left: 20 },
        stili_custom: {},
      }

      if (isEditing && template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          data: payload,
        })
      } else {
        await createTemplate.mutateAsync(payload)
      }

      onClose()
    } catch (error) {
      console.error('Errore salvataggio template:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Template' : 'Nuovo Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informazioni</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="impostazioni">Impostazioni</TabsTrigger>
            </TabsList>

            {/* Tab Informazioni */}
            <TabsContent value="info" className="flex-1 overflow-y-auto p-1">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome Template *</Label>
                  <Input
                    id="nome"
                    {...form.register('nome')}
                    placeholder="Es: Preventivo Standard"
                    className="mt-1"
                  />
                  {form.formState.errors.nome && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="descrizione">Descrizione</Label>
                  <Textarea
                    id="descrizione"
                    {...form.register('descrizione')}
                    placeholder="Descrivi brevemente questo template..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={form.watch('categoria')}
                    onValueChange={(v) => form.setValue('categoria', v as CategoriaTemplate)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIE_TEMPLATE.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Formato Pagina</Label>
                    <Select
                      value={form.watch('formato_pagina')}
                      onValueChange={(v) => form.setValue('formato_pagina', v as 'A4' | 'A5' | 'Letter')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMATI_PAGINA.map((fmt) => (
                          <SelectItem key={fmt.id} value={fmt.id}>
                            {fmt.label} ({fmt.dimensions})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Orientamento</Label>
                    <Select
                      value={form.watch('orientamento')}
                      onValueChange={(v) => form.setValue('orientamento', v as 'portrait' | 'landscape')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIENTAMENTI_PAGINA.map((ori) => (
                          <SelectItem key={ori.id} value={ori.id}>
                            {ori.icon} {ori.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab Editor */}
            <TabsContent value="editor" className="flex-1 overflow-hidden p-1">
              <div className="h-full overflow-y-auto">
                <TemplateEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  placeholder="Inizia a creare il tuo template... Usa @ per inserire variabili dinamiche."
                />
              </div>
            </TabsContent>

            {/* Tab Impostazioni */}
            <TabsContent value="impostazioni" className="flex-1 overflow-y-auto p-1">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Template Attivo</Label>
                    <p className="text-sm text-muted-foreground">
                      Solo i template attivi possono essere usati per generare documenti
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('attivo')}
                    onCheckedChange={(v) => form.setValue('attivo', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Template Predefinito</Label>
                    <p className="text-sm text-muted-foreground">
                      Questo template verrà usato come default per la sua categoria
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('predefinito')}
                    onCheckedChange={(v) => form.setValue('predefinito', v)}
                  />
                </div>

                {/* Preview variabili usate */}
                {Object.keys(editorContent).length > 0 && (
                  <div className="pt-4 border-t">
                    <Label>Variabili Rilevate</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Variabili dinamiche trovate nel contenuto del template
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {extractVariables(editorContent).length > 0 ? (
                        extractVariables(editorContent).map((v) => (
                          <span
                            key={v}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            @{v}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Nessuna variabile trovata. Usa @ nell&apos;editor per inserirle.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {createTemplate.isPending || updateTemplate.isPending
                ? 'Salvataggio...'
                : isEditing
                  ? 'Salva Modifiche'
                  : 'Crea Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
