import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { Locale, LocaleInsert, LocaleUpdate } from '@/types/database'
import { proprietaKeys } from './use-proprieta'

export const localiKeys = {
  all: ['locali'] as const,
  lists: () => [...localiKeys.all, 'list'] as const,
  list: (proprietaId: string) => [...localiKeys.lists(), proprietaId] as const,
  details: () => [...localiKeys.all, 'detail'] as const,
  detail: (id: string) => [...localiKeys.details(), id] as const,
}

// Lista locali per proprietà
export function useLocali(proprietaId: string | undefined) {
  return useQuery({
    queryKey: localiKeys.list(proprietaId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locali')
        .select('*')
        .eq('proprieta_id', proprietaId)
        .order('tipo', { ascending: true })

      if (error) throw error
      return data as Locale[]
    },
    enabled: !!proprietaId,
  })
}

// Alias per naming coerente
export function useLocaliByProprieta(proprietaId: string | undefined) {
  return useLocali(proprietaId)
}

// Singolo locale
export function useLocale(id: string | undefined) {
  return useQuery({
    queryKey: localiKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locali')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Locale
    },
    enabled: !!id,
  })
}

// Crea locale
export function useCreateLocale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (locale: Omit<LocaleInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('locali')
        .insert({ ...locale, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as Locale
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: localiKeys.list(data.proprieta_id) })
      queryClient.invalidateQueries({ queryKey: proprietaKeys.detail(data.proprieta_id) })
    },
  })
}

// Aggiorna locale
export function useUpdateLocale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: LocaleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('locali')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Locale
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: localiKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: localiKeys.list(data.proprieta_id) })
    },
  })
}

// Elimina locale
export function useDeleteLocale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, proprietaId }: { id: string; proprietaId: string }) => {
      const { error } = await supabase
        .from('locali')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { proprietaId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: localiKeys.list(data.proprietaId) })
    },
  })
}
