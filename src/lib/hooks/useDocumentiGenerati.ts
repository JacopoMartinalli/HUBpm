'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type {
  DocumentoGenerato,
  DocumentoGeneratoInsert,
  DocumentoGeneratoUpdate,
  CategoriaTemplate,
  StatoDocumentoGenerato
} from '@/types/database'

// ============================================
// QUERY KEYS
// ============================================

export const documentiGeneratiKeys = {
  all: ['documenti-generati'] as const,
  lists: () => [...documentiGeneratiKeys.all, 'list'] as const,
  list: (filters: DocumentiFilters) => [...documentiGeneratiKeys.lists(), filters] as const,
  details: () => [...documentiGeneratiKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentiGeneratiKeys.details(), id] as const,
  byContatto: (contattoId: string) => [...documentiGeneratiKeys.all, 'contatto', contattoId] as const,
  byProprieta: (proprietaId: string) => [...documentiGeneratiKeys.all, 'proprieta', proprietaId] as const,
  byProposta: (propostaId: string) => [...documentiGeneratiKeys.all, 'proposta', propostaId] as const,
}

// ============================================
// TYPES
// ============================================

interface DocumentiFilters {
  contatto_id?: string
  proprieta_id?: string
  proposta_id?: string
  categoria?: CategoriaTemplate
  stato?: StatoDocumentoGenerato
  limit?: number
}

// ============================================
// FETCH FUNCTIONS
// ============================================

async function fetchDocumenti(filters: DocumentiFilters): Promise<DocumentoGenerato[]> {
  let query = supabase
    .from('documenti_generati')
    .select(`
      *,
      template:document_templates(id, nome, categoria),
      contatto:contatti(id, nome, cognome, email),
      proprieta:proprieta(id, nome, indirizzo),
      proposta:proposte_commerciali(id, numero, titolo)
    `)
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .order('data_generazione', { ascending: false })

  if (filters.contatto_id) {
    query = query.eq('contatto_id', filters.contatto_id)
  }

  if (filters.proprieta_id) {
    query = query.eq('proprieta_id', filters.proprieta_id)
  }

  if (filters.proposta_id) {
    query = query.eq('proposta_id', filters.proposta_id)
  }

  if (filters.categoria) {
    query = query.eq('categoria', filters.categoria)
  }

  if (filters.stato) {
    query = query.eq('stato', filters.stato)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

async function fetchDocumento(id: string): Promise<DocumentoGenerato | null> {
  const { data, error } = await supabase
    .from('documenti_generati')
    .select(`
      *,
      template:document_templates(id, nome, categoria),
      contatto:contatti(id, nome, cognome, email, telefono, indirizzo, citta, cap, provincia),
      proprieta:proprieta(id, nome, indirizzo, citta),
      proposta:proposte_commerciali(id, numero, titolo, totale)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

// ============================================
// HOOKS - QUERY
// ============================================

/**
 * Hook per ottenere documenti con filtri
 */
export function useDocumentiGenerati(filters: DocumentiFilters = {}) {
  return useQuery({
    queryKey: documentiGeneratiKeys.list(filters),
    queryFn: () => fetchDocumenti(filters),
  })
}

/**
 * Hook per ottenere un singolo documento
 */
export function useDocumentoGenerato(id: string | undefined) {
  return useQuery({
    queryKey: documentiGeneratiKeys.detail(id || ''),
    queryFn: () => fetchDocumento(id!),
    enabled: !!id,
  })
}

/**
 * Hook per ottenere documenti di un contatto
 */
export function useDocumentiByContatto(contattoId: string | undefined) {
  return useQuery({
    queryKey: documentiGeneratiKeys.byContatto(contattoId || ''),
    queryFn: () => fetchDocumenti({ contatto_id: contattoId }),
    enabled: !!contattoId,
  })
}

/**
 * Hook per ottenere documenti di una proprietà
 */
export function useDocumentiByProprieta(proprietaId: string | undefined) {
  return useQuery({
    queryKey: documentiGeneratiKeys.byProprieta(proprietaId || ''),
    queryFn: () => fetchDocumenti({ proprieta_id: proprietaId }),
    enabled: !!proprietaId,
  })
}

/**
 * Hook per ottenere documenti di una proposta
 */
export function useDocumentiByProposta(propostaId: string | undefined) {
  return useQuery({
    queryKey: documentiGeneratiKeys.byProposta(propostaId || ''),
    queryFn: () => fetchDocumenti({ proposta_id: propostaId }),
    enabled: !!propostaId,
  })
}

// ============================================
// HOOKS - MUTATIONS
// ============================================

/**
 * Hook per creare un nuovo documento generato
 */
export function useCreateDocumentoGenerato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<DocumentoGeneratoInsert, 'tenant_id'>) => {
      const { data: result, error } = await supabase
        .from('documenti_generati')
        .insert({
          ...data,
          tenant_id: DEFAULT_TENANT_ID,
        })
        .select()
        .single()

      if (error) throw error
      return result as DocumentoGenerato
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.all })
      if (data.contatto_id) {
        queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.byContatto(data.contatto_id) })
      }
      if (data.proprieta_id) {
        queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.byProprieta(data.proprieta_id) })
      }
      if (data.proposta_id) {
        queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.byProposta(data.proposta_id) })
      }
    },
  })
}

/**
 * Hook per aggiornare un documento
 */
export function useUpdateDocumentoGenerato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DocumentoGeneratoUpdate }) => {
      const { data: result, error } = await supabase
        .from('documenti_generati')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as DocumentoGenerato
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.all })
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.detail(id) })
    },
  })
}

/**
 * Hook per aggiornare lo stato di un documento
 */
export function useUpdateStatoDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      stato,
      extraData,
    }: {
      id: string
      stato: StatoDocumentoGenerato
      extraData?: Partial<DocumentoGeneratoUpdate>
    }) => {
      const updateData: DocumentoGeneratoUpdate = {
        stato,
        ...extraData,
      }

      // Imposta automaticamente le date in base allo stato
      switch (stato) {
        case 'inviato':
          updateData.data_invio = new Date().toISOString()
          break
        case 'visto':
          updateData.data_visualizzazione = new Date().toISOString()
          break
        case 'firmato':
          updateData.data_firma = new Date().toISOString()
          break
      }

      const { data, error } = await supabase
        .from('documenti_generati')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as DocumentoGenerato
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.all })
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.detail(id) })
    },
  })
}

/**
 * Hook per caricare il documento firmato
 */
export function useUploadDocumentoFirmato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      file,
      firmatoDa,
      metodoFirma,
    }: {
      id: string
      file: File
      firmatoDa: string
      metodoFirma: 'manuale' | 'digitale' | 'otp'
    }) => {
      // Upload file a Supabase Storage
      const fileName = `firmati/${id}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documenti')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Ottieni URL pubblico
      const { data: urlData } = supabase.storage
        .from('documenti')
        .getPublicUrl(fileName)

      // Aggiorna il documento
      const { data, error } = await supabase
        .from('documenti_generati')
        .update({
          stato: 'firmato',
          file_firmato_url: urlData.publicUrl,
          file_firmato_nome: file.name,
          firmato_da: firmatoDa,
          metodo_firma: metodoFirma,
          data_firma: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as DocumentoGenerato
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.all })
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.detail(id) })
    },
  })
}

