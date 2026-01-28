'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateLocale, useUpdateLocale } from '@/lib/hooks'
import { TIPI_LOCALE } from '@/constants'
import type { Locale } from '@/types/database'
import { useEffect } from 'react'

const formSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio'),
  tipo: z.string().min(1, 'Tipo obbligatorio'),
  mq: z.number().nullable().optional(),
  posti_letto: z.number().nullable().optional(),
  dotazioni: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface LocaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proprietaId: string
  locale?: Locale | null
  onSuccess?: () => void
}

export function LocaleDialog({
  open,
  onOpenChange,
  proprietaId,
  locale,
  onSuccess,
}: LocaleDialogProps) {
  const createMutation = useCreateLocale()
  const updateMutation = useUpdateLocale()
  const isEditing = !!locale

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      tipo: '',
      mq: null,
      posti_letto: null,
      dotazioni: '',
      note: '',
    },
  })

  useEffect(() => {
    if (locale) {
      form.reset({
        nome: locale.nome,
        tipo: locale.tipo,
        mq: locale.mq,
        posti_letto: locale.posti_letto,
        dotazioni: locale.dotazioni || '',
        note: locale.note || '',
      })
    } else {
      form.reset({
        nome: '',
        tipo: '',
        mq: null,
        posti_letto: null,
        dotazioni: '',
        note: '',
      })
    }
  }, [locale, form])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && locale) {
        await updateMutation.mutateAsync({
          id: locale.id,
          nome: values.nome,
          tipo: values.tipo as Locale['tipo'],
          mq: values.mq || null,
          posti_letto: values.posti_letto || null,
          dotazioni: values.dotazioni || null,
          note: values.note || null,
        })
      } else {
        await createMutation.mutateAsync({
          proprieta_id: proprietaId,
          nome: values.nome,
          tipo: values.tipo as Locale['tipo'],
          mq: values.mq || null,
          posti_letto: values.posti_letto || null,
          dotazioni: values.dotazioni || null,
          note: values.note || null,
        })
      }
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Errore salvataggio locale:', error)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Locale' : 'Nuovo Locale'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Camera Principale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPI_LOCALE.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Superficie (mq)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="posti_letto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posti Letto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dotazioni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dotazioni</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Elenco dotazioni del locale..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Locale'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
