import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { Task, TaskInsert, TaskUpdate, StatoTask, TemplateTask } from '@/types/database'

export const taskKeys = {
  all: ['task'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: { contattoId?: string; proprietaId?: string; proprietaLeadId?: string; stato?: string }) =>
    [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  templates: ['template_task'] as const,
  templatesByEntita: (tipoEntita: string, fase: string) => [...taskKeys.templates, tipoEntita, fase] as const,
}

// Lista task con filtri
export function useTaskList(filters?: {
  contattoId?: string;
  proprietaId?: string;
  proprietaLeadId?: string;
  stato?: StatoTask;
}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('task')
        .select(`
          *,
          contatto:contatti(id, nome, cognome),
          proprieta:proprieta(id, nome),
          proprieta_lead:proprieta_lead(id, nome)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('data_scadenza', { ascending: true, nullsFirst: false })
        .order('priorita', { ascending: false })

      if (filters?.contattoId) {
        query = query.eq('contatto_id', filters.contattoId)
      }
      if (filters?.proprietaId) {
        query = query.eq('proprieta_id', filters.proprietaId)
      }
      if (filters?.proprietaLeadId) {
        query = query.eq('proprieta_lead_id', filters.proprietaLeadId)
      }
      if (filters?.stato) {
        query = query.eq('stato', filters.stato)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Task[]
    },
  })
}

// Task pendenti (da_fare o in_corso)
export function useTaskPendenti() {
  return useQuery({
    queryKey: [...taskKeys.lists(), 'pendenti'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task')
        .select(`
          *,
          contatto:contatti(id, nome, cognome),
          proprieta:proprieta(id, nome),
          proprieta_lead:proprieta_lead(id, nome)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .in('stato', ['da_fare', 'in_corso'])
        .order('data_scadenza', { ascending: true, nullsFirst: false })
        .order('priorita', { ascending: false })

      if (error) throw error
      return data as Task[]
    },
  })
}

// Singolo task
export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task')
        .select(`
          *,
          contatto:contatti(id, nome, cognome),
          proprieta:proprieta(id, nome),
          proprieta_lead:proprieta_lead(id, nome)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Task
    },
    enabled: !!id,
  })
}

// Crea task
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Omit<TaskInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('task')
        .insert({ ...task, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Aggiorna task
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('task')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      // Invalida anche le query usate da CosaMancaCard
      queryClient.invalidateQueries({ queryKey: ['task-per-entita'] })
      queryClient.invalidateQueries({ queryKey: ['stato-completamento-fase'] })
    },
  })
}

// Completa task
export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('task')
        .update({
          stato: 'completato',
          data_completamento: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      // Invalida anche le query usate da CosaMancaCard
      queryClient.invalidateQueries({ queryKey: ['task-per-entita'] })
      queryClient.invalidateQueries({ queryKey: ['stato-completamento-fase'] })
    },
  })
}

// Elimina task
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// Lista template task per entità e fase
export function useTemplateTask(tipoEntita: string, fase: string) {
  return useQuery({
    queryKey: taskKeys.templatesByEntita(tipoEntita, fase),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_task')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo_entita', tipoEntita)
        .eq('fase', fase)
        .eq('attivo', true)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as TemplateTask[]
    },
  })
}

// Genera task da template
export function useGeneraTaskDaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tipoEntita,
      fase,
      contattoId,
      proprietaId,
      proprietaLeadId,
      dataInizioFase,
    }: {
      tipoEntita: 'lead' | 'proprieta_lead' | 'cliente' | 'proprieta'
      fase: string
      contattoId?: string
      proprietaId?: string
      proprietaLeadId?: string
      dataInizioFase?: Date
    }) => {
      // Ottieni template per questa fase
      const { data: templates, error: templateError } = await supabase
        .from('template_task')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo_entita', tipoEntita)
        .eq('fase', fase)
        .eq('attivo', true)

      if (templateError) throw templateError

      const baseDate = dataInizioFase || new Date()

      // Crea task basati sui template
      const taskToInsert = templates.map((template) => {
        const dataScadenza = template.giorni_deadline
          ? new Date(baseDate.getTime() + template.giorni_deadline * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          : null

        return {
          tenant_id: DEFAULT_TENANT_ID,
          template_id: template.id,
          contatto_id: contattoId || null,
          proprieta_id: proprietaId || null,
          proprieta_lead_id: proprietaLeadId || null,
          titolo: template.titolo,
          descrizione: template.descrizione,
          categoria: template.categoria,
          stato: 'da_fare' as const,
          priorita: 'media' as const,
          data_scadenza: dataScadenza,
        }
      })

      if (taskToInsert.length > 0) {
        const { data, error } = await supabase
          .from('task')
          .insert(taskToInsert)
          .select()

        if (error) throw error
        return data as Task[]
      }

      return []
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}
