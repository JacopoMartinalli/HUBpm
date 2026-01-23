import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { Asset, AssetInsert, AssetUpdate } from '@/types/database'
import { proprietaKeys } from './use-proprieta'

export const assetKeys = {
  all: ['asset'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (proprietaId: string, localeId?: string) => [...assetKeys.lists(), proprietaId, localeId] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
}

// Lista asset per proprietà
export function useAsset(proprietaId: string | undefined, localeId?: string) {
  return useQuery({
    queryKey: assetKeys.list(proprietaId!, localeId),
    queryFn: async () => {
      let query = supabase
        .from('asset')
        .select(`
          *,
          locale:locali(id, nome, tipo)
        `)
        .eq('proprieta_id', proprietaId)
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true })

      if (localeId) {
        query = query.eq('locale_id', localeId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Asset[]
    },
    enabled: !!proprietaId,
  })
}

// Alias per naming coerente
export function useAssetByProprieta(proprietaId: string | undefined, localeId?: string) {
  return useAsset(proprietaId, localeId)
}

// Singolo asset
export function useAssetDetail(id: string | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset')
        .select(`
          *,
          locale:locali(id, nome, tipo)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Asset
    },
    enabled: !!id,
  })
}

// Crea asset
export function useCreateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (asset: Omit<AssetInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('asset')
        .insert({ ...asset, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as Asset
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.list(data.proprieta_id) })
      queryClient.invalidateQueries({ queryKey: proprietaKeys.detail(data.proprieta_id) })
    },
  })
}

// Aggiorna asset
export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: AssetUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('asset')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Asset
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: assetKeys.list(data.proprieta_id) })
    },
  })
}

// Elimina asset
export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, proprietaId }: { id: string; proprietaId: string }) => {
      const { error } = await supabase
        .from('asset')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { proprietaId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.list(data.proprietaId) })
    },
  })
}

// Conta asset per categoria
export function useAssetCountByCategoria(proprietaId: string | undefined) {
  return useQuery({
    queryKey: [...assetKeys.list(proprietaId!), 'count-by-categoria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset')
        .select('categoria')
        .eq('proprieta_id', proprietaId)

      if (error) throw error

      const counts: Record<string, number> = {}
      data.forEach((a) => {
        counts[a.categoria] = (counts[a.categoria] || 0) + 1
      })

      return counts
    },
    enabled: !!proprietaId,
  })
}
