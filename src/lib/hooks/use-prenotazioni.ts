import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { Prenotazione, PrenotazioneInsert, PrenotazioneUpdate, PrenotazioneDettaglio } from '@/types/database'

export const prenotazioniKeys = {
  all: ['prenotazioni'] as const,
  lists: () => [...prenotazioniKeys.all, 'list'] as const,
  list: (filters?: { proprietaId?: string; stato?: string; from?: string; to?: string }) =>
    [...prenotazioniKeys.lists(), filters] as const,
  details: () => [...prenotazioniKeys.all, 'detail'] as const,
  detail: (id: string) => [...prenotazioniKeys.details(), id] as const,
  dettaglio: ['prenotazioni_dettaglio'] as const,
}

// Lista prenotazioni con filtri
export function usePrenotazioniList(filters?: {
  proprietaId?: string
  stato?: string
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: prenotazioniKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('prenotazioni')
        .select(`
          *,
          proprieta:proprieta(id, nome, citta, commissione_percentuale)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('checkin', { ascending: false })

      if (filters?.proprietaId) {
        query = query.eq('proprieta_id', filters.proprietaId)
      }
      if (filters?.stato) {
        query = query.eq('stato', filters.stato)
      }
      if (filters?.from) {
        query = query.gte('checkin', filters.from)
      }
      if (filters?.to) {
        query = query.lte('checkout', filters.to)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Prenotazione[]
    },
  })
}

// Prenotazioni con dettaglio (view con calcoli)
export function usePrenotazioniDettaglio(filters?: {
  proprietaId?: string
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: [...prenotazioniKeys.dettaglio, filters],
    queryFn: async () => {
      let query = supabase
        .from('prenotazioni_dettaglio')
        .select('*')
        .order('checkin', { ascending: false })

      if (filters?.proprietaId) {
        query = query.eq('proprieta_id', filters.proprietaId)
      }
      if (filters?.from) {
        query = query.gte('checkin', filters.from)
      }
      if (filters?.to) {
        query = query.lte('checkout', filters.to)
      }

      const { data, error } = await query

      if (error) throw error
      return data as PrenotazioneDettaglio[]
    },
  })
}

// Prenotazioni prossime (oggi + 7 giorni)
export function usePrenotazioniProssime() {
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return useQuery({
    queryKey: [...prenotazioniKeys.lists(), 'prossime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prenotazioni')
        .select(`
          *,
          proprieta:proprieta(id, nome, citta)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .gte('checkin', today)
        .lte('checkin', nextWeek)
        .in('stato', ['confermata', 'richiesta'])
        .order('checkin', { ascending: true })

      if (error) throw error
      return data as Prenotazione[]
    },
  })
}

// Singola prenotazione
export function usePrenotazione(id: string | undefined) {
  return useQuery({
    queryKey: prenotazioniKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prenotazioni')
        .select(`
          *,
          proprieta:proprieta(id, nome, citta, commissione_percentuale, contatto_id)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Prenotazione
    },
    enabled: !!id,
  })
}

// Crea prenotazione
export function useCreatePrenotazione() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (prenotazione: Omit<PrenotazioneInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('prenotazioni')
        .insert({ ...prenotazione, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as Prenotazione
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prenotazioniKeys.lists() })
    },
  })
}

// Aggiorna prenotazione
export function useUpdatePrenotazione() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: PrenotazioneUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('prenotazioni')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Prenotazione
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: prenotazioniKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: prenotazioniKeys.lists() })
      queryClient.invalidateQueries({ queryKey: prenotazioniKeys.dettaglio })
    },
  })
}

// Elimina prenotazione
export function useDeletePrenotazione() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prenotazioni')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prenotazioniKeys.all })
    },
  })
}

// Statistiche prenotazioni per proprietà
export function usePrenotazioniStats(proprietaId?: string, anno?: number) {
  const currentYear = anno || new Date().getFullYear()
  const from = `${currentYear}-01-01`
  const to = `${currentYear}-12-31`

  return useQuery({
    queryKey: [...prenotazioniKeys.all, 'stats', proprietaId, currentYear],
    queryFn: async () => {
      let query = supabase
        .from('prenotazioni')
        .select('importo_netto, notti, stato')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .gte('checkin', from)
        .lte('checkout', to)
        .not('stato', 'in', '("cancellata","no_show")')

      if (proprietaId) {
        query = query.eq('proprieta_id', proprietaId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        totalePrenotazioni: data.length,
        totaleNotti: data.reduce((sum, p) => sum + (p.notti || 0), 0),
        totaleRicavi: data.reduce((sum, p) => sum + (p.importo_netto || 0), 0),
      }

      return stats
    },
  })
}
