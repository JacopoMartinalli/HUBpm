import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  PropostaCommerciale,
  PropostaCommercialeInsert,
  PropostaCommercialeUpdate,
  PropostaCommercialeItem,
  PropostaCommercialeItemInsert,
  StatoProposta
} from '@/types/database'

const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'

// Query keys
export const proposteKeys = {
  all: ['proposte'] as const,
  lists: () => [...proposteKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...proposteKeys.lists(), filters] as const,
  byProprieta: (proprietaId: string) => [...proposteKeys.lists(), 'proprieta', proprietaId] as const,
  byContatto: (contattoId: string) => [...proposteKeys.lists(), 'contatto', contattoId] as const,
  details: () => [...proposteKeys.all, 'detail'] as const,
  detail: (id: string) => [...proposteKeys.details(), id] as const,
}

// ============================================
// LISTA PROPOSTE
// ============================================

export function useProposte(filters?: { stato?: StatoProposta }) {
  return useQuery({
    queryKey: proposteKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('proposte_commerciali')
        .select(`
          *,
          proprieta:proprieta_id(id, nome, indirizzo, citta),
          contatto:contatto_id(id, nome, cognome, email, telefono),
          items:proposte_commerciali_items(
            id,
            nome,
            quantita,
            prezzo_unitario,
            prezzo_totale,
            servizio_id,
            pacchetto_id
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .order('data_creazione', { ascending: false })

      if (filters?.stato) {
        query = query.eq('stato', filters.stato)
      }

      const { data, error } = await query

      if (error) throw error
      return data as PropostaCommerciale[]
    },
  })
}

// ============================================
// PROPOSTE PER PROPRIETÀ
// ============================================

export function useProposteByProprieta(proprietaId: string | undefined) {
  return useQuery({
    queryKey: proposteKeys.byProprieta(proprietaId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposte_commerciali')
        .select(`
          *,
          proprieta:proprieta_id(id, nome, indirizzo, citta, fase),
          contatto:contatto_id(id, nome, cognome, email, telefono, indirizzo, citta, cap, codice_fiscale, partita_iva),
          items:proposte_commerciali_items(
            id,
            nome,
            descrizione,
            quantita,
            prezzo_unitario,
            sconto_percentuale,
            prezzo_totale,
            ordine,
            servizio_id,
            pacchetto_id,
            servizio:servizio_id(id, nome, tipo),
            pacchetto:pacchetto_id(id, nome, tipo_esito)
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('proprieta_id', proprietaId)
        .order('data_creazione', { ascending: false })

      if (error) throw error
      return data as PropostaCommerciale[]
    },
    enabled: !!proprietaId,
  })
}

// ============================================
// PROPOSTE PER CONTATTO
// ============================================

export function useProposteByContatto(contattoId: string | undefined) {
  return useQuery({
    queryKey: proposteKeys.byContatto(contattoId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposte_commerciali')
        .select(`
          *,
          proprieta:proprieta_id(id, nome, indirizzo, citta),
          items:proposte_commerciali_items(
            id,
            nome,
            quantita,
            prezzo_unitario,
            prezzo_totale,
            servizio_id,
            pacchetto_id
          )
        `)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('contatto_id', contattoId)
        .order('data_creazione', { ascending: false })

      if (error) throw error
      return data as PropostaCommerciale[]
    },
    enabled: !!contattoId,
  })
}

// ============================================
// SINGOLA PROPOSTA
// ============================================

export function useProposta(id: string | undefined) {
  return useQuery({
    queryKey: proposteKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposte_commerciali')
        .select(`
          *,
          proprieta:proprieta_id(id, nome, indirizzo, citta, fase, contatto_id),
          contatto:contatto_id(id, nome, cognome, email, telefono, indirizzo, citta, cap, codice_fiscale, partita_iva),
          items:proposte_commerciali_items(
            id,
            nome,
            descrizione,
            quantita,
            prezzo_unitario,
            sconto_percentuale,
            prezzo_totale,
            ordine,
            note,
            servizio_id,
            pacchetto_id,
            servizio:servizio_id(id, nome, tipo, descrizione),
            pacchetto:pacchetto_id(id, nome, tipo_esito, descrizione)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as PropostaCommerciale
    },
    enabled: !!id,
  })
}

// ============================================
// CREA PROPOSTA
// ============================================

export function useCreateProposta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<PropostaCommercialeInsert, 'tenant_id'>) => {
      const { data: proposta, error } = await supabase
        .from('proposte_commerciali')
        .insert({
          ...data,
          tenant_id: DEFAULT_TENANT_ID,
        })
        .select()
        .single()

      if (error) throw error
      return proposta as PropostaCommerciale
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byProprieta(data.proprieta_id) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byContatto(data.contatto_id) })
    },
  })
}

// ============================================
// AGGIORNA PROPOSTA
// ============================================

export function useUpdateProposta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropostaCommercialeUpdate }) => {
      const { data: proposta, error } = await supabase
        .from('proposte_commerciali')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return proposta as PropostaCommerciale
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposteKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byProprieta(data.proprieta_id) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byContatto(data.contatto_id) })
    },
  })
}

// ============================================
// ELIMINA PROPOSTA
// ============================================

export function useDeleteProposta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, proprietaId, contattoId }: { id: string; proprietaId: string; contattoId: string }) => {
      const { error } = await supabase
        .from('proposte_commerciali')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, proprietaId, contattoId }
    },
    onSuccess: ({ proprietaId, contattoId }) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byProprieta(proprietaId) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byContatto(contattoId) })
    },
  })
}

// ============================================
// CAMBIA STATO PROPOSTA
// ============================================

export function useCambiaStatoProposta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      stato,
      motivo_rifiuto
    }: {
      id: string
      stato: StatoProposta
      motivo_rifiuto?: string
    }) => {
      const updateData: Record<string, unknown> = {
        stato,
      }

      // Imposta date in base allo stato
      if (stato === 'inviata') {
        updateData.data_invio = new Date().toISOString()
      } else if (stato === 'accettata' || stato === 'rifiutata') {
        updateData.data_risposta = new Date().toISOString()
        if (stato === 'rifiutata' && motivo_rifiuto) {
          updateData.motivo_rifiuto = motivo_rifiuto
        }
      }

      const { data: proposta, error } = await supabase
        .from('proposte_commerciali')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          proprieta:proprieta_id(id, nome, fase, contatto_id)
        `)
        .single()

      if (error) throw error
      return proposta as PropostaCommerciale
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposteKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byProprieta(data.proprieta_id) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byContatto(data.contatto_id) })
    },
  })
}

