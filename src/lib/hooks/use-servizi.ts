import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type {
  CatalogoServizio,
  CatalogoServizioInsert,
  CatalogoServizioUpdate,
  ServizioVenduto,
  ServizioVendutoInsert,
  ServizioVendutoUpdate
} from '@/types/database'

// ============================================
// CATALOGO SERVIZI
// ============================================

export const catalogoServiziKeys = {
  all: ['catalogo_servizi'] as const,
  lists: () => [...catalogoServiziKeys.all, 'list'] as const,
  details: () => [...catalogoServiziKeys.all, 'detail'] as const,
  detail: (id: string) => [...catalogoServiziKeys.details(), id] as const,
}

// Lista catalogo servizi
export function useCatalogoServizi() {
  return useQuery({
    queryKey: catalogoServiziKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_servizi')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as CatalogoServizio[]
    },
  })
}

// Singolo servizio catalogo
export function useCatalogoServizio(id: string | undefined) {
  return useQuery({
    queryKey: catalogoServiziKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_servizi')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as CatalogoServizio
    },
    enabled: !!id,
  })
}

// Crea servizio catalogo
export function useCreateCatalogoServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (servizio: Omit<CatalogoServizioInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('catalogo_servizi')
        .insert({ ...servizio, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as CatalogoServizio
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogoServiziKeys.lists() })
    },
  })
}

// Aggiorna servizio catalogo
export function useUpdateCatalogoServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CatalogoServizioUpdate }) => {
      const { data: updated, error } = await supabase
        .from('catalogo_servizi')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as CatalogoServizio
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: catalogoServiziKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: catalogoServiziKeys.lists() })
    },
  })
}

// Elimina servizio catalogo
export function useDeleteCatalogoServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalogo_servizi')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogoServiziKeys.all })
    },
  })
}

// ============================================
// SERVIZI VENDUTI
// ============================================

export const serviziVendutiKeys = {
  all: ['servizi_venduti'] as const,
  lists: () => [...serviziVendutiKeys.all, 'list'] as const,
  byContatto: (contattoId: string) => [...serviziVendutiKeys.lists(), 'contatto', contattoId] as const,
  byProprieta: (proprietaId: string) => [...serviziVendutiKeys.lists(), 'proprieta', proprietaId] as const,
  details: () => [...serviziVendutiKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviziVendutiKeys.details(), id] as const,
}

// Lista servizi venduti
export function useServiziVenduti() {
  return useQuery({
    queryKey: serviziVendutiKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servizi_venduti')
        .select(`
          *,
          servizio:servizio_id(nome, tipo),
          contatto:contatto_id(nome, cognome),
          proprieta:proprieta_id(nome)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('data_vendita', { ascending: false })

      if (error) throw error
      return data as ServizioVenduto[]
    },
  })
}

// Servizi venduti per contatto
export function useServiziVendutiByContatto(contattoId: string | undefined) {
  return useQuery({
    queryKey: serviziVendutiKeys.byContatto(contattoId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servizi_venduti')
        .select(`
          *,
          servizio:servizio_id(nome, tipo)
        `)
        .eq('contatto_id', contattoId)
        .order('data_vendita', { ascending: false })

      if (error) throw error
      return data as ServizioVenduto[]
    },
    enabled: !!contattoId,
  })
}

// Servizi venduti per proprietà
export function useServiziVendutiByProprieta(proprietaId: string | undefined) {
  return useQuery({
    queryKey: serviziVendutiKeys.byProprieta(proprietaId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servizi_venduti')
        .select(`
          *,
          servizio:servizio_id(nome, tipo),
          contatto:contatto_id(nome, cognome)
        `)
        .eq('proprieta_id', proprietaId)
        .order('data_vendita', { ascending: false })

      if (error) throw error
      return data as ServizioVenduto[]
    },
    enabled: !!proprietaId,
  })
}

// Singolo servizio venduto
export function useServizioVenduto(id: string | undefined) {
  return useQuery({
    queryKey: serviziVendutiKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servizi_venduti')
        .select(`
          *,
          servizio:servizio_id(*),
          contatto:contatto_id(*),
          proprieta:proprieta_id(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ServizioVenduto
    },
    enabled: !!id,
  })
}

// Crea servizio venduto
export function useCreateServizioVenduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (servizio: Omit<ServizioVendutoInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('servizi_venduti')
        .insert({ ...servizio, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as ServizioVenduto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviziVendutiKeys.all })
    },
  })
}

// Aggiorna servizio venduto
export function useUpdateServizioVenduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ServizioVendutoUpdate }) => {
      const { data: updated, error } = await supabase
        .from('servizi_venduti')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as ServizioVenduto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviziVendutiKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: serviziVendutiKeys.lists() })
    },
  })
}

// Elimina servizio venduto
export function useDeleteServizioVenduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('servizi_venduti')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviziVendutiKeys.all })
    },
  })
}
