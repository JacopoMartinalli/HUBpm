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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { TemplateEditor } from '@/components/templates/editor'
import {
  useCreateDocumentTemplate,
  useUpdateDocumentTemplate,
} from '@/lib/hooks/useDocumentTemplates'
import { CATEGORIE_TEMPLATE, FORMATI_PAGINA, ORIENTAMENTI_PAGINA } from '@/constants'
import type { DocumentTemplate, CategoriaTemplate } from '@/types/database'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import '@/styles/template-editor.css'

const templateSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio'),
  descrizione: z.string().optional(),
  categoria: z.enum(['preventivo', 'proposta', 'contratto', 'mandato_pf', 'mandato_pg', 'procura', 'elenco_dotazioni', 'report_mensile']),
  formato_pagina: z.enum(['A4', 'A5', 'Letter']),
  orientamento: z.enum(['portrait', 'landscape']),
  attivo: z.boolean(),
  predefinito: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

const NOMI_SUGGERITI: Record<string, string> = {
  preventivo: 'Preventivo Standard',
  proposta: 'Proposta Commerciale',
  contratto: 'Contratto di Gestione',
  mandato_pf: 'Mandato Persona Fisica',
  mandato_pg: 'Mandato Persona Giuridica',
  procura: 'Procura Allegata',
  elenco_dotazioni: 'Elenco Dotazioni Proprietà',
  report_mensile: 'Report Mensile Attività',
}

const STEPS = [
  { id: 'categoria', label: 'Tipo documento' },
  { id: 'dettagli', label: 'Dettagli' },
  { id: 'editor', label: 'Contenuto' },
  { id: 'impostazioni', label: 'Impostazioni' },
] as const

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: DocumentTemplate | null
  existingTemplates?: DocumentTemplate[]
  onClose: () => void
}

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  existingTemplates = [],
  onClose,
}: TemplateDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
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

  const selectedCategoria = form.watch('categoria')

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
      // Edit mode: start at dettagli. New with pre-selected categoria: also dettagli.
      if (template.id) {
        setCurrentStep(1)
      } else if (template.categoria) {
        // Pre-fill suggested name
        if (!template.nome) {
          form.setValue('nome', NOMI_SUGGERITI[template.categoria] || '')
        }
        setCurrentStep(1)
      } else {
        setCurrentStep(0)
      }
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
      setCurrentStep(0)
    }
  }, [template, form])

  const extractVariables = (content: Record<string, unknown>): string[] => {
    const variables: string[] = []
    const contentStr = JSON.stringify(content)
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

  const handleSelectCategoria = (categoriaId: string) => {
    form.setValue('categoria', categoriaId as CategoriaTemplate)
    if (!form.getValues('nome')) {
      form.setValue('nome', NOMI_SUGGERITI[categoriaId] || '')
    }
    setCurrentStep(1)
  }

  const canGoNext = () => {
    if (currentStep === 1) return !!form.getValues('nome')
    return true
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      if (isEditing && currentStep === 1) return
      setCurrentStep(currentStep - 1)
    }
  }

  const isLastStep = currentStep === STEPS.length - 1

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

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-1">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isClickable = isEditing || index < currentStep

            return (
              <button
                key={step.id}
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-muted text-muted-foreground'
                } ${isClickable && !isActive ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => isClickable && setCurrentStep(index)}
                disabled={!isClickable && !isActive}
              >
                <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] flex-shrink-0 ${
                  isActive ? 'bg-primary-foreground text-primary' : isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/30 text-muted-foreground'
                }`}>
                  {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {step.label}
              </button>
            )
          })}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-1">
            {/* Step 0: Selezione Categoria */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Seleziona il tipo di documento che vuoi creare. Ogni categoria corrisponde a un diverso modello documentale.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIE_TEMPLATE.map((cat) => {
                    const hasExisting = existingTemplates.some(
                      (t) => t.categoria === cat.id && t.attivo
                    )
                    const isSelected = selectedCategoria === cat.id

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleSelectCategoria(cat.id)}
                      >
                        <span className="text-2xl mt-0.5">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{cat.label}</span>
                            {hasExisting ? (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Esistente
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">
                                Mancante
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Dettagli */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-lg">
                    {CATEGORIE_TEMPLATE.find((c) => c.id === selectedCategoria)?.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {CATEGORIE_TEMPLATE.find((c) => c.id === selectedCategoria)?.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORIE_TEMPLATE.find((c) => c.id === selectedCategoria)?.description}
                    </p>
                  </div>
                </div>

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
            )}

            {/* Step 2: Editor */}
            {currentStep === 2 && (
              <div className="h-full overflow-y-auto">
                <TemplateEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  placeholder="Inizia a creare il tuo template... Usa @ per inserire variabili dinamiche."
                />
              </div>
            )}

            {/* Step 3: Impostazioni */}
            {currentStep === 3 && (
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

                {/* Riepilogo */}
                <div className="pt-4 border-t space-y-4">
                  <h4 className="text-sm font-medium">Riepilogo Template</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Categoria</p>
                      <p className="font-medium">
                        {CATEGORIE_TEMPLATE.find((c) => c.id === selectedCategoria)?.icon}{' '}
                        {CATEGORIE_TEMPLATE.find((c) => c.id === selectedCategoria)?.label}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Nome</p>
                      <p className="font-medium">{form.getValues('nome') || '\u2014'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Formato</p>
                      <p className="font-medium">{form.getValues('formato_pagina')} \u2014 {form.getValues('orientamento') === 'portrait' ? 'Verticale' : 'Orizzontale'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Variabili usate</p>
                      <p className="font-medium">{extractVariables(editorContent).length}</p>
                    </div>
                  </div>

                  {extractVariables(editorContent).length > 0 && (
                    <div>
                      <Label>Variabili Rilevate</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {extractVariables(editorContent).map((v) => (
                          <span
                            key={v}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            @{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div>
              {currentStep > 0 && !(isEditing && currentStep === 1) && (
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Indietro
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              {currentStep === 0 ? null : isLastStep ? (
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
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext()}
                >
                  Avanti
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
