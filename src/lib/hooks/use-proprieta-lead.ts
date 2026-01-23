import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import { generaTaskPerFase } from '@/lib/services/fase-service'
import type { ProprietaLead, ProprietaLeadInsert, ProprietaLeadUpdate, FaseProprietaLead } from '@/types/database'
import { taskKeys } from './use-task'

export const proprietaLeadKeys = {
  all: ['proprieta_lead'] as const,
  lists: () => [...proprietaLeadKeys.all, 'list'] as const,
  list: (filters?: { contattoId?: string }) => [...proprietaLeadKeys.lists(), filters] as const,
  details: () => [...proprietaLeadKeys.all, 'detail'] as const,
  detail: (id: string) => [...proprietaLeadKeys.details(), id] as const,
}

// Lista tutte le proprietà lead
export function useProprietaLeadList(contattoId?: string) {
  return useQuery({
    queryKey: proprietaLeadKeys.list({ contattoId }),
    queryFn: async () => {
      let query = supabase
        .from('proprieta_lead')
        .select(`
          *,
          contatto:contatti(id, nome, cognome, email, telefono)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false })

      if (contattoId) {
        query = query.eq('contatto_id', contattoId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ProprietaLead[]
    },
  })
}

// Singola proprietà lead
export function useProprietaLead(id: string | undefined) {
  return useQuery({
    queryKey: proprietaLeadKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprieta_lead')
        .select(`
          *,
          contatto:contatti(id, nome, cognome, email, telefono)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ProprietaLead
    },
    enabled: !!id,
  })
}

// Crea proprietà lead
export function useCreateProprietaLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (proprieta: Omit<ProprietaLeadInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('proprieta_lead')
        .insert({ ...proprieta, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error

      // Genera i task della fase iniziale (PL0)
      const proprietaCreata = data as ProprietaLead
      if (proprietaCreata.fase) {
        await generaTaskPerFase('proprieta_lead', proprietaCreata.fase, proprietaCreata.id, proprietaCreata.contatto_id)
      }

      return proprietaCreata
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Aggiorna proprietà lead
export function useUpdateProprietaLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProprietaLeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('proprieta_lead')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProprietaLead
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.lists() })
    },
  })
}

// Elimina proprietà lead
export function useDeleteProprietaLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proprieta_lead')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.all })
    },
  })
}

// Aggiorna fase proprietà lead
export function useUpdateFaseProprietaLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, fase }: { id: string; fase: FaseProprietaLead }) => {
      const { data, error } = await supabase
        .from('proprieta_lead')
        .update({ fase })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProprietaLead
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.lists() })
    },
  })
}

// Conferma proprietà lead (crea proprietà cliente)
export function useConfermaProprietaLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (proprietaLeadId: string) => {
      // Prima otteniamo i dati della proprietà lead
      const { data: proprietaLead, error: fetchError } = await supabase
        .from('proprieta_lead')
        .select('*')
        .eq('id', proprietaLeadId)
        .single()

      if (fetchError) throw fetchError

      // Aggiorna proprietà lead come confermata
      const { error: updateError } = await supabase
        .from('proprieta_lead')
        .update({ esito: 'confermato' })
        .eq('id', proprietaLeadId)

      if (updateError) throw updateError

      // Crea la proprietà cliente
      const { data: newProprieta, error: createError } = await supabase
        .from('proprieta')
        .insert({
          tenant_id: DEFAULT_TENANT_ID,
          contatto_id: proprietaLead.contatto_id,
          proprieta_lead_id: proprietaLeadId,
          nome: proprietaLead.nome,
          indirizzo: proprietaLead.indirizzo,
          citta: proprietaLead.citta,
          cap: proprietaLead.cap,
          provincia: proprietaLead.provincia,
          tipologia: proprietaLead.tipologia || 'appartamento',
          fase: 'P0',
          commissione_percentuale: proprietaLead.commissione_proposta || 30,
        })
        .select()
        .single()

      if (createError) throw createError

      return newProprieta
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.all })
      queryClient.invalidateQueries({ queryKey: ['proprieta'] })
    },
  })
}

// Scarta proprietà lead
export function useScartaProprietaLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('proprieta_lead')
        .update({
          esito: 'scartato',
          motivo_scartato: motivo,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProprietaLead
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proprietaLeadKeys.lists() })
    },
  })
}
