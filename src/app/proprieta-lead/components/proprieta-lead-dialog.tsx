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
import { useCreateProprietaLead, useLeads } from '@/lib/hooks'
import { TIPOLOGIE_PROPRIETA } from '@/constants'
import type { FaseProprietaLead, TipologiaProprieta } from '@/types/database'

interface ProprietaLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedLeadId?: string
}

export function ProprietaLeadDialog({ open, onOpenChange, preselectedLeadId }: ProprietaLeadDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    tipologia: '' as TipologiaProprieta | '',
    contatto_id: preselectedLeadId || '',
    revenue_stimato_annuo: '',
    investimento_richiesto: '',
    commissione_proposta: '',
    note_sopralluogo: '',
  })

  const createProprietaLead = useCreateProprietaLead()
  const { data: leads } = useLeads()

  // Filtra solo lead attivi (in_corso)
  const leadsAttivi = leads?.filter(l => l.esito_lead === 'in_corso') || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.contatto_id) {
      alert('Seleziona un lead proprietario')
      return
    }

    await createProprietaLead.mutateAsync({
      nome: formData.nome,
      indirizzo: formData.indirizzo,
      citta: formData.citta,
      cap: formData.cap || null,
      provincia: formData.provincia || null,
      tipologia: formData.tipologia || null,
      contatto_id: formData.contatto_id,
      revenue_stimato_annuo: formData.revenue_stimato_annuo ? parseFloat(formData.revenue_stimato_annuo) : null,
      investimento_richiesto: formData.investimento_richiesto ? parseFloat(formData.investimento_richiesto) : null,
      commissione_proposta: formData.commissione_proposta ? parseFloat(formData.commissione_proposta) : null,
      note_sopralluogo: formData.note_sopralluogo || null,
      fase: 'PL0' as FaseProprietaLead,
      esito: 'in_corso',
      data_sopralluogo: null,
      motivo_scartato: null,
      note: null,
      servizi_proposti: null,
      data_proposta: null,
    })

    // Reset form e chiudi
    setFormData({
      nome: '',
      indirizzo: '',
      citta: '',
      cap: '',
      provincia: '',
      tipologia: '',
      contatto_id: preselectedLeadId || '',
      revenue_stimato_annuo: '',
      investimento_richiesto: '',
      commissione_proposta: '',
      note_sopralluogo: '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuova Proprietà Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Proprietà *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Es. Appartamento Centro Storico"
                required
              />
            </div>

            {/* Lead associato */}
            <div className="space-y-2">
              <Label htmlFor="contatto_id">Lead Proprietario</Label>
              <Select
                value={formData.contatto_id}
                onValueChange={(value) => setFormData({ ...formData, contatto_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona lead" />
                </SelectTrigger>
                <SelectContent>
                  {leadsAttivi.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.nome} {lead.cognome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Indirizzo */}
            <div className="space-y-2">
              <Label htmlFor="indirizzo">Indirizzo *</Label>
              <Input
                id="indirizzo"
                value={formData.indirizzo}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                placeholder="Via Roma, 1"
                required
              />
            </div>

            {/* Città, CAP, Provincia */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="citta">Città *</Label>
                <Input
                  id="citta"
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cap">CAP</Label>
                <Input
                  id="cap"
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  maxLength={2}
                  placeholder="RM"
                />
              </div>
            </div>

            {/* Tipologia */}
            <div className="space-y-2">
              <Label htmlFor="tipologia">Tipologia</Label>
              <Select
                value={formData.tipologia}
                onValueChange={(value) => setFormData({ ...formData, tipologia: value as TipologiaProprieta })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipologia" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOLOGIE_PROPRIETA.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Revenue e Investimento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue_stimato_annuo">Revenue Stimato (annuo)</Label>
                <Input
                  id="revenue_stimato_annuo"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.revenue_stimato_annuo}
                  onChange={(e) => setFormData({ ...formData, revenue_stimato_annuo: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investimento_richiesto">Investimento Richiesto</Label>
                <Input
                  id="investimento_richiesto"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.investimento_richiesto}
                  onChange={(e) => setFormData({ ...formData, investimento_richiesto: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Commissione */}
            <div className="space-y-2">
              <Label htmlFor="commissione_proposta">Commissione Proposta (%)</Label>
              <Input
                id="commissione_proposta"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.commissione_proposta}
                onChange={(e) => setFormData({ ...formData, commissione_proposta: e.target.value })}
                placeholder="30"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note_sopralluogo">Note Sopralluogo</Label>
              <Textarea
                id="note_sopralluogo"
                value={formData.note_sopralluogo}
                onChange={(e) => setFormData({ ...formData, note_sopralluogo: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createProprietaLead.isPending}>
              {createProprietaLead.isPending ? 'Creazione...' : 'Crea Proprietà'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
