'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload,
  Trash2,
  X,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import { CATEGORIE_FOTO } from '@/constants'
import type { CategoriaFoto } from '@/types/database'

interface FotoItem {
  id: string
  url: string
  file_name: string
  storage_path: string
  categoria: CategoriaFoto | null
  created_at: string
}

interface FotoProprietaGalleryProps {
  proprietaId: string
}

export function FotoProprietaGallery({ proprietaId }: FotoProprietaGalleryProps) {
  const [foto, setFoto] = useState<FotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFoto = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('foto_proprieta')
        .select('id, url, file_name, storage_path, categoria, created_at')
        .eq('proprieta_id', proprietaId)
        .order('ordine')

      if (error) throw error
      setFoto(data || [])
    } catch (err) {
      console.error('Errore caricamento foto:', err)
    } finally {
      setLoading(false)
    }
  }, [proprietaId])

  useEffect(() => {
    loadFoto()
  }, [loadFoto])

  const handleUpload = async (files: FileList) => {
    try {
      setUploading(true)
      const newFoto: FotoItem[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue

        const ext = file.name.split('.').pop()
        const fileId = crypto.randomUUID()
        const storagePath = `${proprietaId}/${fileId}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('foto-proprieta')
          .upload(storagePath, file, { upsert: true })

        if (uploadError) {
          console.error('Errore upload foto:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('foto-proprieta')
          .getPublicUrl(storagePath)

        const { data: inserted, error: insertError } = await supabase
          .from('foto_proprieta')
          .insert({
            tenant_id: DEFAULT_TENANT_ID,
            proprieta_id: proprietaId,
            url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            storage_path: storagePath,
            ordine: foto.length + i,
          })
          .select('id, url, file_name, storage_path, categoria, created_at')
          .single()

        if (insertError) {
          console.error('Errore inserimento foto:', insertError)
          continue
        }

        if (inserted) newFoto.push(inserted)
      }

      setFoto(prev => [...prev, ...newFoto])
    } catch (err) {
      console.error('Errore upload:', err)
      alert('Errore nel caricamento delle foto')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fotoId: string, storagePath: string) => {
    try {
      await supabase.storage.from('foto-proprieta').remove([storagePath])
      const { error } = await supabase.from('foto_proprieta').delete().eq('id', fotoId)
      if (error) throw error
      setFoto(prev => prev.filter(f => f.id !== fotoId))
      if (lightboxIndex !== null) setLightboxIndex(null)
    } catch (err) {
      console.error('Errore eliminazione:', err)
      alert('Errore nell\'eliminazione della foto')
    }
  }

  const handleCategoriaChange = async (fotoId: string, categoria: string) => {
    const { error } = await supabase
      .from('foto_proprieta')
      .update({ categoria })
      .eq('id', fotoId)

    if (!error) {
      setFoto(prev => prev.map(f =>
        f.id === fotoId ? { ...f, categoria: categoria as CategoriaFoto } : f
      ))
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }, [foto.length, proprietaId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Caricamento foto...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Foto proprietà ({foto.length})
            </CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                {uploading ? 'Caricamento...' : 'Carica foto'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {foto.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver ? 'border-blue-400 bg-blue-50' : 'border-muted hover:border-muted-foreground/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Trascina le foto qui o clicca per caricare
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP, HEIC
              </p>
            </div>
          ) : (
            <div
              className={`transition-colors rounded-lg ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {foto.map((f, index) => (
                  <div
                    key={f.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={f.url}
                      alt={f.file_name}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                    {/* Categoria badge */}
                    {f.categoria && (
                      <Badge className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0 bg-black/60 text-white border-0">
                        {CATEGORIE_FOTO.find(c => c.id === f.categoria)?.label || f.categoria}
                      </Badge>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(f.id, f.storage_path)
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {/* Categoria select on hover */}
                    <div
                      className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={f.categoria || ''}
                        onValueChange={(val) => handleCategoriaChange(f.id, val)}
                      >
                        <SelectTrigger className="h-6 text-[10px] bg-black/60 text-white border-0">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIE_FOTO.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxIndex !== null && foto[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex - 1)
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={foto[lightboxIndex].url}
            alt={foto[lightboxIndex].file_name}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {lightboxIndex < foto.length - 1 && (
            <button
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex + 1)
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Info bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 rounded-lg px-4 py-2">
            <span className="text-white text-sm">{foto[lightboxIndex].file_name}</span>
            <span className="text-white/60 text-xs">{lightboxIndex + 1}/{foto.length}</span>
            <button
              className="p-1 rounded hover:bg-red-600 text-white/80 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(foto[lightboxIndex].id, foto[lightboxIndex].storage_path)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
