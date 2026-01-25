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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateProprieta, useClienti, useCreateLocale } from '@/lib/hooks'
import { TIPOLOGIE_PROPRIETA, PROVINCE_ZONA } from '@/constants'
import type { TipologiaProprieta, FaseProprieta, TipoLocale } from '@/types/database'

interface ProprietaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProprietaDialog({ open, onOpenChange }: ProprietaDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    tipologia: 'appartamento' as TipologiaProprieta,
    contatto_id: '',
    posti_letto: '',
    camere: '',
    bagni: '',
  })

  const createProprieta = useCreateProprieta()
  const createLocale = useCreateLocale()
  const { data: clienti, isLoading: isLoadingClienti } = useClienti()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numCamere = formData.camere ? parseInt(formData.camere) : 0
    const numBagni = formData.bagni ? parseInt(formData.bagni) : 0

    // Crea la proprietà
    const nuovaProprieta = await createProprieta.mutateAsync({
      nome: formData.nome,
      indirizzo: formData.indirizzo,
      citta: formData.citta,
      cap: formData.cap || null,
      provincia: formData.provincia || null,
      tipologia: formData.tipologia,
      contatto_id: formData.contatto_id,
      commissione_percentuale: 0, // Default, sarà impostata successivamente
      fase: 'P0' as FaseProprieta,
      proprieta_lead_id: null,
      // Strutturali
      max_ospiti: formData.posti_letto ? parseInt(formData.posti_letto) : null,
      camere: numCamere || null,
      bagni: numBagni || null,
      mq: null,
      // Catastali
      foglio: null,
      mappale: null,
      subalterno: null,
      categoria_catastale: null,
      rendita_catastale: null,
      // Codici STR
      cir: null,
      cin: null,
      scia_protocollo: null,
      scia_data: null,
      alloggiati_web_attivo: false,
      ross1000_attivo: false,
      // Operativo
      codice_portone: null,
      codice_appartamento: null,
      istruzioni_accesso: null,
      wifi_ssid: null,
      wifi_password: null,
      checkin_orario: '15:00',
      checkout_orario: '10:00',
      costo_pulizie: null,
      tassa_soggiorno_persona: null,
      regole_casa: null,
      // Altri campi opzionali
      note: null,
      piano: null,
      channel_manager: null,
      id_channel_manager: null,
      smaltimento_rifiuti: null,
      parcheggio: null,
    })

    // Crea automaticamente i locali (camere + bagni)
    if (nuovaProprieta?.id) {
      const localiDaCreare: Array<{
        tipo: TipoLocale
        nome: string
        posti_letto: number | null
      }> = []

      // Aggiungi le camere
      for (let i = 1; i <= numCamere; i++) {
        localiDaCreare.push({
          tipo: 'camera_matrimoniale' as TipoLocale,
          nome: `Camera ${i}`,
          posti_letto: 2, // Default 2 posti letto per camera
        })
      }

      // Aggiungi i bagni
      for (let i = 1; i <= numBagni; i++) {
        localiDaCreare.push({
          tipo: 'bagno' as TipoLocale,
          nome: `Bagno ${i}`,
          posti_letto: null,
        })
      }

      // Crea tutti i locali
      for (const locale of localiDaCreare) {
        await createLocale.mutateAsync({
          proprieta_id: nuovaProprieta.id,
          tipo: locale.tipo,
          nome: locale.nome,
          mq: null,
          posti_letto: locale.posti_letto,
          dotazioni: null,
          note: null,
        })
      }
    }

    // Reset form and close
    setFormData({
      nome: '',
      indirizzo: '',
      citta: '',
      cap: '',
      provincia: '',
      tipologia: 'appartamento',
      contatto_id: '',
      posti_letto: '',
      camere: '',
      bagni: '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuova Proprietà</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Nome e Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Proprietà *</Label>
                <Input
                  id="nome"
                  placeholder="es. Appartamento Centro Milano"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contatto_id">Cliente *</Label>
                <Select
                  value={formData.contatto_id}
                  onValueChange={(value) => setFormData({ ...formData, contatto_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClienti ? "Caricamento..." : "Seleziona cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clienti?.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} {cliente.cognome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Indirizzo */}
            <div className="space-y-2">
              <Label htmlFor="indirizzo">Indirizzo *</Label>
              <Input
                id="indirizzo"
                placeholder="Via Roma, 1"
                value={formData.indirizzo}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                required
              />
            </div>

            {/* Città, CAP, Provincia */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="citta">Città *</Label>
                <Input
                  id="citta"
                  placeholder="Milano"
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cap">CAP</Label>
                <Input
                  id="cap"
                  placeholder="20100"
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Select
                  value={formData.provincia}
                  onValueChange={(value) => setFormData({ ...formData, provincia: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_ZONA.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipologia */}
            <div className="space-y-2">
              <Label htmlFor="tipologia">Tipologia *</Label>
              <Select
                value={formData.tipologia}
                onValueChange={(value) => setFormData({ ...formData, tipologia: value as TipologiaProprieta })}
              >
                <SelectTrigger>
                  <SelectValue />
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

            {/* Dati strutturali */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="posti_letto">Posti Letto</Label>
                <Input
                  id="posti_letto"
                  type="number"
                  min="1"
                  placeholder="4"
                  value={formData.posti_letto}
                  onChange={(e) => setFormData({ ...formData, posti_letto: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camere">Camere</Label>
                <Input
                  id="camere"
                  type="number"
                  min="0"
                  placeholder="2"
                  value={formData.camere}
                  onChange={(e) => setFormData({ ...formData, camere: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bagni">Bagni</Label>
                <Input
                  id="bagni"
                  type="number"
                  min="0"
                  placeholder="1"
                  value={formData.bagni}
                  onChange={(e) => setFormData({ ...formData, bagni: e.target.value })}
                />
              </div>
            </div>

            {/* Info locali automatici */}
            {(formData.camere || formData.bagni) && (
              <p className="text-xs text-muted-foreground">
                Verranno creati automaticamente {formData.camere || 0} camera/e e {formData.bagni || 0} bagno/i.
                Potrai modificarli successivamente dalla sezione Locali.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createProprieta.isPending || !formData.contatto_id}>
              {createProprieta.isPending ? 'Creazione...' : 'Crea Proprietà'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
