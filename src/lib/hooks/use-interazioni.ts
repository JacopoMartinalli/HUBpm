import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { Interazione, TipoInterazione, EsitoInterazione } from '@/types/database'

export const interazioniKeys = {
  all: ['interazioni'] as const,
  byContatto: (contattoId: string) => [...interazioniKeys.all, contattoId] as const,
}

export function useInterazioni(contattoId: string) {
  return useQuery({
    queryKey: interazioniKeys.byContatto(contattoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interazioni')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('contatto_id', contattoId)
        .order('data', { ascending: false })
      if (error) throw error
      return data as Interazione[]
    },
    enabled: !!contattoId,
  })
}

export function useCreateInterazione() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      contatto_id: string
      tipo: TipoInterazione
      note?: string
      esito?: EsitoInterazione
      data?: string
    }) => {
      const { data, error } = await supabase
        .from('interazioni')
        .insert({
          tenant_id: DEFAULT_TENANT_ID,
          contatto_id: params.contatto_id,
          tipo: params.tipo,
          note: params.note || null,
          esito: params.esito || null,
          data: params.data || new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: interazioniKeys.byContatto(variables.contatto_id) })
    },
  })
}
