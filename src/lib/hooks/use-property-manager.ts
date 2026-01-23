import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { PropertyManager, PropertyManagerInsert, PropertyManagerUpdate } from '@/types/database'

export const propertyManagerKeys = {
  all: ['property_manager'] as const,
  detail: () => [...propertyManagerKeys.all, 'detail'] as const,
}

// Ottiene i dati del Property Manager (singola entità per tenant)
export function usePropertyManager() {
  return useQuery({
    queryKey: propertyManagerKeys.detail(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_manager')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .maybeSingle()

      if (error) throw error
      return data as PropertyManager | null
    },
  })
}

// Tipo per i dati del form (accetta undefined)
type PropertyManagerFormInput = {
  id?: string
  ragione_sociale: string
  nome_commerciale?: string | null
  partita_iva?: string | null
  codice_fiscale?: string | null
  codice_sdi?: string | null
  pec?: string | null
  indirizzo?: string | null
  citta?: string | null
  cap?: string | null
  provincia?: string | null
  email?: string | null
  telefono?: string | null
  cellulare?: string | null
  sito_web?: string | null
  instagram?: string | null
  facebook?: string | null
  linkedin?: string | null
  referente_nome?: string | null
  referente_cognome?: string | null
  referente_ruolo?: string | null
  referente_email?: string | null
  referente_telefono?: string | null
  banca?: string | null
  iban?: string | null
  swift?: string | null
  intestatario_conto?: string | null
  logo_url?: string | null
  colore_primario?: string | null
  note?: string | null
}

// Crea o aggiorna i dati del Property Manager (upsert)
export function useUpsertPropertyManager() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PropertyManagerFormInput) => {
      const { id, ...rest } = data

      if (id) {
        // Update
        const { data: updated, error } = await supabase
          .from('property_manager')
          .update(rest)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return updated as PropertyManager
      } else {
        // Insert
        const { data: created, error } = await supabase
          .from('property_manager')
          .insert({ ...rest, tenant_id: DEFAULT_TENANT_ID })
          .select()
          .single()

        if (error) throw error
        return created as PropertyManager
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyManagerKeys.all })
    },
  })
}

// Aggiorna i dati del Property Manager
export function useUpdatePropertyManager() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: PropertyManagerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('property_manager')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PropertyManager
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyManagerKeys.all })
    },
  })
}
