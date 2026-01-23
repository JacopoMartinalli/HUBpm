'use client'

import { useState } from 'react'
import { Plus, Filter, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, DataTable, Column, KanbanBoard, KanbanColumn, LoadingSpinner } from '@/components/shared'
import { useTaskList, useUpdateTask } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'
import type { Task, StatoTask } from '@/types/database'
import { STATI_TASK, PRIORITA_TASK, CATEGORIE_TASK } from '@/constants'

export default function TaskPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all')
  const [filtroPriorita, setFiltroPriorita] = useState<string>('all')

  const { data: tasks, isLoading } = useTaskList()
  const { mutate: updateTask } = useUpdateTask()

  // Filtra task
  const tasksFiltrati = tasks?.filter(t => {
    if (filtroCategoria !== 'all' && t.categoria !== filtroCategoria) return false
    if (filtroPriorita !== 'all' && t.priorita !== filtroPriorita) return false
    return true
  })

  // Calcola statistiche
  const stats = {
    totali: tasksFiltrati?.length || 0,
    daFare: tasksFiltrati?.filter(t => t.stato === 'da_fare').length || 0,
    inCorso: tasksFiltrati?.filter(t => t.stato === 'in_corso').length || 0,
    completati: tasksFiltrati?.filter(t => t.stato === 'completato').length || 0,
    urgenti: tasksFiltrati?.filter(t => t.priorita === 'urgente' && t.stato !== 'completato').length || 0,
  }

  // Colonne Kanban
  const kanbanColumns: KanbanColumn<Task>[] = STATI_TASK
    .filter(s => s.id !== 'annullato')
    .map(stato => ({
      id: stato.id,
      title: stato.label,
      items: tasksFiltrati?.filter(t => t.stato === stato.id) || [],
    }))

  const handleKanbanDrop = (taskId: string, newStato: string) => {
    updateTask({
      id: taskId,
      stato: newStato as StatoTask,
    })
  }

  const renderKanbanCard = (task: Task) => {
    const priorita = PRIORITA_TASK.find(p => p.id === task.priorita)
    const categoria = CATEGORIE_TASK.find(c => c.id === task.categoria)
    const isOverdue = task.data_scadenza && new Date(task.data_scadenza) < new Date() && task.stato !== 'completato'

    return (
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : ''}`}>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm line-clamp-2">{task.titolo}</p>
              <Badge
                variant={
                  task.priorita === 'urgente' ? 'destructive' :
                  task.priorita === 'alta' ? 'default' :
                  'secondary'
                }
                className="shrink-0 text-xs"
              >
                {priorita?.label}
              </Badge>
            </div>

            {task.descrizione && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.descrizione}</p>
            )}

            <div className="flex items-center justify-between text-xs">
              {categoria && (
                <Badge variant="outline" className="text-xs">
                  {categoria.label}
                </Badge>
              )}
              {task.data_scadenza && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.data_scadenza)}
                </span>
              )}
            </div>

            {task.contatto && (
              <p className="text-xs text-muted-foreground">
                {task.contatto.nome} {task.contatto.cognome}
              </p>
            )}

            {task.proprieta && (
              <p className="text-xs text-muted-foreground">
                📍 {task.proprieta.nome}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const columns: Column<Task>[] = [
    {
      key: 'titolo',
      header: 'Task',
      cell: (t) => (
        <div>
          <p className="font-medium">{t.titolo}</p>
          {t.descrizione && <p className="text-xs text-muted-foreground line-clamp-1">{t.descrizione}</p>}
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      cell: (t) => {
        const categoria = CATEGORIE_TASK.find(c => c.id === t.categoria)
        return categoria ? <Badge variant="outline">{categoria.label}</Badge> : '-'
      },
    },
    {
      key: 'priorita',
      header: 'Priorità',
      cell: (t) => {
        const priorita = PRIORITA_TASK.find(p => p.id === t.priorita)
        return (
          <Badge
            variant={
              t.priorita === 'urgente' ? 'destructive' :
              t.priorita === 'alta' ? 'default' :
              'secondary'
            }
          >
            {priorita?.label}
          </Badge>
        )
      },
    },
    {
      key: 'stato',
      header: 'Stato',
      cell: (t) => {
        const stato = STATI_TASK.find(s => s.id === t.stato)
        return <Badge variant="outline">{stato?.label}</Badge>
      },
    },
    {
      key: 'scadenza',
      header: 'Scadenza',
      cell: (t) => {
        if (!t.data_scadenza) return '-'
        const isOverdue = new Date(t.data_scadenza) < new Date() && t.stato !== 'completato'
        return (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {formatDate(t.data_scadenza)}
          </span>
        )
      },
    },
    {
      key: 'riferimento',
      header: 'Riferimento',
      cell: (t) => {
        if (t.contatto) return `${t.contatto.nome} ${t.contatto.cognome}`
        if (t.proprieta) return t.proprieta.nome
        return '-'
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task"
        description="Gestisci le attività da completare"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Task
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totali}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Da Fare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.daFare}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Corso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.inCorso}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Completati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completati}</p>
          </CardContent>
        </Card>
        <Card className={stats.urgenti > 0 ? 'border-red-300' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Urgenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stats.urgenti > 0 ? 'text-red-500' : ''}`}>
              {stats.urgenti}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtri e View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtri:</span>
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {CATEGORIE_TASK.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroPriorita} onValueChange={setFiltroPriorita}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priorità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            {PRIORITA_TASK.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'table')}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="table">Tabella</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          onDrop={handleKanbanDrop}
          renderCard={renderKanbanCard}
          emptyMessage="Nessun task in questa colonna"
        />
      ) : (
        <DataTable
          columns={columns}
          data={tasksFiltrati || []}
          emptyState={{
            title: 'Nessun task',
            description: 'Crea un nuovo task per iniziare.',
          }}
        />
      )}
    </div>
  )
}
