-- Migration: Aggiunge supporto multi-file ai documenti
-- Colonna files JSONB per array di file [{url, name, size, storage_path, uploaded_at}]
-- Migra dati esistenti da file_url/file_name/file_size

-- Aggiungi colonna files
ALTER TABLE documenti ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]';

-- Migra dati esistenti
UPDATE documenti
SET files = jsonb_build_array(
  jsonb_build_object(
    'url', file_url,
    'name', file_name,
    'size', COALESCE(file_size, 0),
    'storage_path', '',
    'uploaded_at', COALESCE(data_caricamento, NOW())
  )
)
WHERE file_url IS NOT NULL AND file_url != '';
