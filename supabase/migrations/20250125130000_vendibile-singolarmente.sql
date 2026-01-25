-- ============================================
-- MIGRAZIONE: Vendibile Singolarmente
-- ============================================
-- Aggiunge il campo per indicare se un servizio
-- può essere venduto singolarmente o solo in pacchetto
-- ============================================

-- Aggiungi colonna vendibile_singolarmente
ALTER TABLE catalogo_servizi
  ADD COLUMN IF NOT EXISTS vendibile_singolarmente BOOLEAN DEFAULT TRUE;

-- Commento sulla colonna
COMMENT ON COLUMN catalogo_servizi.vendibile_singolarmente IS
  'Se FALSE, il servizio può essere venduto solo come parte di un pacchetto';

-- ============================================
-- AGGIORNA SERVIZI ESISTENTI
-- ============================================
-- I servizi nelle categorie "Pratiche Burocratiche"
-- tipicamente non sono vendibili singolarmente

-- Imposta vendibile_singolarmente = FALSE per i servizi
-- che fanno parte di pacchetti specifici (es. Avvio Attività)

-- Servizi del pacchetto "Avvio Attività Legale Completo"
UPDATE catalogo_servizi
SET vendibile_singolarmente = FALSE
WHERE tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND nome IN (
    'Pratica SCIA',
    'Registrazione Questura (Alloggiati Web)',
    'Iscrizione ISTAT',
    'Comunicazione Tassa di Soggiorno',
    'Contratto di Gestione'
  );

-- Servizi del pacchetto "Rinnovo Annuale Pratiche"
UPDATE catalogo_servizi
SET vendibile_singolarmente = FALSE
WHERE tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND nome IN (
    'Rinnovo SCIA Annuale',
    'Verifica Conformità Normativa',
    'Aggiornamento Documentazione'
  );

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