/**
 * Hook per eliminare un documento
 */
export function useDeleteDocumentoGenerato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Prima recupera il documento per eliminare i file dallo storage
      const doc = await fetchDocumento(id)

      if (doc) {
        // Elimina file generato
        if (doc.file_url) {
          const filePath = doc.file_url.split('/documenti/')[1]
          if (filePath) {
            await supabase.storage.from('documenti').remove([filePath])
          }
        }
        // Elimina file firmato
        if (doc.file_firmato_url) {
          const firmatoPath = doc.file_firmato_url.split('/documenti/')[1]
          if (firmatoPath) {
            await supabase.storage.from('documenti').remove([firmatoPath])
          }
        }
      }

      // Elimina record dal database
      const { error } = await supabase
        .from('documenti_generati')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentiGeneratiKeys.all })
    },
  })
}

// ============================================
// STATISTICHE
// ============================================

/**
 * Hook per statistiche documenti
 */
export function useDocumentiStats(filters?: { contatto_id?: string; proprieta_id?: string }) {
  return useQuery({
    queryKey: [...documentiGeneratiKeys.all, 'stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('documenti_generati')
        .select('stato, categoria')
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (filters?.contatto_id) {
        query = query.eq('contatto_id', filters.contatto_id)
      }
      if (filters?.proprieta_id) {
        query = query.eq('proprieta_id', filters.proprieta_id)
      }

      const { data, error } = await query

      if (error) throw error

      // Calcola statistiche
      const stats = {
        totale: data?.length || 0,
        per_stato: {} as Record<string, number>,
        per_categoria: {} as Record<string, number>,
        da_firmare: 0,
        firmati: 0,
      }

      data?.forEach((doc) => {
        stats.per_stato[doc.stato] = (stats.per_stato[doc.stato] || 0) + 1
        stats.per_categoria[doc.categoria] = (stats.per_categoria[doc.categoria] || 0) + 1

        if (['generato', 'inviato', 'visto'].includes(doc.stato)) {
          stats.da_firmare++
        }
        if (doc.stato === 'firmato') {
          stats.firmati++
        }
      })

      return stats
    },
  })
}
