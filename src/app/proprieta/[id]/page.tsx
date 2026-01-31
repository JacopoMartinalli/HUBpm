'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Edit, Trash2, Home, FileText, Key, Handshake, Phone, Mail, FolderOpen, BarChart3, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { LoadingSpinner, ConfirmDialog } from '@/components/shared'
import {
  PipelineStepperInline,
  PanoramicaSection,
  CommercialeSection,
  StrutturaSection,
  OperativoSection,
  TeamSection,
  DocumentiSection,
  LiveDashboardSection,
} from '@/components/proprieta'
import { useProprieta, useUpdateProprieta, useDeleteProprieta, useLocaliByProprieta, useAssetByProprieta, useCambioFase, useErogazionePacchettiByProprieta, usePartnerProprietaByProprieta, usePartnerList, useCreatePartnerProprieta, useDeletePartnerProprieta } from '@/lib/hooks'
import { TIPOLOGIE_PROPRIETA } from '@/constants'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Sezioni per proprietà in lavorazione (P0-P3)
const SECTIONS_LAVORAZIONE = [
  { id: 'panoramica', label: 'Panoramica', icon: Building2 },
  { id: 'commerciale', label: 'Commerciale', icon: FileText },
  { id: 'documenti', label: 'Documenti', icon: FolderOpen },
  { id: 'struttura', label: 'Struttura', icon: Home },
  { id: 'operativo', label: 'Operativo', icon: Key },
  { id: 'team', label: 'Team', icon: Handshake },
] as const

// Sezioni per proprietà Live (P4)
const SECTIONS_LIVE = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'panoramica', label: 'Panoramica', icon: Building2 },
  { id: 'documenti', label: 'Documenti', icon: FolderOpen },
  { id: 'struttura', label: 'Struttura', icon: Home },
  { id: 'operativo', label: 'Operativo', icon: Key },
  { id: 'team', label: 'Team', icon: Handshake },
] as const

type SectionIdLavorazione = typeof SECTIONS_LAVORAZIONE[number]['id']
type SectionIdLive = typeof SECTIONS_LIVE[number]['id']
type SectionId = SectionIdLavorazione | SectionIdLive

export default function ProprietaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: proprieta, isLoading } = useProprieta(id)
  const { mutate: updateProprieta } = useUpdateProprieta()
  const { mutate: deleteProprieta } = useDeleteProprieta()
  const { data: locali } = useLocaliByProprieta(id)
  const { data: asset } = useAssetByProprieta(id)
  const cambioFase = useCambioFase()
  const { data: erogazioni } = useErogazionePacchettiByProprieta(id)
  const { data: partnerAssegnati } = usePartnerProprietaByProprieta(id)
  const { data: tuttiPartner } = usePartnerList()
  const createAssegnazione = useCreatePartnerProprieta()
  const deleteAssegnazione = useDeletePartnerProprieta()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('panoramica')
  const [faseError, setFaseError] = useState<string | null>(null)

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!proprieta) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Proprietà non trovata</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Torna indietro
        </Button>
      </div>
    )
  }

  const tipologiaLabel = TIPOLOGIE_PROPRIETA.find(t => t.id === proprieta.tipologia)?.label || proprieta.tipologia

  // Determina se la proprietà è Live (P4 o P5)
  const isLive = proprieta.fase === 'P4' || proprieta.fase === 'P5'
  const SECTIONS = isLive ? SECTIONS_LIVE : SECTIONS_LAVORAZIONE

  // Se cambia da lavorazione a live, resetta la sezione se necessario
  if (isLive && activeSection === 'commerciale') {
    setActiveSection('dashboard')
  }
  if (!isLive && activeSection === 'dashboard') {
    setActiveSection('panoramica')
  }

  const handleDelete = () => {
    deleteProprieta(id, {
      onSuccess: () => router.push('/proprieta'),
    })
  }

  const handleFaseChange = async (newFase: string) => {
    setFaseError(null)
    try {
      await cambioFase.mutateAsync({
        tipoEntita: 'proprieta',
        faseCorrente: proprieta.fase,
        nuovaFase: newFase as typeof proprieta.fase,
        entityId: id,
        contattoId: proprieta.contatto_id,
      })
    } catch (error) {
      if (error instanceof Error) {
        setFaseError(error.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con Pipeline inline */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          {/* Riga principale: Nome + Pipeline */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{proprieta.nome}</h1>
              <Badge variant="outline">{tipologiaLabel}</Badge>
              {isLive && (
                <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Live
                </Badge>
              )}
            </div>

            {/* Pipeline Stepper Inline */}
            <div className="ml-auto">
              <PipelineStepperInline
                faseCorrente={proprieta.fase}
                onCambioFase={handleFaseChange}
                isCambioFaseLoading={cambioFase.isPending}
              />
            </div>
          </div>

          {/* Indirizzo */}
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {proprieta.indirizzo}, {proprieta.citta}
          </p>

          {/* Proprietario */}
          {proprieta.contatto && (
            <div className="flex items-center gap-4 mt-2 text-sm">
              <Link
                href={`/clienti/${proprieta.contatto_id}`}
                className="font-medium text-primary hover:underline"
              >
                {proprieta.contatto.nome} {proprieta.contatto.cognome}
              </Link>
              {proprieta.contatto.telefono && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {proprieta.contatto.telefono}
                </span>
              )}
              {proprieta.contatto.email && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {proprieta.contatto.email}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Errore cambio fase */}
      {faseError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Impossibile cambiare fase</AlertTitle>
          <AlertDescription>{faseError}</AlertDescription>
        </Alert>
      )}

      {/* Mobile section selector */}
      <div className="md:hidden">
        <Select value={activeSection} onValueChange={(v) => setActiveSection(v as SectionId)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTIONS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sidebar + Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="hidden md:flex w-48 flex-shrink-0 flex-col gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-left transition-colors',
                activeSection === s.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Dashboard Live (solo per P4) */}
          {activeSection === 'dashboard' && isLive && (
            <LiveDashboardSection
              proprieta={proprieta}
              prenotazioniMese={0}
              ricavoMese={0}
              occupazioneMese={0}
              recensioniMedia={0}
            />
          )}

          {activeSection === 'panoramica' && (
            <PanoramicaSection
              proprieta={proprieta}
              id={id}
              onUpdateProprieta={updateProprieta}
            />
          )}

          {activeSection === 'commerciale' && !isLive && (
            <CommercialeSection
              proprietaId={id}
              contattoId={proprieta.contatto_id}
              proprietaNome={proprieta.nome}
              faseProprieta={proprieta.fase}
              onPropostaAccettata={() => setFaseError(null)}
            />
          )}

          {activeSection === 'documenti' && (
            <DocumentiSection
              proprietaId={id}
              faseProprieta={proprieta.fase}
            />
          )}

          {activeSection === 'struttura' && (
            <StrutturaSection
              proprietaId={id}
              locali={locali}
              asset={asset}
              proprieta={proprieta}
              onUpdateProprieta={updateProprieta}
            />
          )}

          {activeSection === 'operativo' && (
            <OperativoSection
              proprieta={proprieta}
              id={id}
              onUpdateProprieta={updateProprieta}
            />
          )}

          {activeSection === 'team' && (
            <TeamSection
              proprietaId={id}
              partnerAssegnati={partnerAssegnati}
              tuttiPartner={tuttiPartner}
              createAssegnazione={createAssegnazione}
              deleteAssegnazione={deleteAssegnazione}
            />
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Proprietà"
        description={`Sei sicuro di voler eliminare la proprietà "${proprieta.nome}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
