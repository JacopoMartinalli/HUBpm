'use client'

import { useState } from 'react'
import { Handshake, Phone, Mail, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { TIPI_PARTNER, TIPI_TARIFFA } from '@/constants'
import type { PartnerProprieta, Contatto } from '@/types/database'

interface TeamSectionProps {
  proprietaId: string
  partnerAssegnati: PartnerProprieta[] | undefined
  tuttiPartner: Contatto[] | undefined
  createAssegnazione: { mutateAsync: (data: any) => Promise<any>; isPending: boolean }
  deleteAssegnazione: { mutate: (id: string) => void }
}

function AssignPartnerDialog({
  open,
  onOpenChange,
  proprietaId,
  partners,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proprietaId: string
  partners: Contatto[]
  onCreate: { mutateAsync: (data: any) => Promise<any>; isPending: boolean }
}) {
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [ruolo, setRuolo] = useState('')
  const [tariffa, setTariffa] = useState('')
  const [tariffaTipo, setTariffaTipo] = useState('')

  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartnerId(partnerId)
    const partner = partners.find((p) => p.id === partnerId)
    if (partner?.tipo_partner && !ruolo) setRuolo(partner.tipo_partner)
    if (partner?.tariffa_default && !tariffa) setTariffa(String(partner.tariffa_default))
    if (partner?.tariffa_tipo && !tariffaTipo) setTariffaTipo(partner.tariffa_tipo)
  }

  const handleSubmit = async () => {
    if (!selectedPartnerId || !ruolo) return
    try {
      await onCreate.mutateAsync({
        partner_id: selectedPartnerId,
        proprieta_id: proprietaId,
        ruolo,
        priorita: 1,
        attivo: true,
        tariffa: tariffa ? parseFloat(tariffa) : null,
        tariffa_tipo: tariffaTipo || null,
      })
      setSelectedPartnerId('')
      setRuolo('')
      setTariffa('')
      setTariffaTipo('')
      onOpenChange(false)
    } catch (error) {
      console.error('Errore assegnazione:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assegna Collaboratore</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Collaboratore *</Label>
            <Select value={selectedPartnerId} onValueChange={handlePartnerChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona collaboratore" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => {
                  const tipo = TIPI_PARTNER.find((t) => t.id === p.tipo_partner)
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      {tipo?.icon} {p.nome} {p.cognome}
                      {p.azienda ? ` — ${p.azienda}` : ''}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ruolo *</Label>
            <Select value={ruolo} onValueChange={setRuolo}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona ruolo" />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tariffa</Label>
              <Input type="number" step="0.01" value={tariffa} onChange={(e) => setTariffa(e.target.value)} placeholder="0.00" className="mt-1" />
            </div>
            <div>
              <Label>Tipo Tariffa</Label>
              <Select value={tariffaTipo} onValueChange={setTariffaTipo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  {TIPI_TARIFFA.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={!selectedPartnerId || !ruolo || onCreate.isPending}>
              {onCreate.isPending ? 'Assegnazione...' : 'Assegna'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TeamSection({ proprietaId, partnerAssegnati, tuttiPartner, createAssegnazione, deleteAssegnazione }: TeamSectionProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [deleteAssegnazioneId, setDeleteAssegnazioneId] = useState<string | null>(null)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Team Operativo</CardTitle>
            <CardDescription>Collaboratori e fornitori assegnati a questa proprietà</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assegna
          </Button>
        </CardHeader>
        <CardContent>
          {partnerAssegnati && partnerAssegnati.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const byRuolo: Record<string, PartnerProprieta[]> = {}
                for (const a of partnerAssegnati) {
                  const r = a.ruolo || 'altro'
                  if (!byRuolo[r]) byRuolo[r] = []
                  byRuolo[r].push(a)
                }
                return TIPI_PARTNER.map((tipo) => {
                  const assegnazioni = byRuolo[tipo.id]
                  if (!assegnazioni?.length) return null
                  return (
                    <div key={tipo.id} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span>{tipo.icon}</span>
                        <h4 className="text-sm font-semibold text-muted-foreground">{tipo.label}</h4>
                      </div>
                      <div className="space-y-2">
                        {assegnazioni.map((a) => {
                          const partner = a.partner as Contatto | undefined
                          const tariffaTipo = TIPI_TARIFFA.find((t) => t.id === a.tariffa_tipo)
                          return (
                            <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
                                {(partner?.nome?.[0] || '') + (partner?.cognome?.[0] || '')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{partner?.nome} {partner?.cognome}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                  {partner?.telefono && (
                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{partner.telefono}</span>
                                  )}
                                  {partner?.email && (
                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{partner.email}</span>
                                  )}
                                </div>
                              </div>
                              {a.tariffa && (
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(a.tariffa)} {tariffaTipo?.label || ''}
                                </Badge>
                              )}
                              <Badge variant={a.attivo ? 'default' : 'secondary'} className="text-xs">
                                {a.attivo ? 'Attivo' : 'Inattivo'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteAssegnazioneId(a.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Nessun collaboratore assegnato</p>
              <p className="text-xs text-muted-foreground mb-3">Assegna team pulizie, manutentori e altri collaboratori</p>
              <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Assegna Collaboratore
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AssignPartnerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        proprietaId={proprietaId}
        partners={tuttiPartner || []}
        onCreate={createAssegnazione}
      />

      <ConfirmDialog
        open={!!deleteAssegnazioneId}
        onOpenChange={(open) => !open && setDeleteAssegnazioneId(null)}
        title="Rimuovi collaboratore"
        description="Sei sicuro di voler rimuovere questo collaboratore dalla proprietà?"
        confirmText="Rimuovi"
        onConfirm={() => {
          if (deleteAssegnazioneId) {
            deleteAssegnazione.mutate(deleteAssegnazioneId)
            setDeleteAssegnazioneId(null)
          }
        }}
        variant="destructive"
      />
    </>
  )
}
