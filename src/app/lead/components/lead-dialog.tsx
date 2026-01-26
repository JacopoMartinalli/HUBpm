'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateContatto } from '@/lib/hooks'
import { FONTI_LEAD, TIPI_PERSONA } from '@/constants'
import type { FaseLead, TipoPersona } from '@/types/database'

interface LeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDialog({ open, onOpenChange }: LeadDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    tipo_persona: 'persona_fisica' as TipoPersona,
    fonte_lead: '',
    note: '',
  })

  const createContatto = useCreateContatto()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await createContatto.mutateAsync({
      tipo: 'lead',
      nome: formData.nome,
      cognome: formData.cognome,
      email: formData.email || null,
      telefono: formData.telefono || null,
      tipo_persona: formData.tipo_persona,
      fonte_lead: formData.fonte_lead || null,
      valore_stimato: null,
      note: formData.note || null,
      fase_lead: 'L0' as FaseLead,
      esito_lead: 'in_corso',
      codice_fiscale: null,
      partita_iva: null,
      indirizzo: null,
      citta: null,
      cap: null,
      provincia: null,
      motivo_perso: null,
      motivo_perso_codice: null,
      fase_cliente: null,
      data_conversione: null,
      data_inizio_contratto: null,
      data_fine_contratto: null,
      tipo_partner: null,
      azienda: null,
      specializzazioni: null,
      tariffa_default: null,
      tariffa_tipo: null,
      numero_proprieta: 1, // Default: 1 proprietà per lead
    })

    // Reset form and close
    setFormData({
      nome: '',
      cognome: '',
      email: '',
      telefono: '',
      tipo_persona: 'persona_fisica',
      fonte_lead: '',
      note: '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuovo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognome">Cognome *</Label>
                <Input
                  id="cognome"
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_persona">Tipo</Label>
              <Select
                value={formData.tipo_persona}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_persona: value as TipoPersona })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPI_PERSONA.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonte_lead">Fonte</Label>
              <Select
                value={formData.fonte_lead}
                onValueChange={(value) => setFormData({ ...formData, fonte_lead: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona fonte" />
                </SelectTrigger>
                <SelectContent>
                  {FONTI_LEAD.map((fonte) => (
                    <SelectItem key={fonte.id} value={fonte.id}>
                      {fonte.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createContatto.isPending}>
              {createContatto.isPending ? 'Creazione...' : 'Crea Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
