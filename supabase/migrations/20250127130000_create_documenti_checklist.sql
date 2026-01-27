-- Migration: Crea tabelle per sistema checklist documenti
-- template_documenti: definisce quali documenti servono per fase
-- documenti: traccia stato raccolta documenti per ogni entità

-- ============================================================================
-- TABELLA: template_documenti
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_documenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  tipo_entita VARCHAR(20) NOT NULL CHECK (tipo_entita IN ('cliente', 'proprieta')),
  fase VARCHAR(10) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(50) NOT NULL,
  obbligatorio BOOLEAN DEFAULT TRUE,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_documenti_lookup
  ON template_documenti(tenant_id, tipo_entita, fase);

-- RLS
ALTER TABLE template_documenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_documenti_allow_all" ON template_documenti
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TABELLA: documenti (checklist per entità)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES template_documenti(id) ON DELETE SET NULL,
  contatto_id UUID REFERENCES contatti(id) ON DELETE CASCADE,
  proprieta_id UUID REFERENCES proprieta(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(50),
  obbligatorio BOOLEAN DEFAULT TRUE,
  stato VARCHAR(20) DEFAULT 'mancante' CHECK (stato IN ('mancante', 'richiesto', 'ricevuto', 'verificato', 'scaduto')),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  data_caricamento TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documenti_contatto ON documenti(contatto_id);
CREATE INDEX IF NOT EXISTS idx_documenti_proprieta ON documenti(proprieta_id);

-- RLS
ALTER TABLE documenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documenti_allow_all" ON documenti
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_documenti_updated_at ON documenti;
CREATE TRIGGER update_documenti_updated_at
  BEFORE UPDATE ON documenti
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED: Template documenti cliente C0
-- ============================================================================

INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cliente', 'C0', 'Codice fiscale', 'Tessera sanitaria o documento con CF', 'fiscale', true, 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cliente', 'C0', 'Documento identità', 'Carta identità o passaporto valido', 'identita', true, 2),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cliente', 'C0', 'Privacy firmata', 'Informativa privacy e consenso trattamento dati firmato', 'contratti', true, 3);
