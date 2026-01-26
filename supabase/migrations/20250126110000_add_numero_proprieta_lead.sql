-- ============================================
-- Aggiunge campo numero_proprieta ai lead
-- Per tracciare quante proprietà ha il lead
-- ============================================

-- Aggiungi colonna numero_proprieta con default 1
ALTER TABLE contatti
ADD COLUMN IF NOT EXISTS numero_proprieta INTEGER DEFAULT 1;

-- Commento per documentazione
COMMENT ON COLUMN contatti.numero_proprieta IS 'Numero di proprietà dichiarate dal lead durante la chiamata qualificativa';
