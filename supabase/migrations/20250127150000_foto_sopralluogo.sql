-- Migration: Foto proprietà + campi sopralluogo
-- Aggiunge tabella foto_proprieta, campi sopralluogo su proprieta, bucket storage

-- ============================================================================
-- 1. CAMPI SOPRALLUOGO su proprieta
-- ============================================================================

ALTER TABLE proprieta ADD COLUMN IF NOT EXISTS data_sopralluogo DATE;
ALTER TABLE proprieta ADD COLUMN IF NOT EXISTS stato_sopralluogo VARCHAR(20) DEFAULT 'da_programmare';
ALTER TABLE proprieta ADD COLUMN IF NOT EXISTS note_sopralluogo TEXT;

-- Check constraint separato per compatibilità
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'proprieta_stato_sopralluogo_check'
  ) THEN
    ALTER TABLE proprieta ADD CONSTRAINT proprieta_stato_sopralluogo_check
      CHECK (stato_sopralluogo IN ('da_programmare', 'programmato', 'effettuato'));
  END IF;
END $$;

-- ============================================================================
-- 2. TABELLA foto_proprieta
-- ============================================================================

CREATE TABLE IF NOT EXISTS foto_proprieta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  proprieta_id UUID NOT NULL REFERENCES proprieta(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  categoria VARCHAR(50),
  note TEXT,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foto_proprieta_proprieta ON foto_proprieta(proprieta_id);

-- RLS
ALTER TABLE foto_proprieta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foto_proprieta_allow_all" ON foto_proprieta
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. STORAGE BUCKET foto-proprieta
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'foto-proprieta',
  'foto-proprieta',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS policies
CREATE POLICY "foto_proprieta_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'foto-proprieta');

CREATE POLICY "foto_proprieta_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'foto-proprieta');

CREATE POLICY "foto_proprieta_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'foto-proprieta');

CREATE POLICY "foto_proprieta_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'foto-proprieta');
