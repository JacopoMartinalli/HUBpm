import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type {
  PartnerProprieta,
  PartnerProprietaInsert,
  PartnerProprietaUpdate
} from '@/types/database'

export const partnerProprietaKeys = {
  all: ['partner_proprieta'] as const,
  lists: () => [...partnerProprietaKeys.all, 'list'] as const,
  byPartner: (partnerId: string) => [...partnerProprietaKeys.lists(), 'partner', partnerId] as const,
  byProprieta: (proprietaId: string) => [...partnerProprietaKeys.lists(), 'proprieta', proprietaId] as const,
  details: () => [...partnerProprietaKeys.all, 'detail'] as const,
  detail: (id: string) => [...partnerProprietaKeys.details(), id] as const,
}

// Lista assegnazioni per partner
export function usePartnerProprietaByPartner(partnerId: string | undefined) {
  return useQuery({
    queryKey: partnerProprietaKeys.byPartner(partnerId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_proprieta')
        .select(`
          *,
          proprieta:proprieta_id(id, nome, indirizzo, citta)
        `)
        .eq('partner_id', partnerId)
        .order('priorita', { ascending: true })

      if (error) throw error
      return data as PartnerProprieta[]
    },
    enabled: !!partnerId,
  })
}

// Lista partner per proprietà
export function usePartnerProprietaByProprieta(proprietaId: string | undefined) {
  return useQuery({
    queryKey: partnerProprietaKeys.byProprieta(proprietaId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_proprieta')
        .select(`
          *,
          partner:partner_id(id, nome, cognome, tipo_partner, telefono, email)
        `)
        .eq('proprieta_id', proprietaId)
        .order('priorita', { ascending: true })

      if (error) throw error
      return data as PartnerProprieta[]
    },
    enabled: !!proprietaId,
  })
}

// Singola assegnazione
export function usePartnerProprieta(id: string | undefined) {
  return useQuery({
    queryKey: partnerProprietaKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_proprieta')
        .select(`
          *,
          partner:partner_id(*),
          proprieta:proprieta_id(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as PartnerProprieta
    },
    enabled: !!id,
  })
}

// Crea assegnazione
export function useCreatePartnerProprieta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assegnazione: Omit<PartnerProprietaInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('partner_proprieta')
        .insert({ ...assegnazione, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as PartnerProprieta
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: partnerProprietaKeys.byPartner(data.partner_id) })
      queryClient.invalidateQueries({ queryKey: partnerProprietaKeys.byProprieta(data.proprieta_id) })
    },
  })
}

// Aggiorna assegnazione
export function useUpdatePartnerProprieta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartnerProprietaUpdate }) => {
      const { data: updated, error } = await supabase
        .from('partner_proprieta')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as PartnerProprieta
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: partnerProprietaKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: partnerProprietaKeys.byPartner(data.partner_id) })
      queryClient.invalidateQueries({ queryKey: partnerProprietaKeys.byProprieta(data.proprieta_id) })
    },
  })
}

// Elimina assegnazione
export function useDeletePartnerProprieta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partner_proprieta')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerProprietaKeys.all })
    },
  })
}
