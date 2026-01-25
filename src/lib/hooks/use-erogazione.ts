import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type {
  ErogazionePacchetto,
  ErogazionePacchettoInsert,
  ErogazionePacchettoUpdate,
  ErogazioneServizio,
  ErogazioneServizioUpdate,
  ErogazioneTask,
  ErogazioneTaskInsert,
  ErogazioneTaskUpdate,
  ErogazionePacchettoStato,
  ErogazioneServizioStato,
  ProprietaErogazione,
  PacchettoDipendenza,
  PacchettoDipendenzaInsert,
  TemplateTaskServizio,
  TemplateTaskServizioInsert,
  TemplateTaskServizioUpdate,
  StatoErogazioneTask
} from '@/types/database'

// ============================================
// QUERY KEYS
// ============================================

export const erogazioneKeys = {
  all: ['erogazione'] as const,

  // Pacchetti erogati
  pacchetti: () => [...erogazioneKeys.all, 'pacchetti'] as const,
  pacchettiByProprieta: (proprietaId: string) => [...erogazioneKeys.pacchetti(), 'proprieta', proprietaId] as const,
  pacchetto: (id: string) => [...erogazioneKeys.pacchetti(), 'detail', id] as const,

  // Servizi erogati
  servizi: () => [...erogazioneKeys.all, 'servizi'] as const,
  serviziByPacchetto: (pacchettoId: string) => [...erogazioneKeys.servizi(), 'pacchetto', pacchettoId] as const,
  servizio: (id: string) => [...erogazioneKeys.servizi(), 'detail', id] as const,

  // Task
  task: () => [...erogazioneKeys.all, 'task'] as const,
  taskByServizio: (servizioId: string) => [...erogazioneKeys.task(), 'servizio', servizioId] as const,
  taskDetail: (id: string) => [...erogazioneKeys.task(), 'detail', id] as const,

  // Views
  statoProprietaErogazione: (proprietaId: string) => [...erogazioneKeys.all, 'stato-proprieta', proprietaId] as const,

  // Dipendenze
  dipendenze: () => [...erogazioneKeys.all, 'dipendenze'] as const,
  dipendenzeByPacchetto: (pacchettoId: string) => [...erogazioneKeys.dipendenze(), pacchettoId] as const,

  // Template Task
  templateTask: () => [...erogazioneKeys.all, 'template-task'] as const,
  templateTaskByServizio: (servizioId: string) => [...erogazioneKeys.templateTask(), servizioId] as const,
}

// ============================================
// EROGAZIONE PACCHETTI
// ============================================

// Lista pacchetti erogati per proprietà
export function useErogazionePacchettiByProprieta(proprietaId: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.pacchettiByProprieta(proprietaId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erogazione_pacchetti')
        .select(`
          *,
          pacchetto:pacchetto_id(
            id,
            nome,
            descrizione,
            prezzo_base,
            tipo_esito,
            categoria:categoria_id(id, nome, colore, icona)
          ),
          servizi:erogazione_servizi(
            id,
            servizio_id,
            stato,
            prezzo,
            data_inizio,
            data_completamento,
            servizio:servizio_id(id, nome, tipo),
            task:erogazione_task(id, stato, obbligatoria)
          )
        `)
        .eq('proprieta_id', proprietaId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as ErogazionePacchetto[]
    },
    enabled: !!proprietaId,
  })
}

