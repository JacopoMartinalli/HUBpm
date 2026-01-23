import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import {
  verificaAvanzamentoFase,
  eseguiCambioFase,
  getFaseSuccessiva,
  getProgressoFase,
  type TipoEntita,
  type VerificaFaseResult,
} from '@/lib/services/fase-service'
import { taskKeys } from './use-task'
import { documentiKeys } from './use-documenti'
import { contattiKeys } from './use-contatti'
import { proprietaKeys } from './use-proprieta'
import { proprietaLeadKeys } from './use-proprieta-lead'

// ============================================
// HOOK: Verifica se può avanzare di fase
// ============================================

export function useVerificaAvanzamentoFase(
  tipoEntita: TipoEntita,
  faseCorrente: string,
  entityId: string | undefined,
  contattoId?: string
) {
  return useQuery({
    queryKey: ['verifica-fase', tipoEntita, faseCorrente, entityId],
    queryFn: async () => {
      if (!entityId) return null
      return verificaAvanzamentoFase(tipoEntita, faseCorrente, entityId, contattoId)
    },
    enabled: !!entityId,
    staleTime: 30000, // Cache per 30 secondi
  })
}

// ============================================
// HOOK: Cambio fase con generazione automatica
// ============================================

export function useCambioFase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tipoEntita,
      faseCorrente,
      nuovaFase,
      entityId,
      contattoId,
      forzaCambio = false,
    }: {
      tipoEntita: TipoEntita
      faseCorrente: string
      nuovaFase: string
      entityId: string
      contattoId?: string
      forzaCambio?: boolean
    }) => {
      // Esegui cambio fase con generazione task/documenti
      const result = await eseguiCambioFase(
        tipoEntita,
        faseCorrente,
        nuovaFase,
        entityId,
        contattoId,
        forzaCambio
      )

      if (!result.success) {
        throw new Error(result.errore || 'Impossibile cambiare fase')
      }

      // Aggiorna l'entità nel database
      await aggiornaFaseEntita(tipoEntita, entityId, nuovaFase)

      return result
    },
    onSuccess: (_, variables) => {
      // Invalida tutte le query correlate
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })

      if (variables.tipoEntita === 'cliente' || variables.tipoEntita === 'lead') {
        queryClient.invalidateQueries({ queryKey: contattiKeys.all })
        if (variables.entityId) {
          queryClient.invalidateQueries({ queryKey: documentiKeys.listByContatto(variables.entityId) })
        }
      }

      if (variables.tipoEntita === 'proprieta') {
        queryClient.invalidateQueries({ queryKey: proprietaKeys.all })
        if (variables.entityId) {
          queryClient.invalidateQueries({ queryKey: documentiKeys.listByProprieta(variables.entityId) })
        }
      }

      if (variables.tipoEntita === 'proprieta_lead') {
        queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.all })
      }

      queryClient.invalidateQueries({
        queryKey: ['verifica-fase', variables.tipoEntita]
      })
    },
  })
}

// ============================================
// HOOK: Stato completamento fase
// ============================================

export interface StatoCompletamentoFase {
  documentiTotali: number
  documentiCompletati: number
  documentiObbligatoriTotali: number
  documentiObbligatoriCompletati: number
  taskTotali: number
  taskCompletati: number
  percentualeDocumenti: number
  percentualeTask: number
  percentualeTotale: number
  puoAvanzare: boolean
}

