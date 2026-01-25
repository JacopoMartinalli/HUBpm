'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { GripVertical, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreatePacchettoServizio, useUpdatePacchettoServizio } from '@/lib/hooks'
import type { CatalogoServizio, CategoriaServizio, PacchettoServizio } from '@/types/database'
import { TIPI_SERVIZIO } from '@/constants'

interface PacchettoFormData {
  nome: string
  descrizione: string
  categoria_id: string
  prezzo_base: string
  note_interne: string
  attivo: boolean
}

interface PacchettoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacchetto: PacchettoServizio | null
  categorie: CategoriaServizio[]
  servizi: CatalogoServizio[]
  onClose: () => void
}

export function PacchettoDialog({
  open,
  onOpenChange,
  pacchetto,
  categorie,
  servizi,
  onClose,
}: PacchettoDialogProps) {
  const isEditing = pacchetto?.id !== undefined
  const [selectedServizi, setSelectedServizi] = useState<string[]>([])

  const createPacchetto = useCreatePacchettoServizio()
  const updatePacchetto = useUpdatePacchettoServizio()

  const form = useForm<PacchettoFormData>({
    defaultValues: {
      nome: '',
      descrizione: '',
      categoria_id: '',
      prezzo_base: '',
      note_interne: '',
      attivo: true,
    },
  })

  useEffect(() => {
    if (pacchetto) {
      form.reset({
        nome: pacchetto.nome || '',
        descrizione: pacchetto.descrizione || '',
        categoria_id: pacchetto.categoria_id || '',
        prezzo_base: pacchetto.prezzo_base?.toString() || '',
        note_interne: pacchetto.note_interne || '',
        attivo: pacchetto.attivo ?? true,
      })
      // Imposta i servizi selezionati (usa servizio.id dal join)
      const serviziIds = pacchetto.servizi?.map(s => s.servizio?.id).filter((id): id is string => !!id) || []
      setSelectedServizi(serviziIds)
    } else {
      form.reset({
        nome: '',
        descrizione: '',
        categoria_id: '',
        prezzo_base: '',
        note_interne: '',
        attivo: true,
      })
      setSelectedServizi([])
    }
  }, [pacchetto, form])

  const onSubmit = async (data: PacchettoFormData) => {
    const payload = {
      nome: data.nome,
      categoria_id: data.categoria_id || null,
      prezzo_base: data.prezzo_base ? parseFloat(data.prezzo_base) : null,
      descrizione: data.descrizione || null,
      note_interne: data.note_interne || null,
      attivo: data.attivo,
    }

    if (isEditing && pacchetto?.id) {
      await updatePacchetto.mutateAsync({
        id: pacchetto.id,
        data: payload,
        servizi_ids: selectedServizi,
      })
    } else {
      await createPacchetto.mutateAsync({
        ...payload,
        servizi_ids: selectedServizi,
      })
    }

    onClose()
  }

  const toggleServizio = (servizioId: string) => {
    setSelectedServizi(prev =>
      prev.includes(servizioId)
        ? prev.filter(id => id !== servizioId)
        : [...prev, servizioId]
    )
  }

  const removeServizio = (servizioId: string) => {
    setSelectedServizi(prev => prev.filter(id => id !== servizioId))
  }

  // Raggruppa servizi per categoria per la selezione
  const serviziAttivi = servizi.filter(s => s.attivo)
  const serviziPerCategoria = serviziAttivi.reduce((acc, servizio) => {
    const catId = servizio.categoria_id || 'senza-categoria'
    if (!acc[catId]) acc[catId] = []
    acc[catId].push(servizio)
    return acc
  }, {} as Record<string, CatalogoServizio[]>)

  const isLoading = createPacchetto.isPending || updatePacchetto.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Pacchetto' : 'Nuovo Pacchetto'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Colonna sinistra: Dati pacchetto */}
              <div className="space-y-4">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  rules={{ required: 'Nome obbligatorio' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome pacchetto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es: Pacchetto Avvio Completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder="Descrivi brevemente il pacchetto..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Prezzo pacchetto */}
                <FormField
                  control={form.control}
                  name="prezzo_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prezzo pacchetto (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Es: 250.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Lascia vuoto per &quot;Da quotare&quot;
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Note interne */}
                <FormField
                  control={form.control}
                  name="note_interne"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note interne</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Note visibili solo a te..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Attivo */}
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
                        <FormLabel>Pacchetto attivo</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Colonna destra: Selezione servizi */}
              <div className="space-y-4">
                <div>
                  <FormLabel>Servizi inclusi</FormLabel>
                  <FormDescription>
                    Seleziona i servizi da includere nel pacchetto
                  </FormDescription>
                </div>

                {/* Servizi selezionati */}
                {selectedServizi.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Selezionati ({selectedServizi.length})
                    </p>
                    {selectedServizi.map((id) => {
                      const servizio = servizi.find(s => s.id === id)
                      if (!servizio) return null
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between text-sm bg-background rounded p-2"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span>{servizio.nome}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeServizio(id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Lista servizi disponibili */}
                <ScrollArea className="h-[250px] border rounded-lg p-2">
                  <div className="space-y-3">
                    {categorie.map((categoria) => {
                      const serviziCat = serviziPerCategoria[categoria.id]
                      if (!serviziCat?.length) return null

                      return (
                        <div key={categoria.id}>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: categoria.colore }}
                            />
                            {categoria.nome}
                          </p>
                          <div className="space-y-1 ml-4">
                            {serviziCat.map((servizio) => (
                              <label
                                key={servizio.id}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded"
                              >
                                <Checkbox
                                  checked={selectedServizi.includes(servizio.id)}
                                  onCheckedChange={() => toggleServizio(servizio.id)}
                                />
                                <span className="flex-1">{servizio.nome}</span>
                                <Badge variant="outline" className="text-xs">
                                  {TIPI_SERVIZIO.find(t => t.id === servizio.tipo)?.label}
                                </Badge>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* Servizi senza categoria */}
                    {serviziPerCategoria['senza-categoria']?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Senza categoria
                        </p>
                        <div className="space-y-1 ml-4">
                          {serviziPerCategoria['senza-categoria'].map((servizio) => (
                            <label
                              key={servizio.id}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded"
                            >
                              <Checkbox
                                checked={selectedServizi.includes(servizio.id)}
                                onCheckedChange={() => toggleServizio(servizio.id)}
                              />
                              <span className="flex-1">{servizio.nome}</span>
                              <Badge variant="outline" className="text-xs">
                                {TIPI_SERVIZIO.find(t => t.id === servizio.tipo)?.label}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {serviziAttivi.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nessun servizio attivo disponibile.
                        <br />
                        Crea prima alcuni servizi.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading || selectedServizi.length === 0}>
                {isLoading
                  ? 'Salvataggio...'
                  : isEditing
                    ? 'Salva modifiche'
                    : 'Crea pacchetto'
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
