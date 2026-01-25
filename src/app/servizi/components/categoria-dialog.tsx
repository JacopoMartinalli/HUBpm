'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreateCategoriaServizio, useUpdateCategoriaServizio } from '@/lib/hooks'
import type { CategoriaServizio } from '@/types/database'

const COLORI_PREDEFINITI = [
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Blu' },
  { value: '#f59e0b', label: 'Arancione' },
  { value: '#8b5cf6', label: 'Viola' },
  { value: '#ef4444', label: 'Rosso' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#6b7280', label: 'Grigio' },
]

interface CategoriaFormData {
  nome: string
  descrizione: string
  colore: string
  attiva: boolean
}

interface CategoriaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: CategoriaServizio | null
  onClose: () => void
}

export function CategoriaDialog({
  open,
  onOpenChange,
  categoria,
  onClose,
}: CategoriaDialogProps) {
  const isEditing = categoria?.id !== undefined

  const createCategoria = useCreateCategoriaServizio()
  const updateCategoria = useUpdateCategoriaServizio()

  const form = useForm<CategoriaFormData>({
    defaultValues: {
      nome: '',
      descrizione: '',
      colore: '#6366f1',
      attiva: true,
    },
  })

  useEffect(() => {
    if (categoria) {
      form.reset({
        nome: categoria.nome || '',
        descrizione: categoria.descrizione || '',
        colore: categoria.colore || '#6366f1',
        attiva: categoria.attiva ?? true,
      })
    } else {
      form.reset({
        nome: '',
        descrizione: '',
        colore: '#6366f1',
        attiva: true,
      })
    }
  }, [categoria, form])

  const onSubmit = async (data: CategoriaFormData) => {
    const payload = {
      nome: data.nome,
      descrizione: data.descrizione || null,
      colore: data.colore,
      attiva: data.attiva,
    }

    if (isEditing && categoria?.id) {
      await updateCategoria.mutateAsync({ id: categoria.id, data: payload })
    } else {
      await createCategoria.mutateAsync(payload)
    }

    onClose()
  }

  const isLoading = createCategoria.isPending || updateCategoria.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Categoria' : 'Nuova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              rules={{ required: 'Nome obbligatorio' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome categoria *</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Setup Iniziale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrizione */}
            <FormField
              control={form.control}
              name="descrizione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrivi brevemente questa categoria..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Colore */}
            <FormField
              control={form.control}
              name="colore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colore</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {COLORI_PREDEFINITI.map((colore) => (
                      <button
                        key={colore.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          field.value === colore.value
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: colore.value }}
                        onClick={() => field.onChange(colore.value)}
                        title={colore.label}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Seleziona un colore per identificare la categoria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attiva */}
            <FormField
              control={form.control}
              name="attiva"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Categoria attiva</FormLabel>
                    <FormDescription>
                      Le categorie disattivate non vengono mostrate
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvataggio...' : isEditing ? 'Salva modifiche' : 'Crea categoria'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
