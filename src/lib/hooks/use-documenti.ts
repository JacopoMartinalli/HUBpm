import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { Documento, DocumentoInsert, DocumentoUpdate, TemplateDocumento } from '@/types/database'

export const documentiKeys = {
  all: ['documenti'] as const,
  lists: () => [...documentiKeys.all, 'list'] as const,
  listByContatto: (contattoId: string) => [...documentiKeys.lists(), 'contatto', contattoId] as const,
  listByProprieta: (proprietaId: string) => [...documentiKeys.lists(), 'proprieta', proprietaId] as const,
  details: () => [...documentiKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentiKeys.details(), id] as const,
  templates: ['template_documenti'] as const,
  templatesByEntita: (tipoEntita: string, fase: string) => [...documentiKeys.templates, tipoEntita, fase] as const,
}

// Lista documenti per contatto (cliente)
export function useDocumentiByContatto(contattoId: string | undefined) {
  return useQuery({
    queryKey: documentiKeys.listByContatto(contattoId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documenti')
        .select('*')
        .eq('contatto_id', contattoId)
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true })

      if (error) throw error
      return data as Documento[]
    },
    enabled: !!contattoId,
  })
}

// Lista documenti per proprietà
export function useDocumentiByProprieta(proprietaId: string | undefined) {
  return useQuery({
    queryKey: documentiKeys.listByProprieta(proprietaId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documenti')
        .select('*')
        .eq('proprieta_id', proprietaId)
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true })

      if (error) throw error
      return data as Documento[]
    },
    enabled: !!proprietaId,
  })
}

// Lista template documenti per entità e fase
export function useTemplateDocumenti(tipoEntita: string, fase: string) {
  return useQuery({
    queryKey: documentiKeys.templatesByEntita(tipoEntita, fase),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_documenti')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo_entita', tipoEntita)
        .eq('fase', fase)
        .order('ordine', { ascending: true })

      if (error) throw error
      return data as TemplateDocumento[]
    },
  })
}

// Singolo documento
export function useDocumento(id: string | undefined) {
  return useQuery({
    queryKey: documentiKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documenti')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Documento
    },
    enabled: !!id,
  })
}

// Crea documento
export function useCreateDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documento: Omit<DocumentoInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('documenti')
        .insert({ ...documento, tenant_id: DEFAULT_TENANT_ID })
        .select()
        .single()

      if (error) throw error
      return data as Documento
    },
    onSuccess: (data) => {
      if (data.contatto_id) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByContatto(data.contatto_id) })
      }
      if (data.proprieta_id) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByProprieta(data.proprieta_id) })
      }
    },
  })
}

// Aggiorna documento
export function useUpdateDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: DocumentoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('documenti')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Documento
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentiKeys.detail(data.id) })
      if (data.contatto_id) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByContatto(data.contatto_id) })
      }
      if (data.proprieta_id) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByProprieta(data.proprieta_id) })
      }
    },
  })
}

// Elimina documento
export function useDeleteDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, contattoId, proprietaId }: { id: string; contattoId?: string; proprietaId?: string }) => {
      const { error } = await supabase
        .from('documenti')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { contattoId, proprietaId }
    },
    onSuccess: (data) => {
      if (data.contattoId) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByContatto(data.contattoId) })
      }
      if (data.proprietaId) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByProprieta(data.proprietaId) })
      }
    },
  })
}

// Upload file per un documento
export function useUploadDocumentoFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentoId, contattoId, proprietaId, file }: {
      documentoId: string
      contattoId?: string | null
      proprietaId?: string | null
      file: File
    }) => {
      // Upload to storage
      const ext = file.name.split('.').pop()
      const path = `${contattoId || proprietaId}/${documentoId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documenti')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documenti')
        .getPublicUrl(path)

      // Update documento record
      const { data, error } = await supabase
        .from('documenti')
        .update({
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          data_caricamento: new Date().toISOString(),
          stato: 'ricevuto' as const,
        })
        .eq('id', documentoId)
        .select()
        .single()

      if (error) throw error
      return data as Documento
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentiKeys.detail(data.id) })
      if (data.contatto_id) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByContatto(data.contatto_id) })
      }
      if (data.proprieta_id) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByProprieta(data.proprieta_id) })
      }
    },
  })
}

// Genera documenti da template per un'entità
export function useGeneraDocumentiDaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tipoEntita,
      fase,
      contattoId,
      proprietaId,
    }: {
      tipoEntita: 'cliente' | 'proprieta'
      fase?: string
      contattoId?: string
      proprietaId?: string
    }) => {
      // Ottieni template per questa entità (opzionalmente filtrati per fase)
      let query = supabase
        .from('template_documenti')
        .select('*')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo_entita', tipoEntita)

      if (fase) {
        query = query.eq('fase', fase)
      }

      const { data: templates, error: templateError } = await query

      if (templateError) throw templateError

      // Crea documenti basati sui template
      const documentiToInsert = templates.map((template) => ({
        tenant_id: DEFAULT_TENANT_ID,
        template_id: template.id,
        contatto_id: contattoId || null,
        proprieta_id: proprietaId || null,
        nome: template.nome,
        descrizione: template.descrizione,
        categoria: template.categoria,
        obbligatorio: template.obbligatorio,
        stato: 'mancante' as const,
      }))

      if (documentiToInsert.length > 0) {
        const { data, error } = await supabase
          .from('documenti')
          .insert(documentiToInsert)
          .select()

        if (error) throw error
        return data as Documento[]
      }

      return []
    },
    onSuccess: (_, variables) => {
      if (variables.contattoId) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByContatto(variables.contattoId) })
      }
      if (variables.proprietaId) {
        queryClient.invalidateQueries({ queryKey: documentiKeys.listByProprieta(variables.proprietaId) })
      }
    },
  })
}
