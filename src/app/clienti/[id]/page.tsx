'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Home, CheckCircle2, Clock, Settings, Eye, XCircle, Trash2, FileText, Check, X as XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  PageHeader,
  FaseBadge,
  LoadingPage,
  DocumentiList,
  ConfirmDialog,
} from '@/components/shared'
import {
  useContatto,
  useProprietaList,
  useDeleteContatto,
  useDocumentiByContatto,
} from '@/lib/hooks'
import { FASI_PROPRIETA } from '@/constants'
import { formatDate, getFullName } from '@/lib/utils'
import Link from 'next/link'

function getStatoCliente(proprieta: Array<{ fase: string }> | undefined) {
  if (!proprieta || proprieta.length === 0) return { label: 'Nessuna proprietà', color: 'bg-gray-100 text-gray-600', icon: XCircle }
  const operative = proprieta.filter(p => p.fase === 'P4').length
  const inSetup = proprieta.filter(p => ['P1', 'P2', 'P3'].includes(p.fase)).length
  const inValutazione = proprieta.filter(p => p.fase === 'P0').length

  if (operative > 0) return { label: 'Attivo', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
  if (inSetup > 0) return { label: 'In avviamento', color: 'bg-blue-100 text-blue-700', icon: Settings }
  if (inValutazione > 0) return { label: 'In valutazione', color: 'bg-amber-100 text-amber-700', icon: Eye }
  return { label: 'Cessato', color: 'bg-gray-100 text-gray-500', icon: XCircle }
}

function getFaseInfo(fase: string) {
  return FASI_PROPRIETA.find(f => f.id === fase)
}

export default function ClienteDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('panoramica')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: cliente, isLoading } = useContatto(id)
  const { data: proprieta } = useProprietaList(id)
  const { data: documenti } = useDocumentiByContatto(id)
  const deleteContatto = useDeleteContatto()

  if (isLoading) {
    return <LoadingPage />
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cliente non trovato</p>
      </div>
    )
  }

  const stato = getStatoCliente(proprieta)
  const StatoIcon = stato.icon
  const operative = proprieta?.filter(p => p.fase === 'P4') || []
  const inLavorazione = proprieta?.filter(p => ['P0', 'P1', 'P2', 'P3'].includes(p.fase)) || []
  const cessate = proprieta?.filter(p => p.fase === 'P5') || []

  return (
    <div>
      <PageHeader
        title={getFullName(cliente.nome, cliente.cognome, cliente.ragione_sociale)}
        description={cliente.email || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge className={`${stato.color} border-0 text-sm px-3 py-1`}>
              <StatoIcon className="h-4 w-4 mr-1" />
              {stato.label}
            </Badge>
            <Button variant="outline" onClick={() => router.push('/clienti')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Riepilogo proprietà */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{operative.length}</p>
                <p className="text-sm text-muted-foreground">Operative</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inLavorazione.length}</p>
                <p className="text-sm text-muted-foreground">In lavorazione</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Home className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(proprieta?.length || 0)}</p>
                <p className="text-sm text-muted-foreground">Totale proprietà</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="panoramica">Panoramica</TabsTrigger>
          <TabsTrigger value="info">Anagrafica</TabsTrigger>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
        </TabsList>

        <TabsContent value="panoramica">
          <div className="space-y-6">
            {/* Proprietà in lavorazione - evidenziate */}
            {inLavorazione.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Proprietà in lavorazione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inLavorazione.map((prop) => {
                      const faseInfo = getFaseInfo(prop.fase)
                      return (
                        <Link key={prop.id} href={`/proprieta/${prop.id}`}>
                          <Card className="p-4 hover:bg-muted/50 transition-colors border-l-4 border-l-blue-500">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{prop.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {prop.indirizzo}, {prop.citta}
                                </p>
                              </div>
                              <div className="text-right">
                                <FaseBadge fase={prop.fase} tipo="proprieta" />
                                {faseInfo && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {faseInfo.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Proprietà operative */}
            {operative.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Proprietà operative
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {operative.map((prop) => (
                      <Link key={prop.id} href={`/proprieta/${prop.id}`}>
                        <Card className="p-4 hover:bg-muted/50 transition-colors border-l-4 border-l-green-500">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{prop.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {prop.indirizzo}, {prop.citta}
                              </p>
                            </div>
                            <FaseBadge fase={prop.fase} tipo="proprieta" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Proprietà cessate */}
            {cessate.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-5 w-5" />
                    Proprietà cessate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cessate.map((prop) => (
                      <Link key={prop.id} href={`/proprieta/${prop.id}`}>
                        <Card className="p-4 hover:bg-muted/50 transition-colors opacity-60">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{prop.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {prop.indirizzo}, {prop.citta}
                              </p>
                            </div>
                            <FaseBadge fase={prop.fase} tipo="proprieta" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documenti da raccogliere */}
            {documenti && documenti.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Documenti cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {documenti.map((doc) => {
                      const isOk = doc.stato === 'ricevuto' || doc.stato === 'verificato'
                      return (
                        <div key={doc.id} className="flex items-center gap-2">
                          {isOk ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <XIcon className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${isOk ? 'text-green-700' : 'text-muted-foreground'}`}>
                            {doc.nome}
                          </span>
                          {!isOk && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              {doc.stato === 'richiesto' ? 'Richiesto' : 'Mancante'}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nessuna proprietà */}
            {(!proprieta || proprieta.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nessuna proprietà associata a questo cliente
                  </p>
                  <Button asChild>
                    <Link href={`/proprieta?clienteId=${cliente.id}`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Aggiungi Proprietà
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            {cliente.tipo_persona === 'persona_giuridica' ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dati Società</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ragione Sociale</p>
                      <p className="font-medium">{cliente.ragione_sociale || `${cliente.nome} ${cliente.cognome}`}</p>
                    </div>
                    {cliente.partita_iva && (
                      <div>
                        <p className="text-sm text-muted-foreground">Partita IVA</p>
                        <p className="font-medium">{cliente.partita_iva}</p>
                      </div>
                    )}
                    {cliente.codice_fiscale && (
                      <div>
                        <p className="text-sm text-muted-foreground">Codice Fiscale Società</p>
                        <p className="font-medium">{cliente.codice_fiscale}</p>
                      </div>
                    )}
                    {cliente.indirizzo && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sede Legale</p>
                        <p className="font-medium">
                          {cliente.indirizzo}, {cliente.cap} {cliente.citta} ({cliente.provincia})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Legale Rappresentante</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{cliente.legale_rapp_nome || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cognome</p>
                        <p className="font-medium">{cliente.legale_rapp_cognome || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                      <p className="font-medium">{cliente.legale_rapp_codice_fiscale || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Referente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{cliente.referente_nome || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cognome</p>
                        <p className="font-medium">{cliente.referente_cognome || '-'}</p>
                      </div>
                    </div>
                    {cliente.referente_ruolo && (
                      <div>
                        <p className="text-sm text-muted-foreground">Ruolo</p>
                        <p className="font-medium">{cliente.referente_ruolo}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{cliente.referente_email || cliente.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefono</p>
                      <p className="font-medium">{cliente.referente_telefono || cliente.telefono || '-'}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Anagrafica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{cliente.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cognome</p>
                        <p className="font-medium">{cliente.cognome}</p>
                      </div>
                    </div>
                    {cliente.codice_fiscale && (
                      <div>
                        <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                        <p className="font-medium">{cliente.codice_fiscale}</p>
                      </div>
                    )}
                    {cliente.partita_iva && (
                      <div>
                        <p className="text-sm text-muted-foreground">Partita IVA</p>
                        <p className="font-medium">{cliente.partita_iva}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contatti</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{cliente.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefono</p>
                      <p className="font-medium">{cliente.telefono || '-'}</p>
                    </div>
                    {cliente.indirizzo && (
                      <div>
                        <p className="text-sm text-muted-foreground">Indirizzo</p>
                        <p className="font-medium">
                          {cliente.indirizzo}, {cliente.cap} {cliente.citta} ({cliente.provincia})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contratto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data Conversione da Lead</p>
                  <p className="font-medium">
                    {cliente.data_conversione ? formatDate(cliente.data_conversione) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inizio Contratto</p>
                  <p className="font-medium">
                    {cliente.data_inizio_contratto ? formatDate(cliente.data_inizio_contratto) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fine Contratto</p>
                  <p className="font-medium">
                    {cliente.data_fine_contratto ? formatDate(cliente.data_fine_contratto) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IBAN</p>
                  <p className="font-medium font-mono">{cliente.iban || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{cliente.note || 'Nessuna nota'}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documenti">
          <DocumentiList
            tipo="cliente"
            entityId={cliente.id}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Cliente"
        description="Sei sicuro di voler eliminare questo cliente? L'azione non può essere annullata."
        confirmText="Elimina"
        variant="destructive"
        onConfirm={async () => {
          await deleteContatto.mutateAsync(cliente.id)
          router.push('/clienti')
        }}
        isLoading={deleteContatto.isPending}
      />
    </div>
  )
}
