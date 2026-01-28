'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  FileText,
  Upload,
  Check,
  Clock,
  AlertCircle,
  X,
  MoreHorizontal,
  File,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'

// Tipi
interface DocumentoFile {
  url: string
  name: string
  size: number
  storage_path: string
  uploaded_at: string
}

interface Documento {
  id: string
  nome: string
  stato: 'mancante' | 'richiesto' | 'ricevuto' | 'verificato' | 'scaduto'
  obbligatorio: boolean
  files: DocumentoFile[]
  // retrocompat
  file_url: string | null
  file_name: string | null
  categoria: string | null
}

// Documenti fissi per ogni cliente
const DOCUMENTI_CLIENTE = [
  { nome: 'Codice fiscale', categoria: 'fiscale', obbligatorio: true },
  { nome: 'Documento identità', categoria: 'identita', obbligatorio: true },
  { nome: 'Privacy firmata', categoria: 'contratti', obbligatorio: true },
]

// Documenti fissi per ogni proprietà
const DOCUMENTI_PROPRIETA = [
  { nome: 'Visura catastale', categoria: 'catastale', obbligatorio: true },
  { nome: 'Planimetria', categoria: 'catastale', obbligatorio: true },
  { nome: 'APE (Attestato Prestazione Energetica)', categoria: 'catastale', obbligatorio: true },
  { nome: 'SCIA', categoria: 'legale', obbligatorio: true },
  { nome: 'CIR / CIN', categoria: 'legale', obbligatorio: true },
  { nome: 'Contratto di gestione', categoria: 'contratti', obbligatorio: true },
  { nome: 'Assicurazione', categoria: 'legale', obbligatorio: false },
  { nome: 'Foto strutturali', categoria: 'operativo', obbligatorio: false },
]

