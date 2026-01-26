'use client'

import { useState, useEffect } from 'react'
import { Building2, ChevronRight, ChevronLeft, MapPin, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { TIPOLOGIE_PROPRIETA, PROVINCE_ZONA } from '@/constants'
import type { TipologiaProprieta, FaseProprietaLead } from '@/types/database'
import type { Contatto, ProprietaLead } from '@/types/database'
import {
  useUpdateContatto,
  useCreateProprietaLead,
  useCambioFase,
} from '@/lib/hooks'

interface ProprietaFormData {
  nome: string
  indirizzo: string
  citta: string
  cap: string
  provincia: string
  tipologia: TipologiaProprieta
  camere: number
  bagni: number
  posti_letto: number
  usaIndirizzoPrecedente: boolean
}

interface CreaProprietaWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Contatto
  proprietaEsistenti: ProprietaLead[]
  onComplete: () => void
}

export function CreaProprietaWizard({
  open,
  onOpenChange,
  lead,
  proprietaEsistenti,
  onComplete,
}: CreaProprietaWizardProps) {
  const [step, setStep] = useState<'count' | 'details'>('count')
  const [numeroProprieta, setNumeroProprieta] = useState(lead.numero_proprieta || 1)
  const [proprietaForms, setProprietaForms] = useState<ProprietaFormData[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [currentProprietaIndex, setCurrentProprietaIndex] = useState(0)

  const updateContatto = useUpdateContatto()
  const createProprietaLead = useCreateProprietaLead()
  const cambioFase = useCambioFase()

  // Calcola quante proprietà creare
  const numEsistenti = proprietaEsistenti.length
  const numDaCreare = Math.max(0, numeroProprieta - numEsistenti)

  // Reset quando si apre/chiude il dialog
  useEffect(() => {
    if (open) {
      setStep('count')
      setNumeroProprieta(lead.numero_proprieta || 1)
      setProprietaForms([])
      setCurrentProprietaIndex(0)
    }
  }, [open, lead.numero_proprieta])

  // Inizializza i form delle proprietà quando si passa allo step 2
  const initializeProprietaForms = () => {
    const forms: ProprietaFormData[] = []
    for (let i = 0; i < numDaCreare; i++) {
      forms.push({
        nome: `Proprietà ${numEsistenti + i + 1}`,
        indirizzo: '',
        citta: lead.citta || '',
        cap: lead.cap || '',
        provincia: lead.provincia || '',
        tipologia: 'appartamento',
        camere: 1,
        bagni: 1,
        posti_letto: 2,
        usaIndirizzoPrecedente: false,
      })
    }
    setProprietaForms(forms)
    setCurrentProprietaIndex(0)
  }

  // Aggiorna un campo del form corrente
  const updateCurrentForm = (field: keyof ProprietaFormData, value: unknown) => {
    setProprietaForms(prev => {
      const updated = [...prev]
      updated[currentProprietaIndex] = {
        ...updated[currentProprietaIndex],
        [field]: value,
      }
      return updated
    })
  }

  // Applica l'indirizzo della prima proprietà alla corrente
  const applyFirstAddress = (apply: boolean) => {
    if (apply && currentProprietaIndex > 0 && proprietaForms[0]) {
      setProprietaForms(prev => {
        const updated = [...prev]
        updated[currentProprietaIndex] = {
          ...updated[currentProprietaIndex],
          indirizzo: proprietaForms[0].indirizzo,
          citta: proprietaForms[0].citta,
          cap: proprietaForms[0].cap,
          provincia: proprietaForms[0].provincia,
          usaIndirizzoPrecedente: true,
        }
        return updated
      })
    } else {
      updateCurrentForm('usaIndirizzoPrecedente', false)
    }
  }

  // Passa allo step dei dettagli
  const handleGoToDetails = () => {
    if (numDaCreare === 0) {
      // Non ci sono proprietà da creare, avanza direttamente
      handleComplete()
      return
    }
    initializeProprietaForms()
    setStep('details')
  }

  // Naviga tra le proprietà
  const handleNextProprieta = () => {
    if (currentProprietaIndex < numDaCreare - 1) {
      setCurrentProprietaIndex(prev => prev + 1)
    }
  }

  const handlePrevProprieta = () => {
    if (currentProprietaIndex > 0) {
      setCurrentProprietaIndex(prev => prev - 1)
    }
  }

  // Completa il wizard creando le proprietà
  const handleComplete = async () => {
    setIsCreating(true)

    try {
      // 1. Aggiorna numero proprietà sul lead
      await updateContatto.mutateAsync({
        id: lead.id,
        numero_proprieta: numeroProprieta,
      })

      // 2. Crea le proprietà lead con i dati inseriti
      for (const form of proprietaForms) {
        // Nota: camere, bagni, posti_letto verranno aggiunti quando la proprietà
        // viene confermata e diventa una "proprieta" vera e propria
        await createProprietaLead.mutateAsync({
          nome: form.nome,
          indirizzo: form.indirizzo || 'Da definire',
          citta: form.citta || 'Da definire',
          cap: form.cap || null,
          provincia: form.provincia || null,
          tipologia: form.tipologia,
          contatto_id: lead.id,
          fase: 'PL0' as FaseProprietaLead,
          esito: 'in_corso',
          // Salva info extra nelle note per ora
          note: form.camere || form.bagni || form.posti_letto
            ? `Camere: ${form.camere}, Bagni: ${form.bagni}, Posti letto: ${form.posti_letto}`
            : null,
        })
      }

      // 3. Avanza la fase del lead a L1
      await cambioFase.mutateAsync({
        tipoEntita: 'lead',
        faseCorrente: 'L0',
        nuovaFase: 'L1',
        entityId: lead.id,
      })

      onComplete()
      onOpenChange(false)
    } catch (error) {
      console.error('Errore nella creazione proprietà:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const currentForm = proprietaForms[currentProprietaIndex]
  const isLastProprieta = currentProprietaIndex === numDaCreare - 1
  const isFirstProprieta = currentProprietaIndex === 0

  // Verifica se il form corrente è valido
  const isCurrentFormValid = currentForm &&
    currentForm.nome.trim() !== '' &&
    (currentForm.indirizzo.trim() !== '' || currentForm.usaIndirizzoPrecedente) &&
    (currentForm.citta.trim() !== '' || currentForm.usaIndirizzoPrecedente)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'count' ? 'Avanza a L1 - Contattato' : `Configura Proprietà ${currentProprietaIndex + 1} di ${numDaCreare}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'count'
              ? 'Conferma il numero di proprietà del lead'
              : 'Inserisci i dati essenziali per ogni proprietà'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'count' ? (
          // STEP 1: Selezione numero proprietà
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="numProprieta">Quante proprietà ha il lead?</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="numProprieta"
                  type="number"
                  min="1"
                  value={numeroProprieta}
                  onChange={(e) => setNumeroProprieta(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  proprietà da gestire
                </span>
              </div>
            </div>

            {numEsistenti > 0 && (
              <Alert>
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  Hai già {numEsistenti} proprietà create.
                  {numDaCreare > 0 && (
                    <span className="font-medium">
                      {' '}Verranno create {numDaCreare} nuove proprietà.
                    </span>
                  )}
                  {numDaCreare === 0 && (
                    <span> Non verranno create nuove proprietà.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {numEsistenti === 0 && numDaCreare > 0 && (
              <Alert>
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  Verranno create <span className="font-medium">{numDaCreare} proprietà</span>.
                  {numDaCreare > 1 && ' Potrai configurare i dati di ognuna nel prossimo step.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          // STEP 2: Dettagli proprietà
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: numDaCreare }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      idx === currentProprietaIndex
                        ? 'bg-primary'
                        : idx < currentProprietaIndex
                          ? 'bg-green-500'
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Nome proprietà */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Proprietà *</Label>
                <Input
                  id="nome"
                  placeholder="es. Appartamento Centro"
                  value={currentForm?.nome || ''}
                  onChange={(e) => updateCurrentForm('nome', e.target.value)}
                />
              </div>

              <Separator />

              {/* Checkbox usa indirizzo precedente */}
              {currentProprietaIndex > 0 && proprietaForms[0]?.indirizzo && (
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="usaIndirizzo"
                    checked={currentForm?.usaIndirizzoPrecedente || false}
                    onCheckedChange={(checked) => applyFirstAddress(!!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="usaIndirizzo" className="cursor-pointer flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Usa indirizzo della prima proprietà
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {proprietaForms[0].indirizzo}, {proprietaForms[0].citta}
                    </p>
                  </div>
                </div>
              )}

              {/* Indirizzo */}
              <div className="space-y-2">
                <Label htmlFor="indirizzo" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Indirizzo *
                </Label>
                <Input
                  id="indirizzo"
                  placeholder="Via Roma, 1"
                  value={currentForm?.indirizzo || ''}
                  onChange={(e) => updateCurrentForm('indirizzo', e.target.value)}
                  disabled={currentForm?.usaIndirizzoPrecedente}
                />
              </div>

              {/* Città, CAP, Provincia */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="citta">Città *</Label>
                  <Input
                    id="citta"
                    placeholder="Milano"
                    value={currentForm?.citta || ''}
                    onChange={(e) => updateCurrentForm('citta', e.target.value)}
                    disabled={currentForm?.usaIndirizzoPrecedente}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cap">CAP</Label>
                  <Input
                    id="cap"
                    placeholder="20100"
                    value={currentForm?.cap || ''}
                    onChange={(e) => updateCurrentForm('cap', e.target.value)}
                    disabled={currentForm?.usaIndirizzoPrecedente}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Select
                    value={currentForm?.provincia || ''}
                    onValueChange={(value) => updateCurrentForm('provincia', value)}
                    disabled={currentForm?.usaIndirizzoPrecedente}
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

              <Separator />

              {/* Tipologia */}
              <div className="space-y-2">
                <Label htmlFor="tipologia">Tipologia</Label>
                <Select
                  value={currentForm?.tipologia || 'appartamento'}
                  onValueChange={(value) => updateCurrentForm('tipologia', value as TipologiaProprieta)}
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
                  <Label htmlFor="camere">Camere</Label>
                  <Input
                    id="camere"
                    type="number"
                    min="1"
                    value={currentForm?.camere || 1}
                    onChange={(e) => updateCurrentForm('camere', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bagni">Bagni</Label>
                  <Input
                    id="bagni"
                    type="number"
                    min="1"
                    value={currentForm?.bagni || 1}
                    onChange={(e) => updateCurrentForm('bagni', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posti_letto">Posti Letto</Label>
                  <Input
                    id="posti_letto"
                    type="number"
                    min="1"
                    value={currentForm?.posti_letto || 2}
                    onChange={(e) => updateCurrentForm('posti_letto', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Verranno creati automaticamente {currentForm?.camere || 1} camera/e e {currentForm?.bagni || 1} bagno/i.
              </p>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          {step === 'count' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button onClick={handleGoToDetails}>
                {numDaCreare === 0 ? 'Avanza a L1' : 'Configura proprietà'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                {isFirstProprieta ? (
                  <Button variant="outline" onClick={() => setStep('count')}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Indietro
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handlePrevProprieta}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Proprietà {currentProprietaIndex}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {isLastProprieta ? (
                  <Button
                    onClick={handleComplete}
                    disabled={isCreating || !isCurrentFormValid}
                  >
                    {isCreating
                      ? 'Creazione in corso...'
                      : `Crea ${numDaCreare} proprietà e avanza a L1`
                    }
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextProprieta}
                    disabled={!isCurrentFormValid}
                  >
                    Proprietà {currentProprietaIndex + 2}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
