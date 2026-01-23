'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  AlertTitle,
} from '@/components/ui/alert'
import {
  PageHeader,
  FaseProgress,
  FaseBadge,
  LoadingPage,
  DocumentiList,
  CosaMancaCard,
} from '@/components/shared'
import {
  useContatto,
  useProprietaList,
  useCambioFase,
  useVerificaAvanzamentoFase,
  useTaskCountPerFase,
} from '@/lib/hooks'
import { FASI_CLIENTE } from '@/constants'
import { formatDate, getFullName } from '@/lib/utils'
import type { FaseCliente } from '@/types/database'
import Link from 'next/link'

export default function ClienteDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('info')
  const [faseError, setFaseError] = useState<string | null>(null)

  const { data: cliente, isLoading } = useContatto(id)
  const { data: proprieta } = useProprietaList(id)
  const { data: taskCounts } = useTaskCountPerFase('cliente', id)
  const cambioFase = useCambioFase()
  const { data: verificaFase } = useVerificaAvanzamentoFase(
    'cliente',
    cliente?.fase_cliente || 'C0',
    id
  )

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

  const handleFaseChange = async (nuovaFase: string) => {
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'cliente',
        faseCorrente: cliente.fase_cliente || 'C0',
        nuovaFase: nuovaFase as FaseCliente,
        entityId: cliente.id,
      })
    } catch (error) {
      if (error instanceof Error) {
        setFaseError(error.message)
      }
    }
  }

  return (
    <div>
      <PageHeader
        title={getFullName(cliente.nome, cliente.cognome)}
        description={cliente.email || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/clienti')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </div>
        }
      />

      {/* Fase Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <FaseProgress faseCorrente={cliente.fase_cliente || 'C0'} tipo="cliente" taskCounts={taskCounts} />
            <Select
              value={cliente.fase_cliente || 'C0'}
              onValueChange={handleFaseChange}
              disabled={cambioFase.isPending}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FASI_CLIENTE.map((fase) => (
                  <SelectItem key={fase.id} value={fase.id}>
                    {fase.id} - {fase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {faseError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Impossibile cambiare fase</AlertTitle>
              <AlertDescription>{faseError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cosa Manca Card */}
      <div className="mb-6">
        <CosaMancaCard
          tipoEntita="cliente"
          fase={cliente.fase_cliente || 'C0'}
          entityId={cliente.id}
          onNavigateToDocumenti={() => setActiveTab('documenti')}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          <TabsTrigger value="proprieta">
            Proprietà ({proprieta?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
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
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {cliente.tipo_persona === 'persona_giuridica' ? 'Società' : 'Persona Fisica'}
                  </p>
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

        <TabsContent value="proprieta">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Proprietà del Cliente</CardTitle>
              <Button asChild>
                <Link href={`/proprieta?clienteId=${cliente.id}`}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Aggiungi Proprietà
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {proprieta && proprieta.length > 0 ? (
                <div className="space-y-2">
                  {proprieta.map((prop) => (
                    <Link key={prop.id} href={`/proprieta/${prop.id}`}>
                      <Card className="p-4 hover:bg-muted/50 transition-colors">
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
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nessuna proprietà associata a questo cliente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documenti">
          <DocumentiList
            tipo="cliente"
            entityId={cliente.id}
            fase={cliente.fase_cliente || 'C0'}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
