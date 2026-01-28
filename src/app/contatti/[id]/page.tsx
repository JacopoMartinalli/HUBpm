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

export default function ContattoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: contatto, isLoading } = useContatto(id)
  const { mutate: deleteContatto } = useDeleteContatto()
  const { data: assegnazioni } = usePartnerProprietaByPartner(id)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!contatto) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Contatto non trovato</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Torna indietro
        </Button>
      </div>
    )
  }

  const tipoPartnerLabel = TIPI_PARTNER.find(t => t.id === contatto.tipo_partner)?.label || contatto.tipo_partner
  const tariffaTipoLabel = TIPI_TARIFFA.find(t => t.id === contatto.tariffa_tipo)?.label || ''

  const handleDelete = () => {
    deleteContatto(id, {
      onSuccess: () => router.push('/contatti'),
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
            <h1 className="text-2xl font-bold">{contatto.nome} {contatto.cognome}</h1>
            <Badge>{tipoPartnerLabel}</Badge>
          </div>
          {contatto.azienda && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-4 w-4" />
              {contatto.azienda}
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
        {/* Info Contatto */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informazioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{tipoPartnerLabel}</p>
            </div>

            {contatto.azienda && (
              <div>
                <p className="text-sm text-muted-foreground">Azienda</p>
                <p className="font-medium">{contatto.azienda}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              {contatto.telefono && (
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contatto.telefono}
                </p>
              )}
              {contatto.email && (
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {contatto.email}
                </p>
              )}
              {contatto.indirizzo && (
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {contatto.indirizzo}, {contatto.citta}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Tariffa Default</p>
              <p className="font-medium">
                {contatto.tariffa_default
                  ? `${formatCurrency(contatto.tariffa_default)} ${tariffaTipoLabel}`
                  : 'Non specificata'}
              </p>
            </div>

            {contatto.specializzazioni && (
              <div>
                <p className="text-sm text-muted-foreground">Specializzazioni</p>
                <p className="text-sm">{contatto.specializzazioni}</p>
              </div>
            )}

            {contatto.partita_iva && (
              <div>
                <p className="text-sm text-muted-foreground">P.IVA</p>
                <p className="font-mono text-sm">{contatto.partita_iva}</p>
              </div>
            )}

            {contatto.codice_fiscale && (
              <div>
                <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                <p className="font-mono text-sm">{contatto.codice_fiscale}</p>
              </div>
            )}

            {contatto.note && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p className="text-sm whitespace-pre-wrap">{contatto.note}</p>
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
              <CardDescription>Proprietà a cui il contatto è associato</CardDescription>
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
                description: 'Questo contatto non è ancora assegnato a nessuna proprietà.',
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Contatto"
        description={`Sei sicuro di voler eliminare il contatto "${contatto.nome} ${contatto.cognome}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
