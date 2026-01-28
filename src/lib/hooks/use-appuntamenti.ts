import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type {
    Appuntamento,
    AppuntamentoInsert,
    AppuntamentoUpdate,
    TemplateAppuntamento,
    StatoAppuntamento
} from '@/types/database'

export const appuntamentoKeys = {
    all: ['appuntamento'] as const,
    lists: () => [...appuntamentoKeys.all, 'list'] as const,
    list: (filters?: {
        contattoId?: string
        proprietaId?: string
        proprietaLeadId?: string
        stato?: StatoAppuntamento
        dataInizio?: string
        dataFine?: string
    }) => [...appuntamentoKeys.lists(), filters] as const,
    details: () => [...appuntamentoKeys.all, 'detail'] as const,
    detail: (id: string) => [...appuntamentoKeys.details(), id] as const,
    prossimi: () => [...appuntamentoKeys.all, 'prossimi'] as const,
    templates: ['template_appuntamento'] as const,
    templatesByTrigger: (tipoEntita: string, fase: string) =>
        [...appuntamentoKeys.templates, tipoEntita, fase] as const,
}

interface AppuntamentoFilters {
    contattoId?: string
    proprietaId?: string
    proprietaLeadId?: string
    stato?: StatoAppuntamento
    dataInizio?: string
    dataFine?: string
}

// Lista appuntamenti con filtri
export function useAppuntamenti(filters?: AppuntamentoFilters) {
    return useQuery({
        queryKey: appuntamentoKeys.list(filters),
        queryFn: async () => {
            let query = supabase
                .from('appuntamento')
                .select(`
          *,
          contatto:contatti(*),
          proprieta:proprieta(*)
        `)
                .eq('tenant_id', DEFAULT_TENANT_ID)
                .order('data_inizio', { ascending: true })

            if (filters?.contattoId) {
                query = query.eq('contatto_id', filters.contattoId)
            }
            if (filters?.proprietaId) {
                query = query.eq('proprieta_id', filters.proprietaId)
            }
            if (filters?.proprietaLeadId) {
                query = query.eq('proprieta_lead_id', filters.proprietaLeadId)
            }
            if (filters?.stato) {
                query = query.eq('stato', filters.stato)
            }
            if (filters?.dataInizio) {
                query = query.gte('data_inizio', filters.dataInizio)
            }
            if (filters?.dataFine) {
                query = query.lte('data_fine', filters.dataFine)
            }

            const { data, error } = await query

            if (error) throw error
            return data as Appuntamento[]
        },
    })
}

// Appuntamenti per il calendario (range date)
export function useAppuntamentiCalendar(start: Date, end: Date) {
    return useQuery({
        queryKey: appuntamentoKeys.list({
            dataInizio: start.toISOString(),
            dataFine: end.toISOString()
        }),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('appuntamento')
                .select(`
          *,
          contatto:contatti(nome, cognome, email, telefono),
          proprieta:proprieta(nome, indirizzo)
        `)
                .eq('tenant_id', DEFAULT_TENANT_ID)
                .gte('data_inizio', start.toISOString())
                .lte('data_fine', end.toISOString())
                .order('data_inizio', { ascending: true })

            if (error) throw error
            return data as Appuntamento[]
        },
    })
}

// Prossimi appuntamenti (per dashboard)
export function useAppuntamentiProssimi(limit = 5) {
    return useQuery({
        queryKey: appuntamentoKeys.prossimi(),
        queryFn: async () => {
            const now = new Date().toISOString()
            const { data, error } = await supabase
                .from('appuntamento')
                .select(`
          *,
          contatto:contatti(nome, cognome),
          proprieta:proprieta(nome)
        `)
                .eq('tenant_id', DEFAULT_TENANT_ID)
                .gte('data_inizio', now)
                .in('stato', ['proposto', 'confermato'])
                .order('data_inizio', { ascending: true })
                .limit(limit)

            if (error) throw error
            return data as Appuntamento[]
        },
    })
}

// Singolo appuntamento
export function useAppuntamento(id: string | undefined) {
    return useQuery({
        queryKey: appuntamentoKeys.detail(id!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('appuntamento')
                .select(`
          *,
          contatto:contatti(*),
          proprieta:proprieta(*)
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Appuntamento
        },
        enabled: !!id,
    })
}

// Crea appuntamento
export function useCreateAppuntamento() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (appuntamento: Omit<AppuntamentoInsert, 'tenant_id'>) => {
            const { data, error } = await supabase
                .from('appuntamento')
                .insert({
                    ...appuntamento,
                    tenant_id: DEFAULT_TENANT_ID,
                })
                .select()
                .single()

            if (error) throw error
            return data as Appuntamento
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appuntamentoKeys.all })
        },
    })
}

// Aggiorna appuntamento
export function useUpdateAppuntamento() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }: AppuntamentoUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from('appuntamento')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as Appuntamento
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: appuntamentoKeys.all })
            queryClient.setQueryData(appuntamentoKeys.detail(data.id), data)
        },
    })
}

// Elimina appuntamento
export function useDeleteAppuntamento() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('appuntamento')
                .delete()
                .eq('id', id)

            if (error) throw error
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appuntamentoKeys.all })
        },
    })
}

// Template appuntamenti per suggerimenti automatici
export function useTemplateAppuntamenti(tipoEntita: string, faseTrigger: string) {
    return useQuery({
        queryKey: appuntamentoKeys.templatesByTrigger(tipoEntita, faseTrigger),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('template_appuntamento')
                .select('*')
                .eq('tenant_id', DEFAULT_TENANT_ID)
                .eq('tipo_entita', tipoEntita)
                .eq('fase_trigger', faseTrigger)
                .eq('attivo', true)
                .order('ordine', { ascending: true })

            if (error) throw error
            return data as TemplateAppuntamento[]
        },
        enabled: !!tipoEntita && !!faseTrigger,
    })
}

// Count appuntamenti per stats dashboard
export function useAppuntamentiStats() {
    return useQuery({
        queryKey: [...appuntamentoKeys.all, 'stats'],
        queryFn: async () => {
            const now = new Date()
            const oggi = now.toISOString().split('T')[0]
            const domani = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const settimana = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            // Appuntamenti oggi
            const { count: oggiCount } = await supabase
                .from('appuntamento')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', DEFAULT_TENANT_ID)
                .gte('data_inizio', oggi)
                .lt('data_inizio', domani)
                .in('stato', ['proposto', 'confermato'])

            // Appuntamenti questa settimana
            const { count: settimanaCount } = await supabase
                .from('appuntamento')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', DEFAULT_TENANT_ID)
                .gte('data_inizio', oggi)
                .lt('data_inizio', settimana)
                .in('stato', ['proposto', 'confermato'])

            return {
                appuntamentiOggi: oggiCount || 0,
                appuntamentiSettimana: settimanaCount || 0,
            }
        },
    })
}
