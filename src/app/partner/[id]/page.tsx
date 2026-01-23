'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner, ConfirmDialog, DataTable, Column } from '@/components/shared'
import { useContatto, useDeleteContatto, usePartnerProprietaByPartner } from '@/lib/hooks'
import { formatCurrency } from '@/lib/utils'
import { TIPI_PARTNER, TIPI_TARIFFA } from '@/constants'
import type { PartnerProprieta } from '@/types/database'

export default function PartnerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: partner, isLoading } = useContatto(id)
  const { mutate: deletePartner } = useDeleteContatto()
  const { data: assegnazioni } = usePartnerProprietaByPartner(id)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!partner || partner.tipo !== 'partner') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Partner non trovato</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Torna indietro
        </Button>
      </div>
    )
  }

  const tipoPartnerLabel = TIPI_PARTNER.find(t => t.id === partner.tipo_partner)?.label || partner.tipo_partner
  const tariffaTipoLabel = TIPI_TARIFFA.find(t => t.id === partner.tariffa_tipo)?.label || ''

  const handleDelete = () => {
    deletePartner(id, {
      onSuccess: () => router.push('/partner'),
    })
  }

  const assegnazioniColumns: Column<PartnerProprieta>[] = [
    {
      key: 'proprieta',
      header: 'Proprietà',
      cell: (a) => a.proprieta?.nome || '-',
    },
    {
      key: 'ruolo',
      header: 'Ruolo',
      cell: (a) => a.ruolo,
    },
    {
      key: 'priorita',
      header: 'Priorità',
      cell: (a) => <Badge variant="outline">{a.priorita}</Badge>,
    },
    {
      key: 'tariffa',
      header: 'Tariffa',
      cell: (a) => {
        if (!a.tariffa) return 'Default'
        const tipo = TIPI_TARIFFA.find(t => t.id === a.tariffa_tipo)
        return `${formatCurrency(a.tariffa)} ${tipo?.label || ''}`
      },
    },
    {
      key: 'attivo',
      header: 'Stato',
      cell: (a) => (
        <Badge variant={a.attivo ? 'default' : 'secondary'}>
          {a.attivo ? 'Attivo' : 'Inattivo'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{partner.nome} {partner.cognome}</h1>
            <Badge>{tipoPartnerLabel}</Badge>
          </div>
          {partner.azienda && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-4 w-4" />
              {partner.azienda}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info Partner */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informazioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{tipoPartnerLabel}</p>
            </div>

            {partner.azienda && (
              <div>
                <p className="text-sm text-muted-foreground">Azienda</p>
                <p className="font-medium">{partner.azienda}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              {partner.telefono && (
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {partner.telefono}
                </p>
              )}
              {partner.email && (
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {partner.email}
                </p>
              )}
              {partner.indirizzo && (
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {partner.indirizzo}, {partner.citta}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Tariffa Default</p>
              <p className="font-medium">
                {partner.tariffa_default
                  ? `${formatCurrency(partner.tariffa_default)} ${tariffaTipoLabel}`
                  : 'Non specificata'}
              </p>
            </div>

            {partner.specializzazioni && (
              <div>
                <p className="text-sm text-muted-foreground">Specializzazioni</p>
                <p className="text-sm">{partner.specializzazioni}</p>
              </div>
            )}

            {partner.partita_iva && (
              <div>
                <p className="text-sm text-muted-foreground">P.IVA</p>
                <p className="font-mono text-sm">{partner.partita_iva}</p>
              </div>
            )}

            {partner.codice_fiscale && (
              <div>
                <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                <p className="font-mono text-sm">{partner.codice_fiscale}</p>
              </div>
            )}

            {partner.note && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p className="text-sm whitespace-pre-wrap">{partner.note}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assegnazioni Proprietà */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Proprietà Assegnate</CardTitle>
              <CardDescription>Proprietà a cui il partner è associato</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Assegna
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={assegnazioniColumns}
              data={assegnazioni || []}
              emptyState={{
                title: 'Nessuna assegnazione',
                description: 'Questo partner non è ancora assegnato a nessuna proprietà.',
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Partner"
        description={`Sei sicuro di voler eliminare il partner "${partner.nome} ${partner.cognome}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
