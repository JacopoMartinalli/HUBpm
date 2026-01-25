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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useCreateCatalogoServizio, useUpdateCatalogoServizio } from '@/lib/hooks'
import type { CatalogoServizio, CategoriaServizio } from '@/types/database'
import { TIPI_SERVIZIO, TIPI_PREZZO } from '@/constants'

interface ServizioFormData {
  nome: string
  descrizione: string
  tipo: 'one_shot' | 'ricorrente'
  categoria_id: string
  prezzo_base: string
  prezzo_tipo: 'fisso' | 'percentuale' | 'da_quotare'
  durata_stimata_ore: string
  durata_stimata_giorni: string
  note_interne: string
  attivo: boolean
  vendibile_singolarmente: boolean
}

interface ServizioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servizio: CatalogoServizio | null
  categorie: CategoriaServizio[]
  onClose: () => void
}

export function ServizioDialog({
  open,
  onOpenChange,
  servizio,
  categorie,
  onClose,
}: ServizioDialogProps) {
  const isEditing = servizio?.id !== undefined

  const createServizio = useCreateCatalogoServizio()
  const updateServizio = useUpdateCatalogoServizio()

  const form = useForm<ServizioFormData>({
    defaultValues: {
      nome: '',
      descrizione: '',
      tipo: 'one_shot',
      categoria_id: '',
      prezzo_base: '',
      prezzo_tipo: 'fisso',
      durata_stimata_ore: '',
      durata_stimata_giorni: '',
      note_interne: '',
      attivo: true,
      vendibile_singolarmente: true,
    },
  })

  useEffect(() => {
    if (servizio) {
      form.reset({
        nome: servizio.nome || '',
        descrizione: servizio.descrizione || '',
        tipo: servizio.tipo || 'one_shot',
        categoria_id: servizio.categoria_id || '',
        prezzo_base: servizio.prezzo_base?.toString() || '',
        prezzo_tipo: servizio.prezzo_tipo || 'fisso',
        durata_stimata_ore: servizio.durata_stimata_ore?.toString() || '',
        durata_stimata_giorni: servizio.durata_stimata_giorni?.toString() || '',
        note_interne: servizio.note_interne || '',
        attivo: servizio.attivo ?? true,
        vendibile_singolarmente: servizio.vendibile_singolarmente ?? true,
      })
    } else {
      form.reset({
        nome: '',
        descrizione: '',
        tipo: 'one_shot',
        categoria_id: '',
        prezzo_base: '',
        prezzo_tipo: 'fisso',
        durata_stimata_ore: '',
        durata_stimata_giorni: '',
        note_interne: '',
        attivo: true,
        vendibile_singolarmente: true,
      })
    }
  }, [servizio, form])

  const onSubmit = async (data: ServizioFormData) => {
    const payload = {
      nome: data.nome,
      tipo: data.tipo,
      attivo: data.attivo,
      vendibile_singolarmente: data.vendibile_singolarmente,
      categoria_id: data.categoria_id || null,
      prezzo_base: data.prezzo_base ? parseFloat(data.prezzo_base) : null,
      prezzo_tipo: data.prezzo_tipo || null,
      durata_stimata_ore: data.durata_stimata_ore ? parseFloat(data.durata_stimata_ore) : null,
      durata_stimata_giorni: data.durata_stimata_giorni ? parseInt(data.durata_stimata_giorni) : null,
      note_interne: data.note_interne || null,
      descrizione: data.descrizione || null,
    }

    if (isEditing && servizio?.id) {
      await updateServizio.mutateAsync({ id: servizio.id, data: payload })
    } else {
      await createServizio.mutateAsync(payload)
    }

    onClose()
  }

  const isLoading = createServizio.isPending || updateServizio.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Servizio' : 'Nuovo Servizio'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome e Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                rules={{ required: 'Nome obbligatorio' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome servizio *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es: Setup completo proprietà" {...field} />
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
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPI_SERVIZIO.map((tipo) => (
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
            </div>

            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} value={field.value || '__none__'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Nessuna categoria</SelectItem>
                      {categorie.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.colore }}
                            />
                            {cat.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="Descrivi brevemente il servizio..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prezzo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prezzo_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo prezzo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo prezzo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPI_PREZZO.map((tipo) => (
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

              <FormField
                control={form.control}
                name="prezzo_base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Prezzo {form.watch('prezzo_tipo') === 'percentuale' ? '(%)' : '(€)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={form.watch('prezzo_tipo') === 'da_quotare' ? 'N/A' : '0.00'}
                        disabled={form.watch('prezzo_tipo') === 'da_quotare'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Durata stimata */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="durata_stimata_ore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durata stimata (ore)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Es: 2.5"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Per servizi brevi</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durata_stimata_giorni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durata stimata (giorni)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Es: 5"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Per servizi lunghi</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Note interne */}
            <FormField
              control={form.control}
              name="note_interne"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note interne</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note visibili solo a te (procedure, costi interni, ecc.)"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Non visibili ai clienti
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opzioni */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <FormField
                control={form.control}
                name="vendibile_singolarmente"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Vendibile singolarmente</FormLabel>
                      <FormDescription>
                        Se disattivato, il servizio può essere venduto solo come parte di un pacchetto
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attivo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Servizio attivo</FormLabel>
                      <FormDescription>
                        I servizi disattivati non sono visibili nel catalogo
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvataggio...' : isEditing ? 'Salva modifiche' : 'Crea servizio'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
