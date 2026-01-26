'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type {
  DocumentTemplate,
  DocumentTemplateInsert,
  DocumentTemplateUpdate,
  CategoriaTemplate
} from '@/types/database'

// ============================================
// QUERY KEYS
// ============================================

export const documentTemplateKeys = {
  all: ['document-templates'] as const,
  lists: () => [...documentTemplateKeys.all, 'list'] as const,
  list: (filters: { categoria?: CategoriaTemplate; attivo?: boolean }) =>
    [...documentTemplateKeys.lists(), filters] as const,
  details: () => [...documentTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentTemplateKeys.details(), id] as const,
  byCategoria: (categoria: CategoriaTemplate) =>
    [...documentTemplateKeys.all, 'categoria', categoria] as const,
}

// ============================================
// FETCH FUNCTIONS
// ============================================

async function fetchTemplates(filters?: {
  categoria?: CategoriaTemplate
  attivo?: boolean
}): Promise<DocumentTemplate[]> {
  let query = supabase
    .from('document_templates')
    .select('*')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .order('categoria')
    .order('nome')

  if (filters?.categoria) {
    query = query.eq('categoria', filters.categoria)
  }

  if (filters?.attivo !== undefined) {
    query = query.eq('attivo', filters.attivo)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

async function fetchTemplate(id: string): Promise<DocumentTemplate | null> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

async function fetchTemplateByCategoria(
  categoria: CategoriaTemplate,
  predefinito?: boolean
): Promise<DocumentTemplate | null> {
  let query = supabase
    .from('document_templates')
    .select('*')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('categoria', categoria)
    .eq('attivo', true)

  if (predefinito) {
    query = query.eq('predefinito', true)
  }

  const { data, error } = await query.order('predefinito', { ascending: false }).limit(1).single()

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
 * Hook per ottenere tutti i template
 */
export function useDocumentTemplates(filters?: {
  categoria?: CategoriaTemplate
  attivo?: boolean
}) {
  return useQuery({
    queryKey: documentTemplateKeys.list(filters || {}),
    queryFn: () => fetchTemplates(filters),
  })
}

/**
 * Hook per ottenere un singolo template
 */
export function useDocumentTemplate(id: string | undefined) {
  return useQuery({
    queryKey: documentTemplateKeys.detail(id || ''),
    queryFn: () => fetchTemplate(id!),
    enabled: !!id,
  })
}

/**
 * Hook per ottenere il template predefinito di una categoria
 */
export function useDefaultTemplate(categoria: CategoriaTemplate) {
  return useQuery({
    queryKey: [...documentTemplateKeys.byCategoria(categoria), 'default'],
    queryFn: () => fetchTemplateByCategoria(categoria, true),
  })
}

// ============================================
// HOOKS - MUTATIONS
// ============================================

/**
 * Hook per creare un nuovo template
 */
export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<DocumentTemplateInsert, 'tenant_id'>) => {
      const { data: result, error } = await supabase
        .from('document_templates')
        .insert({
          ...data,
          tenant_id: DEFAULT_TENANT_ID,
        })
        .select()
        .single()

      if (error) throw error
      return result as DocumentTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.all })
    },
  })
}

/**
 * Hook per aggiornare un template
 */
export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DocumentTemplateUpdate }) => {
      // Se stiamo impostando come predefinito, rimuovi prima il predefinito dagli altri
      if (data.predefinito) {
        const template = await fetchTemplate(id)
        if (template) {
          await supabase
            .from('document_templates')
            .update({ predefinito: false })
            .eq('tenant_id', DEFAULT_TENANT_ID)
            .eq('categoria', template.categoria)
            .neq('id', id)
        }
      }

      const { data: result, error } = await supabase
        .from('document_templates')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as DocumentTemplate
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.all })
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.detail(id) })
    },
  })
}

/**
 * Hook per duplicare un template
 */
export function useDuplicateDocumentTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const original = await fetchTemplate(id)
      if (!original) throw new Error('Template non trovato')

      const { data: result, error } = await supabase
        .from('document_templates')
        .insert({
          tenant_id: DEFAULT_TENANT_ID,
          nome: `${original.nome} (copia)`,
          descrizione: original.descrizione,
          categoria: original.categoria,
          contenuto: original.contenuto,
          contenuto_html: original.contenuto_html,
          variabili_utilizzate: original.variabili_utilizzate,
          formato_pagina: original.formato_pagina,
          orientamento: original.orientamento,
          margini: original.margini,
          stili_custom: original.stili_custom,
          attivo: false, // La copia parte disattivata
          predefinito: false,
          versione: 1,
        })
        .select()
        .single()

      if (error) throw error
      return result as DocumentTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.all })
    },
  })
}

/**
 * Hook per eliminare un template
 */
export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.all })
    },
  })
}

/**
 * Hook per impostare un template come predefinito
 */
export function useSetDefaultTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, categoria }: { id: string; categoria: CategoriaTemplate }) => {
      // Prima rimuovi il predefinito dalla categoria
      await supabase
        .from('document_templates')
        .update({ predefinito: false })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('categoria', categoria)

      // Poi imposta il nuovo predefinito
      const { data, error } = await supabase
        .from('document_templates')
        .update({ predefinito: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as DocumentTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.all })
    },
  })
}
