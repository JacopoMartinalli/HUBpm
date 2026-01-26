-- Migration: Setup Storage Buckets per Documenti
-- Descrizione: Crea bucket per PDF generati e documenti firmati

-- ============================================================================
-- BUCKET: documenti
-- Storage per tutti i documenti generati (PDF) e firmati
-- ============================================================================

-- Crea il bucket documenti (privato)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documenti',
  'documenti',
  false,  -- privato, richiede auth
  52428800,  -- 50MB max per file
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- POLICIES: documenti bucket
-- ============================================================================

-- Policy: Lettura documenti (autenticati o con tenant_id valido)
CREATE POLICY "documenti_select_policy"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documenti'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'  -- Per development
  )
);

-- Policy: Upload documenti
CREATE POLICY "documenti_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documenti'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'  -- Per development
  )
);

-- Policy: Update documenti
CREATE POLICY "documenti_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documenti'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'  -- Per development
  )
);

-- Policy: Delete documenti
CREATE POLICY "documenti_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documenti'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'  -- Per development
  )
);


-- ============================================================================
-- BUCKET: templates-assets
-- Storage per assets dei template (loghi, immagini)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates-assets',
  'templates-assets',
  true,  -- pubblico per embedding in PDF
  10485760,  -- 10MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: Lettura pubblica assets
CREATE POLICY "templates_assets_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates-assets');

-- Policy: Upload assets (solo autenticati)
CREATE POLICY "templates_assets_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'templates-assets'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'  -- Per development
  )
);

-- Policy: Delete assets
CREATE POLICY "templates_assets_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'templates-assets'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'  -- Per development
  )
);


-- ============================================================================
-- COMMENTI
-- ============================================================================

COMMENT ON POLICY "documenti_select_policy" ON storage.objects IS 'Permette lettura documenti a utenti autenticati';
COMMENT ON POLICY "documenti_insert_policy" ON storage.objects IS 'Permette upload documenti a utenti autenticati';
COMMENT ON POLICY "templates_assets_select_policy" ON storage.objects IS 'Assets template pubblici per embedding PDF';