// Singolo pacchetto erogato con tutti i dettagli
export function useErogazionePacchetto(id: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.pacchetto(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erogazione_pacchetti')
        .select(`
          *,
          pacchetto:pacchetto_id(*),
          proprieta:proprieta_id(id, nome),
          servizi:erogazione_servizi(
            *,
            servizio:servizio_id(*),
            task:erogazione_task(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ErogazionePacchetto
    },
    enabled: !!id,
  })
}

// Crea erogazione pacchetto (i servizi e task vengono creati automaticamente dal trigger)
export function useCreateErogazionePacchetto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (erogazione: Omit<ErogazionePacchettoInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('erogazione_pacchetti')
        .insert({ ...erogazione, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as ErogazionePacchetto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchettiByProprieta(data.proprieta_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.statoProprietaErogazione(data.proprieta_id) })
    },
  })
}

// Aggiorna erogazione pacchetto
export function useUpdateErogazionePacchetto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ErogazionePacchettoUpdate }) => {
      const { data: updated, error } = await supabase
        .from('erogazione_pacchetti')
        .update(data)
        .eq('id', id)
        .select('*, proprieta_id')
        .single()

      if (error) throw error
      return updated as ErogazionePacchetto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchetto(data.id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchettiByProprieta(data.proprieta_id) })
    },
  })
}

// Elimina erogazione pacchetto
export function useDeleteErogazionePacchetto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, proprietaId }: { id: string; proprietaId: string }) => {
      const { error } = await supabase
        .from('erogazione_pacchetti')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, proprietaId }
    },
    onSuccess: ({ proprietaId }) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchettiByProprieta(proprietaId) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.statoProprietaErogazione(proprietaId) })
    },
  })
}

// ============================================
// EROGAZIONE SERVIZI
// ============================================

// Lista servizi erogati per pacchetto
export function useErogazioneServiziByPacchetto(erogazionePacchettoId: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.serviziByPacchetto(erogazionePacchettoId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erogazione_servizi')
        .select(`
          *,
          servizio:servizio_id(*),
          task:erogazione_task(*)
        `)
        .eq('erogazione_pacchetto_id', erogazionePacchettoId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as ErogazioneServizio[]
    },
    enabled: !!erogazionePacchettoId,
  })
}

// Singolo servizio erogato
export function useErogazioneServizio(id: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.servizio(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erogazione_servizi')
        .select(`
          *,
          servizio:servizio_id(*),
          task:erogazione_task(*),
          erogazione_pacchetto:erogazione_pacchetto_id(id, proprieta_id)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ErogazioneServizio
    },
    enabled: !!id,
  })
}

// Aggiorna servizio erogato
export function useUpdateErogazioneServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ErogazioneServizioUpdate }) => {
      const { data: updated, error } = await supabase
        .from('erogazione_servizi')
        .update(data)
        .eq('id', id)
        .select('*, erogazione_pacchetto_id')
        .single()

      if (error) throw error
      return updated as ErogazioneServizio
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.servizio(data.id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.serviziByPacchetto(data.erogazione_pacchetto_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchetti() })
    },
  })
}

// ============================================
// EROGAZIONE TASK
// ============================================

// Lista task per servizio erogato
export function useErogazioneTaskByServizio(erogazioneServizioId: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.taskByServizio(erogazioneServizioId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erogazione_task')
        .select('*')
        .eq('erogazione_servizio_id', erogazioneServizioId)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as ErogazioneTask[]
    },
    enabled: !!erogazioneServizioId,
  })
}

// Singola task
export function useErogazioneTask(id: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.taskDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erogazione_task')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ErogazioneTask
    },
    enabled: !!id,
  })
}

// Crea task manuale
export function useCreateErogazioneTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Omit<ErogazioneTaskInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('erogazione_task')
        .insert({ ...task, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as ErogazioneTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.taskByServizio(data.erogazione_servizio_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.servizi() })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchetti() })
    },
  })
}

// Aggiorna task
export function useUpdateErogazioneTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ErogazioneTaskUpdate }) => {
      const { data: updated, error } = await supabase
        .from('erogazione_task')
        .update(data)
        .eq('id', id)
        .select('*, erogazione_servizio_id')
        .single()

      if (error) throw error
      return updated as ErogazioneTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.taskDetail(data.id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.taskByServizio(data.erogazione_servizio_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.servizi() })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchetti() })
    },
  })
}

// Completa task (shortcut)
export function useCompleteErogazioneTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: updated, error } = await supabase
        .from('erogazione_task')
        .update({
          stato: 'completata' as StatoErogazioneTask,
          data_completamento: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, erogazione_servizio_id')
        .single()

      if (error) throw error
      return updated as ErogazioneTask
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.taskDetail(data.id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.taskByServizio(data.erogazione_servizio_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.servizi() })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchetti() })
    },
  })
}

// Elimina task
export function useDeleteErogazioneTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, erogazioneServizioId }: { id: string; erogazioneServizioId: string }) => {
      const { error } = await supabase
        .from('erogazione_task')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, erogazioneServizioId }
    },
    onSuccess: ({ erogazioneServizioId }) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.taskByServizio(erogazioneServizioId) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.servizi() })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.pacchetti() })
    },
  })
}

// ============================================
// VIEWS - STATO EROGAZIONE
// ============================================

// Riepilogo erogazione per proprietà
export function useProprietaErogazione(proprietaId: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.statoProprietaErogazione(proprietaId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_proprieta_erogazione')
        .select('*')
        .eq('proprieta_id', proprietaId)
        .single()

      if (error) {
        // Se non ci sono dati, restituisci valori di default
        if (error.code === 'PGRST116') {
          return {
            proprieta_id: proprietaId,
            totale_pacchetti: 0,
            pacchetti_completati: 0,
            pacchetti_in_corso: 0,
            pacchetti_bloccati: 0,
            valore_totale: null,
            pronto_per_live: false
          } as ProprietaErogazione
        }
        throw error
      }
      return data as ProprietaErogazione
    },
    enabled: !!proprietaId,
  })
}

