-- ============================================
-- CAMPI SOCIETÀ PER CONTATTI
-- ============================================
-- Per persona_giuridica:
-- - ragione_sociale: nome della società
-- - Legale rappresentante: nome, cognome, CF (per pratiche)
-- - Referente: nome, cognome, email, telefono, ruolo (contatto operativo)

ALTER TABLE contatti
  ADD COLUMN IF NOT EXISTS ragione_sociale VARCHAR(200),
  ADD COLUMN IF NOT EXISTS legale_rapp_nome VARCHAR(100),
  ADD COLUMN IF NOT EXISTS legale_rapp_cognome VARCHAR(100),
  ADD COLUMN IF NOT EXISTS legale_rapp_codice_fiscale VARCHAR(16),
  ADD COLUMN IF NOT EXISTS referente_nome VARCHAR(100),
  ADD COLUMN IF NOT EXISTS referente_cognome VARCHAR(100),
  ADD COLUMN IF NOT EXISTS referente_email VARCHAR(200),
  ADD COLUMN IF NOT EXISTS referente_telefono VARCHAR(30),
  ADD COLUMN IF NOT EXISTS referente_ruolo VARCHAR(100);
