-- ============================================
-- 1. LEAD: Data prossimo follow-up
-- ============================================
ALTER TABLE contatti
  ADD COLUMN IF NOT EXISTS data_prossimo_followup DATE;

-- ============================================
-- 2. STORICO INTERAZIONI (log chiamate/messaggi)
-- ============================================
CREATE TABLE IF NOT EXISTS interazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('chiamata', 'email', 'messaggio', 'incontro', 'nota')),
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  esito VARCHAR(30) CHECK (esito IN ('risposto', 'non_risposto', 'occupato', 'richiamato', 'inviato', 'ricevuto', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE interazioni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all interazioni" ON interazioni FOR ALL USING (true) WITH CHECK (true);

-- Indice per lookup veloce
CREATE INDEX IF NOT EXISTS idx_interazioni_contatto ON interazioni(contatto_id, data DESC);

-- ============================================
-- 3. SICUREZZA PROPRIETÀ (dotazioni a norma)
-- ============================================
ALTER TABLE proprieta
  ADD COLUMN IF NOT EXISTS sicurezza_estintore BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sicurezza_estintore_scadenza DATE,
  ADD COLUMN IF NOT EXISTS sicurezza_targhetta BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sicurezza_rilevatore_gas BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sicurezza_rilevatore_gas_necessario BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sicurezza_rilevatore_monossido BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sicurezza_cassetta_ps BOOLEAN DEFAULT FALSE;
