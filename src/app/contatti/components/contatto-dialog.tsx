'use client'

import { useEffect } from 'react'
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
import { useCreateContatto, useUpdateContatto } from '@/lib/hooks'
import { TIPI_PARTNER, TIPI_PERSONA, TIPI_TARIFFA } from '@/constants'
import type { Contatto, TipoPartner, TipoTariffa } from '@/types/database'

const contattoSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio'),
  cognome: z.string().min(1, 'Cognome obbligatorio'),
  tipo_partner: z.string().min(1, 'Tipo obbligatorio'),
  tipo_persona: z.enum(['persona_fisica', 'persona_giuridica']).optional(),
  azienda: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  telefono: z.string().optional(),
  specializzazioni: z.string().optional(),
  tariffa_default: z.number().optional(),
  tariffa_tipo: z.string().optional(),
  note: z.string().optional(),
})

type ContattoFormData = z.infer<typeof contattoSchema>

interface ContattoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contatto?: Contatto | null
  onClose: () => void
}

export function ContattoDialog({
  open,
  onOpenChange,
  contatto,
  onClose,
}: ContattoDialogProps) {
  const createContatto = useCreateContatto()
  const updateContatto = useUpdateContatto()
  const isEditing = !!contatto?.id

  const form = useForm<ContattoFormData>({
    resolver: zodResolver(contattoSchema),
    defaultValues: {
      nome: '',
      cognome: '',
      tipo_partner: 'pulizie',
      tipo_persona: 'persona_fisica',
      azienda: '',
      email: '',
      telefono: '',
      specializzazioni: '',
      tariffa_default: undefined,
      tariffa_tipo: 'a_chiamata',
      note: '',
    },
  })

  useEffect(() => {
    if (contatto) {
      form.reset({
        nome: contatto.nome || '',
        cognome: contatto.cognome || '',
        tipo_partner: contatto.tipo_partner || 'pulizie',
        tipo_persona: contatto.tipo_persona || 'persona_fisica',
        azienda: contatto.azienda || '',
        email: contatto.email || '',
        telefono: contatto.telefono || '',
        specializzazioni: contatto.specializzazioni || '',
        tariffa_default: contatto.tariffa_default || undefined,
        tariffa_tipo: contatto.tariffa_tipo || 'a_chiamata',
        note: contatto.note || '',
      })
    } else {
      form.reset({
        nome: '',
        cognome: '',
        tipo_partner: 'pulizie',
        tipo_persona: 'persona_fisica',
        azienda: '',
        email: '',
        telefono: '',
        specializzazioni: '',
        tariffa_default: undefined,
        tariffa_tipo: 'a_chiamata',
        note: '',
      })
    }
  }, [contatto, form])

  const onSubmit = async (data: ContattoFormData) => {
    try {
      const payload = {
        ...data,
        tipo: 'partner' as const,
        tipo_partner: data.tipo_partner as TipoPartner,
        tariffa_tipo: data.tariffa_tipo as TipoTariffa | undefined,
        email: data.email || undefined,
      }

      if (isEditing && contatto) {
        await updateContatto.mutateAsync({
          id: contatto.id,
          ...payload,
        })
      } else {
        await createContatto.mutateAsync(payload)
      }

      onClose()
    } catch (error) {
      console.error('Errore salvataggio contatto:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Contatto' : 'Nuovo Contatto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo partner */}
          <div>
            <Label>Tipo *</Label>
            <Select
              value={form.watch('tipo_partner')}
              onValueChange={(v) => form.setValue('tipo_partner', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPI_PARTNER.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome e Cognome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...form.register('nome')}
                placeholder="Nome"
                className="mt-1"
              />
              {form.formState.errors.nome && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cognome">Cognome *</Label>
              <Input
                id="cognome"
                {...form.register('cognome')}
                placeholder="Cognome"
                className="mt-1"
              />
              {form.formState.errors.cognome && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.cognome.message}</p>
              )}
            </div>
          </div>

          {/* Azienda */}
          <div>
            <Label htmlFor="azienda">Azienda</Label>
            <Input
              id="azienda"
              {...form.register('azienda')}
              placeholder="Nome azienda (opzionale)"
              className="mt-1"
            />
          </div>

          {/* Contatti */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="telefono">Telefono</Label>
              <Input
                id="telefono"
                {...form.register('telefono')}
                placeholder="+39 ..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                {...form.register('email')}
                placeholder="email@esempio.it"
                className="mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Specializzazioni */}
          <div>
            <Label htmlFor="specializzazioni">Specializzazioni</Label>
            <Input
              id="specializzazioni"
              {...form.register('specializzazioni')}
              placeholder="Es: impianti elettrici, domotica..."
              className="mt-1"
            />
          </div>

          {/* Tariffa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tariffa">Tariffa Default</Label>
              <Input
                id="tariffa"
                type="number"
                step="0.01"
                {...form.register('tariffa_default', { valueAsNumber: true })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tipo Tariffa</Label>
              <Select
                value={form.watch('tariffa_tipo') || ''}
                onValueChange={(v) => form.setValue('tariffa_tipo', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  {TIPI_TARIFFA.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              {...form.register('note')}
              placeholder="Note aggiuntive..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createContatto.isPending || updateContatto.isPending}
            >
              {createContatto.isPending || updateContatto.isPending
                ? 'Salvataggio...'
                : isEditing
                  ? 'Salva Modifiche'
                  : 'Crea Contatto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
