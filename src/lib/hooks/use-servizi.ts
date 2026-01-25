import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type {
  CatalogoServizio,
  CatalogoServizioInsert,
  CatalogoServizioUpdate,
  ServizioVenduto,
  ServizioVendutoInsert,
  ServizioVendutoUpdate,
  CategoriaServizio,
  CategoriaServizioInsert,
  CategoriaServizioUpdate,
  PacchettoServizio,
  PacchettoServizioInsert,
  PacchettoServizioUpdate,
  PacchettoServizioItemInsert
} from '@/types/database'

// ============================================
// CATEGORIE SERVIZI
// ============================================

export const categorieServiziKeys = {
  all: ['categorie_servizi'] as const,
  lists: () => [...categorieServiziKeys.all, 'list'] as const,
  details: () => [...categorieServiziKeys.all, 'detail'] as const,
  detail: (id: string) => [...categorieServiziKeys.details(), id] as const,
}

// Lista categorie servizi
export function useCategorieServizi() {
  return useQuery({
    queryKey: categorieServiziKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorie_servizi')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('attiva', true)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as CategoriaServizio[]
    },
  })
}

// Tutte le categorie (anche inattive)
export function useAllCategorieServizi() {
  return useQuery({
    queryKey: [...categorieServiziKeys.lists(), 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorie_servizi')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as CategoriaServizio[]
    },
  })
}

// Singola categoria
export function useCategoriaServizio(id: string | undefined) {
  return useQuery({
    queryKey: categorieServiziKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorie_servizi')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as CategoriaServizio
    },
    enabled: !!id,
  })
}

// Crea categoria
export function useCreateCategoriaServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoria: Omit<CategoriaServizioInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('categorie_servizi')
        .insert({ ...categoria, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as CategoriaServizio
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categorieServiziKeys.all })
    },
  })
}

// Aggiorna categoria
export function useUpdateCategoriaServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoriaServizioUpdate }) => {
      const { data: updated, error } = await supabase
        .from('categorie_servizi')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as CategoriaServizio
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categorieServiziKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: categorieServiziKeys.lists() })
    },
  })
}

// Elimina categoria
export function useDeleteCategoriaServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorie_servizi')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categorieServiziKeys.all })
    },
  })
}

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
        .select(`
          *,
          categoria:categoria_id(id, nome, colore, icona)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as CatalogoServizio[]
    },
  })
}

// Lista catalogo servizi per categoria
export function useCatalogoServiziByCategoria(categoriaId: string | undefined) {
  return useQuery({
    queryKey: [...catalogoServiziKeys.lists(), 'categoria', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_servizi')
        .select(`
          *,
          categoria:categoria_id(id, nome, colore, icona)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('categoria_id', categoriaId)
        .eq('attivo', true)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as CatalogoServizio[]
    },
    enabled: !!categoriaId,
  })
}

// Lista servizi attivi
export function useCatalogoServiziAttivi() {
  return useQuery({
    queryKey: [...catalogoServiziKeys.lists(), 'attivi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_servizi')
        .select(`
          *,
          categoria:categoria_id(id, nome, colore, icona)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('attivo', true)
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

// ============================================
// PACCHETTI SERVIZI
// ============================================

export const pacchettiServiziKeys = {
  all: ['pacchetti_servizi'] as const,
  lists: () => [...pacchettiServiziKeys.all, 'list'] as const,
  details: () => [...pacchettiServiziKeys.all, 'detail'] as const,
  detail: (id: string) => [...pacchettiServiziKeys.details(), id] as const,
}

// Lista pacchetti servizi
export function usePacchettiServizi() {
  return useQuery({
    queryKey: pacchettiServiziKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacchetti_servizi')
        .select(`
          *,
          categoria:categoria_id(id, nome, colore, icona),
          servizi:pacchetti_servizi_items(
            id,
            ordine,
            note,
            servizio:servizio_id(id, nome, descrizione, tipo, prezzo_base, prezzo_tipo)
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as PacchettoServizio[]
    },
  })
}

// Lista pacchetti attivi
export function usePacchettiServiziAttivi() {
  return useQuery({
    queryKey: [...pacchettiServiziKeys.lists(), 'attivi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacchetti_servizi')
        .select(`
          *,
          categoria:categoria_id(id, nome, colore, icona),
          servizi:pacchetti_servizi_items(
            id,
            ordine,
            note,
            servizio:servizio_id(id, nome, descrizione, tipo, prezzo_base, prezzo_tipo)
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('attivo', true)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as PacchettoServizio[]
    },
  })
}

// Singolo pacchetto
export function usePacchettoServizio(id: string | undefined) {
  return useQuery({
    queryKey: pacchettiServiziKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacchetti_servizi')
        .select(`
          *,
          categoria:categoria_id(id, nome, colore, icona),
          servizi:pacchetti_servizi_items(
            id,
            ordine,
            note,
            servizio:servizio_id(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as PacchettoServizio
    },
    enabled: !!id,
  })
}

// Crea pacchetto
export function useCreatePacchettoServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pacchetto: Omit<PacchettoServizioInsert, 'tenant_id'> & { servizi_ids?: string[] }) => {
      const { servizi_ids, ...pacchettoData } = pacchetto

      // Crea il pacchetto
      const { data, error } = await supabase
        .from('pacchetti_servizi')
        .insert({ ...pacchettoData, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error

      // Se ci sono servizi, li associamo
      if (servizi_ids && servizi_ids.length > 0) {
        const items = servizi_ids.map((servizio_id, index) => ({
          tenant_id: DEFAULT_TENANT_ID,
          pacchetto_id: data.id,
          servizio_id,
          ordine: index
        }))

        const { error: itemsError } = await supabase
          .from('pacchetti_servizi_items')
          .insert(items)

        if (itemsError) throw itemsError
      }

      return data as PacchettoServizio
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pacchettiServiziKeys.all })
    },
  })
}

// Aggiorna pacchetto
export function useUpdatePacchettoServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data, servizi_ids }: { id: string; data: PacchettoServizioUpdate; servizi_ids?: string[] }) => {
      // Aggiorna il pacchetto
      const { data: updated, error } = await supabase
        .from('pacchetti_servizi')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Se servizi_ids è definito, aggiorniamo le associazioni
      if (servizi_ids !== undefined) {
        // Rimuovi vecchie associazioni
        await supabase
          .from('pacchetti_servizi_items')
          .delete()
          .eq('pacchetto_id', id)

        // Aggiungi nuove associazioni
        if (servizi_ids.length > 0) {
          const items = servizi_ids.map((servizio_id, index) => ({
            tenant_id: DEFAULT_TENANT_ID,
            pacchetto_id: id,
            servizio_id,
            ordine: index
          }))

          const { error: itemsError } = await supabase
            .from('pacchetti_servizi_items')
            .insert(items)

          if (itemsError) throw itemsError
        }
      }

      return updated as PacchettoServizio
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pacchettiServiziKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: pacchettiServiziKeys.lists() })
    },
  })
}

// Elimina pacchetto
export function useDeletePacchettoServizio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pacchetti_servizi')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pacchettiServiziKeys.all })
    },
  })
}