// Stato calcolato dei pacchetti erogati
export function useErogazionePacchettiStato(proprietaId: string | undefined) {
  return useQuery({
    queryKey: [...erogazioneKeys.pacchettiByProprieta(proprietaId!), 'stato'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_erogazione_pacchetti_stato')
        .select('*')
        .eq('proprieta_id', proprietaId)

      if (error) throw error
      return data as ErogazionePacchettoStato[]
    },
    enabled: !!proprietaId,
  })
}

// Stato calcolato dei servizi erogati
export function useErogazioneServiziStato(erogazionePacchettoId: string | undefined) {
  return useQuery({
    queryKey: [...erogazioneKeys.serviziByPacchetto(erogazionePacchettoId!), 'stato'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_erogazione_servizi_stato')
        .select('*')
        .eq('erogazione_pacchetto_id', erogazionePacchettoId)

      if (error) throw error
      return data as ErogazioneServizioStato[]
    },
    enabled: !!erogazionePacchettoId,
  })
}

// ============================================
// DIPENDENZE PACCHETTI
// ============================================

// Lista dipendenze per pacchetto
export function usePacchettoDipendenze(pacchettoId: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.dipendenzeByPacchetto(pacchettoId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacchetti_dipendenze')
        .select(`
          *,
          dipende_da:dipende_da_id(id, nome)
        `)
        .eq('pacchetto_id', pacchettoId)

      if (error) throw error
      return data as PacchettoDipendenza[]
    },
    enabled: !!pacchettoId,
  })
}

// Tutte le dipendenze (per catalogo)
export function useAllPacchettiDipendenze() {
  return useQuery({
    queryKey: erogazioneKeys.dipendenze(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacchetti_dipendenze')
        .select(`
          *,
          pacchetto:pacchetto_id(id, nome),
          dipende_da:dipende_da_id(id, nome)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (error) throw error
      return data as PacchettoDipendenza[]
    },
  })
}

// Crea dipendenza
export function useCreatePacchettoDipendenza() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dipendenza: Omit<PacchettoDipendenzaInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('pacchetti_dipendenze')
        .insert({ ...dipendenza, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as PacchettoDipendenza
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.dipendenzeByPacchetto(data.pacchetto_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.dipendenze() })
    },
  })
}

// Elimina dipendenza
export function useDeletePacchettoDipendenza() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, pacchettoId }: { id: string; pacchettoId: string }) => {
      const { error } = await supabase
        .from('pacchetti_dipendenze')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, pacchettoId }
    },
    onSuccess: ({ pacchettoId }) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.dipendenzeByPacchetto(pacchettoId) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.dipendenze() })
    },
  })
}

// ============================================
// TEMPLATE TASK SERVIZIO
// ============================================

// Lista template task per servizio
export function useTemplateTaskServizio(servizioId: string | undefined) {
  return useQuery({
    queryKey: erogazioneKeys.templateTaskByServizio(servizioId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_task_servizio')
        .select('*')
        .eq('servizio_id', servizioId)
        .eq('attiva', true)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as TemplateTaskServizio[]
    },
    enabled: !!servizioId,
  })
}

// Tutti i template task (per admin)
export function useAllTemplateTaskServizio() {
  return useQuery({
    queryKey: erogazioneKeys.templateTask(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_task_servizio')
        .select(`
          *,
          servizio:servizio_id(id, nome)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('servizio_id', { ascending: true })
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as TemplateTaskServizio[]
    },
  })
}

// Crea template task
export function useCreateTemplateTaskServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: Omit<TemplateTaskServizioInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('template_task_servizio')
        .insert({ ...template, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as TemplateTaskServizio
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.templateTaskByServizio(data.servizio_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.templateTask() })
    },
  })
}

// Aggiorna template task
export function useUpdateTemplateTaskServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateTaskServizioUpdate }) => {
      const { data: updated, error } = await supabase
        .from('template_task_servizio')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as TemplateTaskServizio
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.templateTaskByServizio(data.servizio_id) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.templateTask() })
    },
  })
}

// Elimina template task
export function useDeleteTemplateTaskServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, servizioId }: { id: string; servizioId: string }) => {
      const { error } = await supabase
        .from('template_task_servizio')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, servizioId }
    },
    onSuccess: ({ servizioId }) => {
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.templateTaskByServizio(servizioId) })
      queryClient.invalidateQueries({ queryKey: erogazioneKeys.templateTask() })
    },
  })
}
