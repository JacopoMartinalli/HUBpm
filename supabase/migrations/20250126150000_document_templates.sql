-- Migration: Document Templates e Documenti Generati
-- Descrizione: Sistema template documenti dinamici con tracking firma

-- ============================================================================
-- TABELLA: document_templates
-- Template documenti editabili con TipTap
-- ============================================================================

CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Identificazione
  nome VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
    'preventivo', 'proposta', 'contratto', 'privacy', 'mandato', 'lettera', 'report'
  )),

  -- Contenuto TipTap (JSON)
  contenuto JSONB NOT NULL DEFAULT '{}',
  contenuto_html TEXT, -- Cache HTML per preview veloce

  -- Configurazione
  variabili_utilizzate TEXT[] DEFAULT '{}', -- Lista variabili usate nel template
  formato_pagina VARCHAR(10) DEFAULT 'A4' CHECK (formato_pagina IN ('A4', 'Letter')),
  orientamento VARCHAR(20) DEFAULT 'portrait' CHECK (orientamento IN ('portrait', 'landscape')),
  margini JSONB DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}',

  -- Stili
  stili_custom JSONB DEFAULT '{}', -- CSS custom per il template

  -- Stato
  attivo BOOLEAN DEFAULT TRUE,
  predefinito BOOLEAN DEFAULT FALSE, -- Template default per categoria
  versione INTEGER DEFAULT 1,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Indici
CREATE INDEX idx_document_templates_tenant ON document_templates(tenant_id);
CREATE INDEX idx_document_templates_categoria ON document_templates(categoria);
CREATE INDEX idx_document_templates_attivo ON document_templates(attivo) WHERE attivo = TRUE;

-- Trigger updated_at
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_templates_tenant_isolation" ON document_templates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Policy permissiva per development
CREATE POLICY "document_templates_allow_all" ON document_templates
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- TABELLA: documenti_generati
-- Documenti PDF generati con tracking stato e firma
-- ============================================================================

CREATE TABLE documenti_generati (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Template usato
  template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  template_nome VARCHAR(200), -- Snapshot nome template
  template_versione INTEGER, -- Snapshot versione

  -- Riferimenti entità (uno o più possono essere valorizzati)
  contatto_id UUID REFERENCES contatti(id) ON DELETE SET NULL,
  proprieta_id UUID REFERENCES proprieta(id) ON DELETE SET NULL,
  proposta_id UUID REFERENCES proposte_commerciali(id) ON DELETE SET NULL,

  -- Dati documento
  numero VARCHAR(50), -- Numero documento (es. DOC-2025-0001)
  titolo VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
    'preventivo', 'proposta', 'contratto', 'privacy', 'mandato', 'lettera', 'report'
  )),

  -- File generato
  file_url TEXT, -- URL Supabase Storage
  file_nome VARCHAR(255),
  file_size INTEGER, -- bytes

  -- Snapshot dati usati per generazione (per storico)
  dati_snapshot JSONB DEFAULT '{}',

  -- Stati e tracking firma
  stato VARCHAR(30) DEFAULT 'generato' CHECK (stato IN (
    'generato', 'inviato', 'visto', 'firmato', 'archiviato', 'scaduto', 'annullato'
  )),

  data_generazione TIMESTAMPTZ DEFAULT NOW(),
  data_invio TIMESTAMPTZ,
  data_visualizzazione TIMESTAMPTZ,
  data_firma TIMESTAMPTZ,
  data_scadenza DATE,

  -- Documento firmato (upload cliente)
  file_firmato_url TEXT,
  file_firmato_nome VARCHAR(255),
  firmato_da VARCHAR(200), -- Nome di chi ha firmato
  metodo_firma VARCHAR(50) CHECK (metodo_firma IN ('manuale', 'digitale', 'otp')),

  -- Note
  note TEXT,
  note_interne TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Indici
CREATE INDEX idx_documenti_generati_tenant ON documenti_generati(tenant_id);
CREATE INDEX idx_documenti_generati_contatto ON documenti_generati(contatto_id);
CREATE INDEX idx_documenti_generati_proprieta ON documenti_generati(proprieta_id);
CREATE INDEX idx_documenti_generati_proposta ON documenti_generati(proposta_id);
CREATE INDEX idx_documenti_generati_stato ON documenti_generati(stato);
CREATE INDEX idx_documenti_generati_categoria ON documenti_generati(categoria);
CREATE INDEX idx_documenti_generati_data ON documenti_generati(data_generazione DESC);

-- Trigger updated_at
CREATE TRIGGER update_documenti_generati_updated_at
  BEFORE UPDATE ON documenti_generati
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE documenti_generati ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documenti_generati_tenant_isolation" ON documenti_generati
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Policy permissiva per development
CREATE POLICY "documenti_generati_allow_all" ON documenti_generati
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- FUNZIONE: generate_numero_documento
-- Genera numero progressivo documento per anno
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_numero_documento(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_anno INTEGER;
  v_count INTEGER;
  v_numero VARCHAR(50);
BEGIN
  v_anno := EXTRACT(YEAR FROM CURRENT_DATE);

  SELECT COUNT(*) + 1 INTO v_count
  FROM documenti_generati
  WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM created_at) = v_anno;

  v_numero := 'DOC-' || v_anno || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- FUNZIONE: set_documento_numero
-- Trigger per auto-generare numero documento
-- ============================================================================

CREATE OR REPLACE FUNCTION set_documento_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := generate_numero_documento(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_documento_numero
  BEFORE INSERT ON documenti_generati
  FOR EACH ROW
  EXECUTE FUNCTION set_documento_numero();


-- ============================================================================
-- VINCOLO: Un solo template predefinito per categoria/tenant
-- ============================================================================

CREATE UNIQUE INDEX idx_document_templates_predefinito_unico
  ON document_templates(tenant_id, categoria)
  WHERE predefinito = TRUE;


-- ============================================================================
-- COMMENTI
-- ============================================================================

COMMENT ON TABLE document_templates IS 'Template documenti editabili con TipTap editor';
COMMENT ON TABLE documenti_generati IS 'Documenti PDF generati con tracking stato e firma';

COMMENT ON COLUMN document_templates.contenuto IS 'Struttura JSON TipTap del documento';
COMMENT ON COLUMN document_templates.contenuto_html IS 'Cache HTML renderizzato per preview';
COMMENT ON COLUMN document_templates.variabili_utilizzate IS 'Array di variabili usate nel template per validazione';
COMMENT ON COLUMN document_templates.predefinito IS 'Se true, è il template default per la categoria';

COMMENT ON COLUMN documenti_generati.dati_snapshot IS 'Snapshot JSON dei dati usati al momento della generazione';
COMMENT ON COLUMN documenti_generati.stato IS 'Workflow: generato -> inviato -> visto -> firmato -> archiviato';
COMMENT ON COLUMN documenti_generati.file_firmato_url IS 'URL del documento firmato caricato dal cliente';