export function useStatoCompletamentoFase(
  tipoEntita: TipoEntita,
  fase: string,
  entityId: string | undefined,
  contattoId?: string
) {
  return useQuery({
    queryKey: ['stato-completamento-fase', tipoEntita, fase, entityId],
    queryFn: async (): Promise<StatoCompletamentoFase> => {
      if (!entityId) {
        return {
          documentiTotali: 0,
          documentiCompletati: 0,
          documentiObbligatoriTotali: 0,
          documentiObbligatoriCompletati: 0,
          taskTotali: 0,
          taskCompletati: 0,
          percentualeDocumenti: 0,
          percentualeTask: 0,
          percentualeTotale: 0,
          puoAvanzare: false,
        }
      }

      // Query documenti
      let docQuery = supabase
        .from('documenti')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (tipoEntita === 'cliente' || tipoEntita === 'lead') {
        docQuery = docQuery.eq('contatto_id', entityId)
      } else if (tipoEntita === 'proprieta') {
        docQuery = docQuery.eq('proprieta_id', entityId)
      }

      const { data: documenti } = await docQuery

      // Query task con join al template per ottenere la fase
      let taskQuery = supabase
        .from('task')
        .select(`
          *,
          template:template_task(fase)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (tipoEntita === 'lead' || tipoEntita === 'cliente') {
        taskQuery = taskQuery.eq('contatto_id', entityId)
      } else if (tipoEntita === 'proprieta') {
        taskQuery = taskQuery.eq('proprieta_id', entityId)
      } else if (tipoEntita === 'proprieta_lead') {
        taskQuery = taskQuery.eq('proprieta_lead_id', entityId)
      }

      const { data: tasks } = await taskQuery

      // Calcola statistiche documenti
      const docs = documenti || []
      const documentiTotali = docs.length
      const documentiCompletati = docs.filter(
        (d) => d.stato === 'ricevuto' || d.stato === 'verificato'
      ).length
      const documentiObbligatori = docs.filter((d) => d.obbligatorio)
      const documentiObbligatoriTotali = documentiObbligatori.length
      const documentiObbligatoriCompletati = documentiObbligatori.filter(
        (d) => d.stato === 'ricevuto' || d.stato === 'verificato'
      ).length

      // Filtra task per fase corrente
      type TaskWithTemplate = { stato: string; template?: { fase: string } | null }
      const taskList = (tasks || []).filter((t) => {
        const templateFase = (t as TaskWithTemplate).template?.fase
        return templateFase === fase
      })
      const taskTotali = taskList.length
      const taskCompletati = taskList.filter((t) => t.stato === 'completato').length

      // Calcola percentuali
      const percentualeDocumenti = documentiTotali > 0
        ? Math.round((documentiCompletati / documentiTotali) * 100)
        : 100
      const percentualeTask = taskTotali > 0
        ? Math.round((taskCompletati / taskTotali) * 100)
        : 100
      const percentualeTotale = Math.round((percentualeDocumenti + percentualeTask) / 2)

      // Può avanzare se tutti i documenti obbligatori sono completati
      const puoAvanzare = documentiObbligatoriCompletati >= documentiObbligatoriTotali

      return {
        documentiTotali,
        documentiCompletati,
        documentiObbligatoriTotali,
        documentiObbligatoriCompletati,
        taskTotali,
        taskCompletati,
        percentualeDocumenti,
        percentualeTask,
        percentualeTotale,
        puoAvanzare,
      }
    },
    enabled: !!entityId,
    staleTime: 10000,
  })
}

// ============================================
// HOOK: Documenti mancanti per fase
// ============================================

export function useDocumentiMancantiPerFase(
  tipoEntita: 'cliente' | 'proprieta',
  entityId: string | undefined
) {
  return useQuery({
    queryKey: ['documenti-mancanti', tipoEntita, entityId],
    queryFn: async () => {
      if (!entityId) return { mancanti: [], obbligatoriMancanti: [] }

      let query = supabase
        .from('documenti')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .in('stato', ['mancante', 'richiesto'])

      if (tipoEntita === 'cliente') {
        query = query.eq('contatto_id', entityId)
      } else {
        query = query.eq('proprieta_id', entityId)
      }

      const { data, error } = await query.order('obbligatorio', { ascending: false })

      if (error) throw error

      const mancanti = data || []
      const obbligatoriMancanti = mancanti.filter((d) => d.obbligatorio)

      return { mancanti, obbligatoriMancanti }
    },
    enabled: !!entityId,
  })
}

// ============================================
// UTILITÀ
// ============================================

async function aggiornaFaseEntita(
  tipoEntita: TipoEntita,
  entityId: string,
  nuovaFase: string
): Promise<void> {
  let table: string
  let campo: string

  switch (tipoEntita) {
    case 'lead':
      table = 'contatti'
      campo = 'fase_lead'
      break
    case 'cliente':
      table = 'contatti'
      campo = 'fase_cliente'
      break
    case 'proprieta':
      table = 'proprieta'
      campo = 'fase'
      break
    case 'proprieta_lead':
      table = 'proprieta_lead'
      campo = 'fase'
      break
    default:
      throw new Error(`Tipo entità non supportato: ${tipoEntita}`)
  }

  const { error } = await supabase
    .from(table)
    .update({ [campo]: nuovaFase })
    .eq('id', entityId)

  if (error) throw error
}

// ============================================
// HOOK: Task per entità (con dettaglio)
// ============================================

export interface TaskConStato {
  id: string
  titolo: string
  descrizione: string | null
  stato: string
  priorita: string
  categoria: string | null
  data_scadenza: string | null
  completato: boolean
  fase?: string
}

export function useTaskPerEntita(
  tipoEntita: TipoEntita,
  entityId: string | undefined,
  fase?: string
) {
  return useQuery({
    queryKey: ['task-per-entita', tipoEntita, entityId, fase],
    queryFn: async (): Promise<TaskConStato[]> => {
      if (!entityId) return []

      // Query con join al template per ottenere la fase
      let query = supabase
        .from('task')
        .select(`
          *,
          template:template_task(fase)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('priorita', { ascending: false })
        .order('created_at', { ascending: true })

      if (tipoEntita === 'lead' || tipoEntita === 'cliente') {
        query = query.eq('contatto_id', entityId)
      } else if (tipoEntita === 'proprieta') {
        query = query.eq('proprieta_id', entityId)
      } else if (tipoEntita === 'proprieta_lead') {
        query = query.eq('proprieta_lead_id', entityId)
      }

      const { data, error } = await query

      if (error) throw error

      // Filtra per fase se specificata
      type TaskData = typeof data extends (infer T)[] | null ? T : never
      type TaskWithTemplate = TaskData & { template?: { fase: string } | null }

      let filteredData = (data || []) as TaskWithTemplate[]
      if (fase) {
        filteredData = filteredData.filter((t) => {
          // Se il task ha un template, usa la fase del template
          const templateFase = t.template?.fase
          return templateFase === fase
        })
      }

      return filteredData.map((t) => ({
        id: t.id,
        titolo: t.titolo,
        descrizione: t.descrizione,
        stato: t.stato,
        priorita: t.priorita,
        categoria: t.categoria,
        data_scadenza: t.data_scadenza,
        completato: t.stato === 'completato',
        fase: t.template?.fase,
      }))
    },
    enabled: !!entityId,
    staleTime: 10000,
  })
}

// ============================================
// HOOK: Documenti per entità (con dettaglio)
// ============================================

export interface DocumentoConStato {
  id: string
  nome: string
  descrizione: string | null
  categoria: string
  stato: string
  obbligatorio: boolean
  completato: boolean
  data_scadenza: string | null
}

export function useDocumentiPerEntita(
  tipoEntita: TipoEntita,
  entityId: string | undefined,
  contattoId?: string
) {
  return useQuery({
    queryKey: ['documenti-per-entita', tipoEntita, entityId, contattoId],
    queryFn: async (): Promise<DocumentoConStato[]> => {
      if (!entityId) return []

      let query = supabase
        .from('documenti')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('obbligatorio', { ascending: false })
        .order('created_at', { ascending: true })

      if (tipoEntita === 'cliente' || tipoEntita === 'lead') {
        query = query.eq('contatto_id', entityId)
      } else if (tipoEntita === 'proprieta') {
        query = query.eq('proprieta_id', entityId)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((d) => ({
        id: d.id,
        nome: d.nome,
        descrizione: d.descrizione,
        categoria: d.categoria,
        stato: d.stato,
        obbligatorio: d.obbligatorio,
        completato: d.stato === 'ricevuto' || d.stato === 'verificato',
        data_scadenza: d.data_scadenza,
      }))
    },
    enabled: !!entityId,
    staleTime: 10000,
  })
}

// ============================================
// HOOK: Conteggio task per tutte le fasi
// ============================================

export interface TaskCountPerFase {
  [fase: string]: {
    totali: number
    completati: number
  }
}

export function useTaskCountPerFase(
  tipoEntita: TipoEntita,
  entityId: string | undefined
) {
  return useQuery({
    queryKey: ['task-count-per-fase', tipoEntita, entityId],
    queryFn: async (): Promise<TaskCountPerFase> => {
      if (!entityId) return {}

      // Query con join al template per ottenere la fase
      let query = supabase
        .from('task')
        .select(`
          stato,
          template:template_task(fase)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (tipoEntita === 'lead' || tipoEntita === 'cliente') {
        query = query.eq('contatto_id', entityId)
      } else if (tipoEntita === 'proprieta') {
        query = query.eq('proprieta_id', entityId)
      } else if (tipoEntita === 'proprieta_lead') {
        query = query.eq('proprieta_lead_id', entityId)
      }

      const { data, error } = await query

      if (error) throw error

      // Raggruppa per fase
      // Supabase può ritornare template come oggetto singolo o array a seconda della relazione
      type TaskWithTemplate = {
        stato: string
        template?: { fase: string } | { fase: string }[] | null
      }
      const counts: TaskCountPerFase = {}

      for (const task of (data || []) as unknown as TaskWithTemplate[]) {
        // Gestisce sia il caso in cui template sia un oggetto che un array
        const templateData = task.template
        const fase = Array.isArray(templateData)
          ? templateData[0]?.fase
          : templateData?.fase
        if (!fase) continue

        if (!counts[fase]) {
          counts[fase] = { totali: 0, completati: 0 }
        }

        counts[fase].totali++
        if (task.stato === 'completato') {
          counts[fase].completati++
        }
      }

      return counts
    },
    enabled: !!entityId,
    staleTime: 10000,
  })
}

// Re-export types and utilities from fase-service
export { getFaseSuccessiva, getProgressoFase, type TipoEntita }
