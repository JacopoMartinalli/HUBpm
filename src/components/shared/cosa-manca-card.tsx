'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  FileText,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Circle,
  CheckCircle2,
  Clock,
  Upload,
  Star,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  useStatoCompletamentoFase,
  useTaskPerEntita,
  useDocumentiPerEntita,
  type TipoEntita,
  type TaskConStato,
  type DocumentoConStato,
} from '@/lib/hooks'
import { useUpdateTask } from '@/lib/hooks/use-task'
import { cn } from '@/lib/utils'

interface CosaMancaCardProps {
  tipoEntita: TipoEntita
  fase: string
  entityId: string
  contattoId?: string
  onNavigateToDocumenti?: () => void
  onNavigateToTask?: () => void
}

export function CosaMancaCard({
  tipoEntita,
  fase,
  entityId,
  contattoId,
  onNavigateToDocumenti,
  onNavigateToTask,
}: CosaMancaCardProps) {
  const [taskOpen, setTaskOpen] = useState(true)
  const [documentiOpen, setDocumentiOpen] = useState(true)

  const { data: statoCompletamento, isLoading } = useStatoCompletamentoFase(
    tipoEntita,
    fase,
    entityId,
    contattoId
  )

  const { data: tasks } = useTaskPerEntita(tipoEntita, entityId, fase)
  const { data: documenti } = useDocumentiPerEntita(tipoEntita, entityId, contattoId)
  const updateTask = useUpdateTask()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    )
  }

  if (!statoCompletamento) {
    return null
  }

  const {
    documentiTotali,
    documentiCompletati,
    documentiObbligatoriTotali,
    documentiObbligatoriCompletati,
    taskTotali,
    taskCompletati,
    percentualeTotale,
    puoAvanzare,
  } = statoCompletamento

  const taskDaCompletare = tasks?.filter((t) => !t.completato) || []
  const taskCompletatiList = tasks?.filter((t) => t.completato) || []
  const documentiMancanti = documenti?.filter((d) => !d.completato) || []
  const documentiCompletatiList = documenti?.filter((d) => d.completato) || []

  const hasIssues = !puoAvanzare || documentiMancanti.some((d) => d.obbligatorio)

  const handleToggleTask = async (task: TaskConStato) => {
    const nuovoStato = task.completato ? 'da_fare' : 'completato'
    await updateTask.mutateAsync({
      id: task.id,
      stato: nuovoStato,
    })
  }

  const getPrioritaColor = (priorita: string) => {
    switch (priorita) {
      case 'alta':
        return 'text-red-500'
      case 'media':
        return 'text-yellow-500'
      case 'bassa':
        return 'text-green-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatoDocumentoLabel = (stato: string) => {
    switch (stato) {
      case 'mancante':
        return 'Da caricare'
      case 'richiesto':
        return 'Richiesto'
      case 'ricevuto':
        return 'Ricevuto'
      case 'verificato':
        return 'Verificato'
      case 'scaduto':
        return 'Scaduto'
      default:
        return stato
    }
  }

  return (
    <Card className={hasIssues ? 'border-orange-200 bg-orange-50/50' : 'border-green-200 bg-green-50/50'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {hasIssues ? (
            <>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Percorso Guidato - {fase}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Fase Completabile - {fase}</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress generale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Completamento fase</span>
            <span className="font-medium">{percentualeTotale}%</span>
          </div>
          <Progress value={percentualeTotale} className="h-2" />
        </div>

        {/* Sezione Task */}
        <Collapsible open={taskOpen} onOpenChange={setTaskOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="font-medium">Task da completare</span>
                <span className="text-sm text-muted-foreground">
                  ({taskCompletati}/{taskTotali})
                </span>
              </div>
              {taskOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-2">
            {taskTotali === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nessun task per questa fase
              </p>
            ) : (
              <div className="space-y-1">
                {/* Task da completare */}
                {taskDaCompletare.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleTask(task)}
                    isUpdating={updateTask.isPending}
                    getPrioritaColor={getPrioritaColor}
                  />
                ))}

                {/* Task completati (collassati) */}
                {taskCompletatiList.length > 0 && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Completati ({taskCompletatiList.length})
                    </p>
                    {taskCompletatiList.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={() => handleToggleTask(task)}
                        isUpdating={updateTask.isPending}
                        getPrioritaColor={getPrioritaColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Sezione Documenti */}
        <Collapsible open={documentiOpen} onOpenChange={setDocumentiOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Documenti richiesti</span>
                <span className="text-sm text-muted-foreground">
                  ({documentiCompletati}/{documentiTotali})
                </span>
                {documentiObbligatoriTotali > 0 && documentiObbligatoriCompletati < documentiObbligatoriTotali && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    {documentiObbligatoriTotali - documentiObbligatoriCompletati} obb. mancanti
                  </span>
                )}
              </div>
              {documentiOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-2">
            {documentiTotali === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nessun documento richiesto per questa fase
              </p>
            ) : (
              <div className="space-y-1">
                {/* Documenti mancanti */}
                {documentiMancanti.map((doc) => (
                  <DocumentoItem
                    key={doc.id}
                    documento={doc}
                    getStatoLabel={getStatoDocumentoLabel}
                    onNavigate={onNavigateToDocumenti}
                  />
                ))}

                {/* Documenti completati */}
                {documentiCompletatiList.length > 0 && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Completati ({documentiCompletatiList.length})
                    </p>
                    {documentiCompletatiList.map((doc) => (
                      <DocumentoItem
                        key={doc.id}
                        documento={doc}
                        getStatoLabel={getStatoDocumentoLabel}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Messaggio stato */}
        {puoAvanzare ? (
          <div className="p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tutti i requisiti obbligatori sono completati. Puoi avanzare alla fase successiva.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-orange-100 rounded-lg">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Completa i documenti obbligatori per poter avanzare di fase.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente Task Item
function TaskItem({
  task,
  onToggle,
  isUpdating,
  getPrioritaColor,
}: {
  task: TaskConStato
  onToggle: () => void
  isUpdating: boolean
  getPrioritaColor: (priorita: string) => string
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors',
        task.completato && 'opacity-60'
      )}
      onClick={onToggle}
    >
      <button
        className="mt-0.5 flex-shrink-0"
        disabled={isUpdating}
      >
        {task.completato ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', task.completato && 'line-through')}>
          {task.titolo}
        </p>
        {task.descrizione && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {task.descrizione}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {task.priorita && task.priorita !== 'bassa' && (
            <span className={cn('text-xs flex items-center gap-0.5', getPrioritaColor(task.priorita))}>
              <Star className="h-3 w-3" />
              {task.priorita}
            </span>
          )}
          {task.data_scadenza && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {new Date(task.data_scadenza).toLocaleDateString('it-IT')}
            </span>
          )}
          {task.categoria && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {task.categoria}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Documento Item
function DocumentoItem({
  documento,
  getStatoLabel,
  onNavigate,
}: {
  documento: DocumentoConStato
  getStatoLabel: (stato: string) => string
  onNavigate?: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors',
        documento.completato && 'opacity-60'
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        {documento.completato ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : documento.obbligatorio ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-medium', documento.completato && 'line-through')}>
            {documento.nome}
          </p>
          {documento.obbligatorio && !documento.completato && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
              Obbligatorio
            </span>
          )}
        </div>
        {documento.descrizione && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {documento.descrizione}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            documento.completato ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          )}>
            {getStatoLabel(documento.stato)}
          </span>
          {documento.categoria && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {documento.categoria}
            </span>
          )}
          {documento.data_scadenza && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {new Date(documento.data_scadenza).toLocaleDateString('it-IT')}
            </span>
          )}
        </div>
      </div>
      {!documento.completato && onNavigate && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate()
          }}
        >
          <Upload className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
