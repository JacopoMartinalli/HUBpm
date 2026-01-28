import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import { generaTaskPerFase } from '@/lib/services/fase-service'
import type { Contatto, ContattoInsert, ContattoUpdate, TipoContatto, FaseLead, FaseCliente, MotivoLeadPerso } from '@/types/database'
import { taskKeys } from './use-task'

export const contattiKeys = {
  all: ['contatti'] as const,
  lists: () => [...contattiKeys.all, 'list'] as const,
  list: (tipo: TipoContatto | 'all') => [...contattiKeys.lists(), tipo] as const,
  details: () => [...contattiKeys.all, 'detail'] as const,
  detail: (id: string) => [...contattiKeys.details(), id] as const,
}

// Lista contatti per tipo (o tutti se tipo è null/undefined)
export function useContatti(tipo?: TipoContatto | null) {
  return useQuery({
    queryKey: contattiKeys.list(tipo ?? 'all' as any), // Use 'all' as key part if no type
    queryFn: async () => {
      let query = supabase
        .from('contatti')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('created_at', { ascending: false })

      if (tipo) {
        query = query.eq('tipo', tipo)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Contatto[]
    },
  })
}

// Lista Lead
export function useLeads() {
  return useContatti('lead')
}

// Lista Clienti
export function useClienti() {
  return useContatti('cliente')
}

// Lista Partner
export function usePartner() {
  return useContatti('partner')
}

// Alias per usePartner (per naming coerente)
export function usePartnerList() {
  return usePartner()
}

// Singolo contatto
export function useContatto(id: string | undefined) {
  return useQuery({
    queryKey: contattiKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatti')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Contatto
    },
    enabled: !!id,
  })
}

// Crea contatto
export function useCreateContatto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contatto: Omit<ContattoInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('contatti')
        .insert({ ...contatto, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error

      // Genera i task della fase iniziale
      const contattoCreato = data as Contatto
      if (contattoCreato.tipo === 'lead' && contattoCreato.fase_lead) {
        await generaTaskPerFase('lead', contattoCreato.fase_lead, contattoCreato.id)
      } else if (contattoCreato.tipo === 'cliente' && contattoCreato.fase_cliente) {
        await generaTaskPerFase('cliente', contattoCreato.fase_cliente, contattoCreato.id)
      }

      return contattoCreato
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contattiKeys.list(data.tipo) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Aggiorna contatto
export function useUpdateContatto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ContattoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('contatti')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Contatto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contattiKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: contattiKeys.list(data.tipo) })
    },
  })
}

// Elimina contatto
export function useDeleteContatto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contatti')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contattiKeys.all })
    },
  })
}

// Aggiorna fase Lead
export function useUpdateFaseLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, fase }: { id: string; fase: FaseLead }) => {
      const { data, error } = await supabase
        .from('contatti')
        .update({ fase_lead: fase })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Contatto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contattiKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: contattiKeys.list('lead') })
    },
  })
}

// Aggiorna fase Cliente
export function useUpdateFaseCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, fase }: { id: string; fase: FaseCliente }) => {
      const { data, error } = await supabase
        .from('contatti')
        .update({ fase_cliente: fase })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Contatto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contattiKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: contattiKeys.list('cliente') })
    },
  })
}

// Converti Lead a Cliente
export function useConvertLeadToCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase
        .from('contatti')
        .update({
          tipo: 'cliente',
          esito_lead: 'vinto',
          fase_cliente: 'C0',
          data_conversione: new Date().toISOString().split('T')[0],
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data as Contatto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contattiKeys.all })
    },
  })
}

// Segna Lead come perso
export function useMarkLeadAsLost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, motivoCodice, note }: { id: string; motivoCodice: MotivoLeadPerso; note?: string }) => {
      const { data, error } = await supabase
        .from('contatti')
        .update({
          esito_lead: 'perso',
          motivo_perso_codice: motivoCodice,
          motivo_perso: note || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Contatto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contattiKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: contattiKeys.list('lead') })
    },
  })
}

// Tipo esteso per clienti con conteggio proprietà per gruppo fase
export interface ClienteConProprieta extends Contatto {
  proprieta_count: number
  proprieta_onboarding: number   // P0, P1, P2
  proprieta_avvio: number        // P3
  proprieta_online: number       // P4
  proprieta_cessate: number      // P5
  gruppo_cliente: 'onboarding' | 'avvio' | 'online' | 'cessato' | 'nessuna'
}

// Clienti derivati: contatti (lead o clienti) che hanno almeno una proprietà in fase P3+
export function useClientiConProprieta() {
  return useQuery({
    queryKey: [...contattiKeys.all, 'con-proprieta'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatti')
        .select(`
          *,
          proprieta!proprieta_contatto_id_fkey(id, fase)
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo', 'cliente')

      if (error) throw error

      const clienti = (data || [])
        .map((contatto: Contatto & { proprieta?: Array<{ id: string; fase: string }> }) => {
          const proprieta = contatto.proprieta || []
          const onboarding = proprieta.filter(p => ['P0', 'P1', 'P2'].includes(p.fase)).length
          const avvio = proprieta.filter(p => p.fase === 'P3').length
          const online = proprieta.filter(p => p.fase === 'P4').length
          const cessate = proprieta.filter(p => p.fase === 'P5').length

          // Gruppo = fase più avanzata tra le proprietà attive
          let gruppo: ClienteConProprieta['gruppo_cliente'] = 'nessuna'
          if (online > 0) gruppo = 'online'
          else if (avvio > 0) gruppo = 'avvio'
          else if (onboarding > 0) gruppo = 'onboarding'
          else if (cessate > 0) gruppo = 'cessato'

          return {
            ...contatto,
            proprieta_count: proprieta.length,
            proprieta_onboarding: onboarding,
            proprieta_avvio: avvio,
            proprieta_online: online,
            proprieta_cessate: cessate,
            gruppo_cliente: gruppo,
          } as ClienteConProprieta
        })

      return clienti
    },
  })
}
