-- ============================================
-- TABELLA PROPERTY MANAGER
-- ============================================

CREATE TABLE IF NOT EXISTS property_manager (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL UNIQUE, -- Un solo record per tenant
  -- Dati Aziendali
  ragione_sociale VARCHAR(255) NOT NULL,
  nome_commerciale VARCHAR(255),
  partita_iva VARCHAR(20),
  codice_fiscale VARCHAR(20),
  codice_sdi VARCHAR(10),
  pec VARCHAR(255),
  -- Indirizzo
  indirizzo TEXT,
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(5),
  -- Contatti
  email VARCHAR(255),
  telefono VARCHAR(50),
  cellulare VARCHAR(50),
  sito_web VARCHAR(255),
  -- Social
  instagram VARCHAR(100),
  facebook VARCHAR(255),
  linkedin VARCHAR(255),
  -- Referente
  referente_nome VARCHAR(100),
  referente_cognome VARCHAR(100),
  referente_ruolo VARCHAR(100),
  referente_email VARCHAR(255),
  referente_telefono VARCHAR(50),
  -- Dati Bancari
  banca VARCHAR(100),
  iban VARCHAR(50),
  swift VARCHAR(20),
  intestatario_conto VARCHAR(255),
  -- Branding
  logo_url TEXT,
  colore_primario VARCHAR(10),
  -- Note
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_property_manager_tenant ON property_manager(tenant_id);

-- RLS
ALTER TABLE property_manager ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for development" ON property_manager FOR ALL USING (true) WITH CHECK (true);

-- Trigger per updated_at
CREATE TRIGGER update_property_manager_updated_at
  BEFORE UPDATE ON property_manager
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