const STATO_CONFIG = {
  mancante: { label: 'Mancante', icon: X, color: 'bg-red-100 text-red-800' },
  richiesto: { label: 'Richiesto', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  ricevuto: { label: 'Ricevuto', icon: Check, color: 'bg-blue-100 text-blue-800' },
  verificato: { label: 'Verificato', icon: Check, color: 'bg-green-100 text-green-800' },
  scaduto: { label: 'Scaduto', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
} as const

const MAX_FILES = 2
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const ALLOWED_ACCEPT = ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')

function isFileFormatValid(file: globalThis.File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ALLOWED_EXTENSIONS.includes(ext)
}

interface DocumentiListProps {
  tipo: 'cliente' | 'proprieta'
  entityId: string
  fase?: string
}

export function DocumentiList({ tipo, entityId }: DocumentiListProps) {
  const [documenti, setDocumenti] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)

  const loadDocumenti = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const column = tipo === 'cliente' ? 'contatto_id' : 'proprieta_id'
      const { data, error: fetchError } = await supabase
        .from('documenti')
        .select('id, nome, stato, obbligatorio, file_url, file_name, files, categoria')
        .eq(column, entityId)
        .order('nome')

      if (fetchError) throw fetchError

      if (!data || data.length === 0) {
        const templates = tipo === 'cliente' ? DOCUMENTI_CLIENTE : DOCUMENTI_PROPRIETA
        if (templates.length > 0) {
          const toInsert = templates.map(t => ({
            tenant_id: DEFAULT_TENANT_ID,
            contatto_id: tipo === 'cliente' ? entityId : null,
            proprieta_id: tipo === 'proprieta' ? entityId : null,
            nome: t.nome,
            categoria: t.categoria,
            obbligatorio: t.obbligatorio,
            stato: 'mancante' as const,
          }))

          const { data: created, error: insertError } = await supabase
            .from('documenti')
            .insert(toInsert)
            .select('id, nome, stato, obbligatorio, file_url, file_name, files, categoria')

          if (insertError) throw insertError
          setDocumenti(normalizeDocumenti(created || []))
        } else {
          setDocumenti([])
        }
      } else {
        setDocumenti(normalizeDocumenti(data))
      }
    } catch (err) {
      console.error('Errore documenti:', err)
      setError((err as Error).message || 'Errore caricamento documenti')
    } finally {
      setLoading(false)
    }
  }, [tipo, entityId])

  useEffect(() => {
    loadDocumenti()
  }, [loadDocumenti])

  const handleCambiaStato = async (id: string, nuovoStato: Documento['stato']) => {
    const { error } = await supabase
      .from('documenti')
      .update({ stato: nuovoStato })
      .eq('id', id)

    if (!error) {
      setDocumenti(prev => prev.map(d => d.id === id ? { ...d, stato: nuovoStato } : d))
    }
  }

  const handleFileUpload = async (documentoId: string, file: globalThis.File) => {
    if (!isFileFormatValid(file)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'sconosciuto'
      setFormatError(
        `Il file "${file.name}" ha un formato non supportato (.${ext}).\n\nFormati accettati: ${ALLOWED_EXTENSIONS.map(e => `.${e}`).join(', ')}`
      )
      return
    }

    const doc = documenti.find(d => d.id === documentoId)
    if (!doc) return
    if (doc.files.length >= MAX_FILES) {
      setFormatError(`Massimo ${MAX_FILES} file per documento.`)
      return
    }

    try {
      setUploading(true)
      const ext = file.name.split('.').pop()
      const index = doc.files.length
      const storagePath = `${entityId}/${documentoId}/${index}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documenti')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('documenti')
        .getPublicUrl(storagePath)

      const newFile: DocumentoFile = {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        storage_path: storagePath,
        uploaded_at: new Date().toISOString(),
      }

      const updatedFiles = [...doc.files, newFile]

      const { error: updateError } = await supabase
        .from('documenti')
        .update({
          files: updatedFiles,
          file_url: updatedFiles[0].url,
          file_name: updatedFiles[0].name,
          stato: 'ricevuto' as const,
        })
        .eq('id', documentoId)

      if (updateError) throw updateError

      setDocumenti(prev => prev.map(d =>
        d.id === documentoId
          ? { ...d, files: updatedFiles, stato: 'ricevuto' as const }
          : d
      ))
    } catch (err) {
      console.error('Errore upload:', err)
      alert('Errore nel caricamento del file: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileDelete = async (documentoId: string, fileIndex: number) => {
    const doc = documenti.find(d => d.id === documentoId)
    if (!doc) return

    try {
      setUploading(true)
      const fileToDelete = doc.files[fileIndex]

      // Elimina da storage
      if (fileToDelete.storage_path) {
        await supabase.storage
          .from('documenti')
          .remove([fileToDelete.storage_path])
      }

      const updatedFiles = doc.files.filter((_, i) => i !== fileIndex)
      const newStato = updatedFiles.length === 0 ? 'mancante' as const : doc.stato

      const { error: updateError } = await supabase
        .from('documenti')
        .update({
          files: updatedFiles,
          file_url: updatedFiles[0]?.url || null,
          file_name: updatedFiles[0]?.name || null,
          stato: newStato,
        })
        .eq('id', documentoId)

      if (updateError) throw updateError

      setDocumenti(prev => prev.map(d =>
        d.id === documentoId
          ? { ...d, files: updatedFiles, stato: newStato }
          : d
      ))
    } catch (err) {
      console.error('Errore eliminazione:', err)
      alert('Errore nell\'eliminazione del file: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Errore</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadDocumenti}>Riprova</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documenti.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun documento</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completati = documenti.filter(d => d.stato === 'ricevuto' || d.stato === 'verificato').length
  const obbTotali = documenti.filter(d => d.obbligatorio).length
  const obbCompletati = documenti.filter(d => d.obbligatorio && (d.stato === 'ricevuto' || d.stato === 'verificato')).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="font-medium">{completati}/{documenti.length}</span>
          <span className="text-muted-foreground"> documenti completati</span>
        </div>
        {obbTotali > 0 && (
          <Badge variant={obbCompletati >= obbTotali ? 'default' : 'destructive'}>
            {obbCompletati}/{obbTotali} obbligatori
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Documenti da raccogliere</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {documenti.map((doc) => (
              <DocumentoRow
                key={doc.id}
                documento={doc}
                onCambiaStato={handleCambiaStato}
                onFileUpload={handleFileUpload}
                onFileDelete={handleFileDelete}
                isUploading={uploading}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!formatError} onOpenChange={() => setFormatError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formato file non supportato</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {formatError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setFormatError(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Normalizza documenti dal DB: se files è null/undefined, ricostruisci da file_url/file_name
function normalizeDocumenti(data: any[]): Documento[] {
  return data.map(d => {
    let files: DocumentoFile[] = d.files || []
    // Retrocompatibilità: se files è vuoto ma file_url esiste
    if (files.length === 0 && d.file_url) {
      files = [{
        url: d.file_url,
        name: d.file_name || 'file',
        size: 0,
        storage_path: '',
        uploaded_at: '',
      }]
    }
    return { ...d, files }
  })
}

interface DocumentoRowProps {
  documento: Documento
  onCambiaStato: (id: string, stato: Documento['stato']) => void
  onFileUpload: (id: string, file: globalThis.File) => void
  onFileDelete: (id: string, fileIndex: number) => void
  isUploading: boolean
}

function DocumentoRow({ documento, onCambiaStato, onFileUpload, onFileDelete, isUploading }: DocumentoRowProps) {
  const statoConfig = STATO_CONFIG[documento.stato]
  const Icon = statoConfig.icon
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = documento.files.length < MAX_FILES
  const hasFiles = documento.files.length > 0

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (canAddMore) setIsDragOver(true)
  }, [canAddMore])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && canAddMore) onFileUpload(documento.id, file)
  }, [documento.id, onFileUpload, canAddMore])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileUpload(documento.id, file)
    // Reset input per permettere di ricaricare lo stesso file
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border bg-card transition-colors ${
        isDragOver ? 'border-blue-400 bg-blue-50' : 'hover:bg-muted/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-md ${statoConfig.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{documento.nome}</p>
            {documento.obbligatorio && (
              <Badge variant="outline" className="text-xs">Obbligatorio</Badge>
            )}
          </div>
          {hasFiles ? (
            <div className="space-y-1 mt-1">
              {documento.files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 group">
                  <File className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline truncate"
                  >
                    {f.name}
                  </a>
                  <button
                    onClick={() => onFileDelete(documento.id, i)}
                    disabled={isUploading}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 text-red-500 flex-shrink-0"
                    title="Elimina file"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {canAddMore && (
                <p className="text-xs text-muted-foreground">
                  Puoi aggiungere un altro file (fronte/retro)
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Trascina un file qui o clicca per caricare
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canAddMore && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_ACCEPT}
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              {isUploading ? 'Caricamento...' : 'Carica'}
            </Button>
          </>
        )}

        <Badge className={statoConfig.color}>{statoConfig.label}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasFiles && documento.files[0] && (
              <DropdownMenuItem asChild>
                <a href={documento.files[0].url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizza file
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'richiesto')}>
              <Clock className="h-4 w-4 mr-2" />
              Segna come Richiesto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'ricevuto')}>
              <Check className="h-4 w-4 mr-2" />
              Segna come Ricevuto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'verificato')}>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Segna come Verificato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCambiaStato(documento.id, 'mancante')}>
              <X className="h-4 w-4 mr-2" />
              Segna come Mancante
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
