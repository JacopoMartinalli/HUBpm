-- Migration: Fix categorie template documenti
-- Descrizione: Allinea le categorie del database con quelle definite nel frontend
-- Le nuove categorie sono: preventivo, proposta, mandato_pf, mandato_pg, procura, elenco_dotazioni, report_mensile

-- ============================================================================
-- AGGIORNA CHECK CONSTRAINT SU document_templates
-- ============================================================================

-- Rimuovi il vecchio constraint
ALTER TABLE document_templates
DROP CONSTRAINT IF EXISTS document_templates_categoria_check;

-- Aggiungi il nuovo constraint con le categorie corrette
ALTER TABLE document_templates
ADD CONSTRAINT document_templates_categoria_check
CHECK (categoria IN (
  'preventivo',
  'proposta',
  'mandato_pf',
  'mandato_pg',
  'procura',
  'elenco_dotazioni',
  'report_mensile'
));

-- ============================================================================
-- AGGIORNA CHECK CONSTRAINT SU documenti_generati
-- ============================================================================

-- Rimuovi il vecchio constraint
ALTER TABLE documenti_generati
DROP CONSTRAINT IF EXISTS documenti_generati_categoria_check;

-- Aggiungi il nuovo constraint con le categorie corrette
ALTER TABLE documenti_generati
ADD CONSTRAINT documenti_generati_categoria_check
CHECK (categoria IN (
  'preventivo',
  'proposta',
  'mandato_pf',
  'mandato_pg',
  'procura',
  'elenco_dotazioni',
  'report_mensile'
));

-- ============================================================================
-- AGGIORNA FORMATO PAGINA (aggiungi A5 se mancante)
-- ============================================================================

ALTER TABLE document_templates
DROP CONSTRAINT IF EXISTS document_templates_formato_pagina_check;

ALTER TABLE document_templates
ADD CONSTRAINT document_templates_formato_pagina_check
CHECK (formato_pagina IN ('A4', 'A5', 'Letter'));
