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
import { useCreateAsset, useUpdateAsset, useLocali } from '@/lib/hooks'
import { CATEGORIE_ASSET, STATI_ASSET } from '@/constants'
import type { Asset } from '@/types/database'
import { useEffect } from 'react'

const formSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio'),
  categoria: z.string().min(1, 'Categoria obbligatoria'),
  quantita: z.number().min(1, 'Quantità minima 1'),
  stato: z.string().min(1, 'Stato obbligatorio'),
  locale_id: z.string().nullable().optional(),
  costo: z.number().nullable().optional(),
  fornitore: z.string().nullable().optional(),
  data_acquisto: z.string().nullable().optional(),
  garanzia_scadenza: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proprietaId: string
  asset?: Asset | null
  onSuccess?: () => void
}

export function AssetDialog({
  open,
  onOpenChange,
  proprietaId,
  asset,
  onSuccess,
}: AssetDialogProps) {
  const createMutation = useCreateAsset()
  const updateMutation = useUpdateAsset()
  const { data: locali } = useLocali(proprietaId)
  const isEditing = !!asset

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      categoria: '',
      quantita: 1,
      stato: 'buono',
      locale_id: null,
      costo: null,
      fornitore: '',
      data_acquisto: '',
      garanzia_scadenza: '',
      note: '',
    },
  })

  useEffect(() => {
    if (asset) {
      form.reset({
        nome: asset.nome,
        categoria: asset.categoria,
        quantita: asset.quantita,
        stato: asset.stato,
        locale_id: asset.locale_id,
        costo: asset.costo,
        fornitore: asset.fornitore || '',
        data_acquisto: asset.data_acquisto || '',
        garanzia_scadenza: asset.garanzia_scadenza || '',
        note: asset.note || '',
      })
    } else {
      form.reset({
        nome: '',
        categoria: '',
        quantita: 1,
        stato: 'buono',
        locale_id: null,
        costo: null,
        fornitore: '',
        data_acquisto: '',
        garanzia_scadenza: '',
        note: '',
      })
    }
  }, [asset, form])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && asset) {
        await updateMutation.mutateAsync({
          id: asset.id,
          nome: values.nome,
          categoria: values.categoria as Asset['categoria'],
          quantita: values.quantita,
          stato: values.stato as Asset['stato'],
          locale_id: values.locale_id || null,
          costo: values.costo || null,
          fornitore: values.fornitore || null,
          data_acquisto: values.data_acquisto || null,
          garanzia_scadenza: values.garanzia_scadenza || null,
          note: values.note || null,
        })
      } else {
        await createMutation.mutateAsync({
          proprieta_id: proprietaId,
          nome: values.nome,
          categoria: values.categoria as Asset['categoria'],
          quantita: values.quantita,
          stato: values.stato as Asset['stato'],
          locale_id: values.locale_id || null,
          costo: values.costo || null,
          fornitore: values.fornitore || null,
          data_acquisto: values.data_acquisto || null,
          garanzia_scadenza: values.garanzia_scadenza || null,
          note: values.note || null,
          attributi: {},
          foto_url: null,
          scontrino_url: null,
          manuale_url: null,
        })
      }
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Errore salvataggio asset:', error)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Asset' : 'Nuovo Asset'}
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
                    <Input placeholder="es. Frigorifero Samsung" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIE_ASSET.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATI_ASSET.map((stato) => (
                          <SelectItem key={stato.id} value={stato.id}>
                            {stato.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantita"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantità *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locale_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locale</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nessun locale" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nessun locale</SelectItem>
                        {locali?.map((locale) => (
                          <SelectItem key={locale.id} value={locale.id}>
                            {locale.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                name="fornitore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornitore</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="es. Amazon"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_acquisto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Acquisto</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                name="garanzia_scadenza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scadenza Garanzia</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive, marca, modello, caratteristiche..."
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
                {isPending ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