// ============================================
// ACCETTA PROPOSTA (con passaggio a P2)
// ============================================

export function useAccettaProposta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ propostaId }: { propostaId: string }) => {
      // 1. Recupera la proposta con items
      const { data: proposta, error: fetchError } = await supabase
        .from('proposte_commerciali')
        .select(`
          *,
          proprieta:proprieta_id(id, fase, contatto_id),
          items:proposte_commerciali_items(
            id,
            servizio_id,
            pacchetto_id,
            nome,
            prezzo_totale
          )
        `)
        .eq('id', propostaId)
        .single()

      if (fetchError) throw fetchError

      // 2. Aggiorna stato proposta
      const { error: updateError } = await supabase
        .from('proposte_commerciali')
        .update({
          stato: 'accettata',
          data_risposta: new Date().toISOString()
        })
        .eq('id', propostaId)

      if (updateError) throw updateError

      // 3. Crea erogazioni pacchetti per ogni pacchetto nella proposta
      const pacchettiItems = proposta.items?.filter((item: PropostaCommercialeItem) => item.pacchetto_id) || []

      for (const item of pacchettiItems) {
        const { error: erogazioneError } = await supabase
          .from('erogazione_pacchetti')
          .insert({
            tenant_id: DEFAULT_TENANT_ID,
            proprieta_id: proposta.proprieta_id,
            pacchetto_id: item.pacchetto_id,
            stato: 'da_iniziare',
            prezzo_totale: item.prezzo_totale,
            data_inizio: new Date().toISOString().split('T')[0]
          })

        if (erogazioneError) {
          console.error('Errore creazione erogazione pacchetto:', erogazioneError)
        }
      }

      // 4. Se la proprietà è in P1 (onboarding), passa a P2 (avvio)
      if (proposta.proprieta?.fase === 'P1') {
        const { error: faseError } = await supabase
          .from('proprieta')
          .update({ fase: 'P2' })
          .eq('id', proposta.proprieta_id)

        if (faseError) {
          console.error('Errore aggiornamento fase proprietà:', faseError)
        }
      }

      return proposta
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: proposteKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.byProprieta(data.proprieta_id) })
      // Invalida anche le query delle proprietà per aggiornare la fase
      queryClient.invalidateQueries({ queryKey: ['proprieta'] })
      queryClient.invalidateQueries({ queryKey: ['erogazione-pacchetti'] })
    },
  })
}

// ============================================
// AGGIUNGI ITEM A PROPOSTA
// ============================================

export function useAddPropostaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PropostaCommercialeItemInsert) => {
      // Calcola prezzo_totale se non fornito
      const prezzo_totale = data.prezzo_totale ??
        (data.prezzo_unitario * (data.quantita || 1) * (1 - (data.sconto_percentuale || 0) / 100))

      const { data: item, error } = await supabase
        .from('proposte_commerciali_items')
        .insert({
          ...data,
          prezzo_totale,
        })
        .select()
        .single()

      if (error) throw error
      return { item, propostaId: data.proposta_id }
    },
    onSuccess: ({ propostaId }) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.detail(propostaId) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
    },
  })
}

// ============================================
// RIMUOVI ITEM DA PROPOSTA
// ============================================

export function useRemovePropostaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, propostaId }: { itemId: string; propostaId: string }) => {
      const { error } = await supabase
        .from('proposte_commerciali_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      return { propostaId }
    },
    onSuccess: ({ propostaId }) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.detail(propostaId) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
    },
  })
}

// ============================================
// AGGIORNA ITEM PROPOSTA
// ============================================

export function useUpdatePropostaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      propostaId,
      data
    }: {
      itemId: string
      propostaId: string
      data: Partial<PropostaCommercialeItemInsert>
    }) => {
      // Ricalcola prezzo_totale se cambiano quantità, prezzo o sconto
      let updateData = { ...data }

      if (data.prezzo_unitario !== undefined || data.quantita !== undefined || data.sconto_percentuale !== undefined) {
        // Recupera i dati attuali
        const { data: currentItem } = await supabase
          .from('proposte_commerciali_items')
          .select('prezzo_unitario, quantita, sconto_percentuale')
          .eq('id', itemId)
          .single()

        if (currentItem) {
          const prezzo = data.prezzo_unitario ?? currentItem.prezzo_unitario
          const qty = data.quantita ?? currentItem.quantita
          const sconto = data.sconto_percentuale ?? currentItem.sconto_percentuale

          updateData.prezzo_totale = prezzo * qty * (1 - sconto / 100)
        }
      }

      const { data: item, error } = await supabase
        .from('proposte_commerciali_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return { item, propostaId }
    },
    onSuccess: ({ propostaId }) => {
      queryClient.invalidateQueries({ queryKey: proposteKeys.detail(propostaId) })
      queryClient.invalidateQueries({ queryKey: proposteKeys.lists() })
    },
  })
}
