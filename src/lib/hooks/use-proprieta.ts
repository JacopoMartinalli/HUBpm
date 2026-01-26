import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import { generaTaskPerFase } from '@/lib/services/fase-service'
import type { Proprieta, ProprietaInsert, ProprietaUpdate, FaseProprieta } from '@/types/database'
import { taskKeys } from './use-task'

export const proprietaKeys = {
  all: ['proprieta'] as const,
  lists: () => [...proprietaKeys.all, 'list'] as const,
  list: (filters?: { contattoId?: string; fase?: string }) => [...proprietaKeys.lists(), filters] as const,
  details: () => [...proprietaKeys.all, 'detail'] as const,
  detail: (id: string) => [...proprietaKeys.details(), id] as const,
}

// Lista tutte le proprietà
export function useProprietaList(contattoId?: string, fase?: string) {
  return useQuery({
    queryKey: proprietaKeys.list({ contattoId, fase }),
    queryFn: async () => {
      let query = supabase
        .from('proprieta')
        .select(`
          *,
          contatto:contatti(id, nome, cognome, email, telefono)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false })

      if (contattoId) {
        query = query.eq('contatto_id', contattoId)
      }

      if (fase) {
        query = query.eq('fase', fase)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Proprieta[]
    },
  })
}

// Singola proprietà con relazioni
export function useProprieta(id: string | undefined) {
  return useQuery({
    queryKey: proprietaKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprieta')
        .select(`
          *,
          contatto:contatti(id, nome, cognome, email, telefono, fase_cliente)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Proprieta
    },
    enabled: !!id,
  })
}

// Crea proprietà
export function useCreateProprieta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (proprieta: Omit<ProprietaInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('proprieta')
        .insert({ ...proprieta, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error

      // Genera i task e documenti della fase iniziale (P0)
      const proprietaCreata = data as Proprieta
      if (proprietaCreata.fase) {
        await generaTaskPerFase('proprieta', proprietaCreata.fase, proprietaCreata.id, proprietaCreata.contatto_id)
      }

      return proprietaCreata
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proprietaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Aggiorna proprietà
export function useUpdateProprieta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProprietaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('proprieta')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Proprieta
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proprietaKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proprietaKeys.lists() })
    },
  })
}

// Elimina proprietà
export function useDeleteProprieta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proprieta')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proprietaKeys.all })
    },
  })
}

// Aggiorna fase proprietà
export function useUpdateFaseProprieta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, fase }: { id: string; fase: FaseProprieta }) => {
      const { data, error } = await supabase
        .from('proprieta')
        .update({ fase })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Proprieta
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proprietaKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proprietaKeys.lists() })
    },
  })
}

// Alias: Lista proprietà per contatto (lead o cliente)
export function useProprietaByContatto(contattoId: string | undefined) {
  return useProprietaList(contattoId)
}

// Conta proprietà per fase
export function useProprietaCountByFase() {
  return useQuery({
    queryKey: [...proprietaKeys.all, 'count-by-fase'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprieta')
        .select('fase')
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (error) throw error

      const counts: Record<string, number> = {}
      data.forEach((p) => {
        counts[p.fase] = (counts[p.fase] || 0) + 1
      })

      return counts
    },
  })
}
