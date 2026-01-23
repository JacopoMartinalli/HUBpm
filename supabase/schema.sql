-- ============================================
-- HUB PROPERTY MANAGEMENT - DATABASE SCHEMA
-- ============================================
-- Esegui questo script nel SQL Editor di Supabase

-- Abilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELLA CONTATTI (Lead, Clienti, Partner)
-- ============================================
CREATE TABLE IF NOT EXISTS contatti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('lead', 'cliente', 'partner')),
  tipo_persona VARCHAR(20) CHECK (tipo_persona IN ('persona_fisica', 'persona_giuridica')),
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  codice_fiscale VARCHAR(20),
  partita_iva VARCHAR(20),
  indirizzo TEXT,
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(5),
  -- Lead fields
  fase_lead VARCHAR(5) CHECK (fase_lead IN ('L0', 'L1', 'L2', 'L3', 'L4')),
  esito_lead VARCHAR(20) CHECK (esito_lead IN ('in_corso', 'vinto', 'perso')),
  fonte_lead VARCHAR(50),
  valore_stimato DECIMAL(12,2),
  motivo_perso TEXT,
  -- Cliente fields
  fase_cliente VARCHAR(5) CHECK (fase_cliente IN ('C0', 'C1', 'C2', 'C3')),
  data_conversione DATE,
  data_inizio_contratto DATE,
  data_fine_contratto DATE,
  -- Partner fields
  tipo_partner VARCHAR(30) CHECK (tipo_partner IN ('pulizie', 'manutenzione', 'elettricista', 'idraulico', 'fotografo', 'commercialista', 'avvocato', 'notaio', 'altro')),
  azienda VARCHAR(200),
  specializzazioni TEXT,
  tariffa_default DECIMAL(10,2),
  tariffa_tipo VARCHAR(20) CHECK (tariffa_tipo IN ('oraria', 'a_chiamata', 'mensile', 'per_intervento')),
  -- Common
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index per tenant e tipo
CREATE INDEX idx_contatti_tenant_tipo ON contatti(tenant_id, tipo);
CREATE INDEX idx_contatti_fase_lead ON contatti(tenant_id, fase_lead) WHERE tipo = 'lead';
CREATE INDEX idx_contatti_fase_cliente ON contatti(tenant_id, fase_cliente) WHERE tipo = 'cliente';

-- ============================================
-- TABELLA PROPRIETA LEAD
-- ============================================
CREATE TABLE IF NOT EXISTS proprieta_lead (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  indirizzo TEXT NOT NULL,
  citta VARCHAR(100) NOT NULL,
  cap VARCHAR(10),
  provincia VARCHAR(5),
  tipologia VARCHAR(30) CHECK (tipologia IN ('appartamento', 'villa', 'chalet', 'mansarda', 'monolocale', 'bilocale', 'trilocale', 'casa_vacanze', 'altro')),
  fase VARCHAR(5) NOT NULL DEFAULT 'PL0' CHECK (fase IN ('PL0', 'PL1', 'PL2', 'PL3', 'PL4')),
  esito VARCHAR(20) CHECK (esito IN ('in_corso', 'confermato', 'scartato')),
  motivo_scartato TEXT,
  data_sopralluogo DATE,
  revenue_stimato_annuo DECIMAL(12,2),
  investimento_richiesto DECIMAL(12,2),
  note_sopralluogo TEXT,
  commissione_proposta DECIMAL(5,2),
  servizi_proposti TEXT,
  data_proposta DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proprieta_lead_tenant ON proprieta_lead(tenant_id);
CREATE INDEX idx_proprieta_lead_contatto ON proprieta_lead(contatto_id);
CREATE INDEX idx_proprieta_lead_fase ON proprieta_lead(tenant_id, fase);

-- ============================================
-- TABELLA PROPRIETA
-- ============================================
CREATE TABLE IF NOT EXISTS proprieta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  contatto_id UUID NOT NULL REFERENCES contatti(id),
  proprieta_lead_id UUID REFERENCES proprieta_lead(id),
  nome VARCHAR(200) NOT NULL,
  indirizzo TEXT NOT NULL,
  citta VARCHAR(100) NOT NULL,
  cap VARCHAR(10),
  provincia VARCHAR(5),
  tipologia VARCHAR(30) NOT NULL CHECK (tipologia IN ('appartamento', 'villa', 'chalet', 'mansarda', 'monolocale', 'bilocale', 'trilocale', 'casa_vacanze', 'altro')),
  fase VARCHAR(5) NOT NULL DEFAULT 'P0' CHECK (fase IN ('P0', 'P1', 'P2', 'P3', 'P4', 'P5')),
  commissione_percentuale DECIMAL(5,2) NOT NULL DEFAULT 20,
  -- Catastali
  foglio VARCHAR(20),
  mappale VARCHAR(20),
  subalterno VARCHAR(20),
  categoria_catastale VARCHAR(10),
  rendita_catastale DECIMAL(10,2),
  -- Codici STR
  cir VARCHAR(50),
  cin VARCHAR(50),
  scia_protocollo VARCHAR(50),
  scia_data DATE,
  alloggiati_web_attivo BOOLEAN DEFAULT FALSE,
  ross1000_attivo BOOLEAN DEFAULT FALSE,
  -- Strutturali
  max_ospiti INTEGER,
  camere INTEGER,
  bagni INTEGER,
  mq INTEGER,
  piano VARCHAR(20),
  -- Costi
  costo_pulizie DECIMAL(10,2),
  tassa_soggiorno_persona DECIMAL(6,2),
  -- Channel Manager
  channel_manager VARCHAR(50),
  id_channel_manager VARCHAR(100),
  -- Operativi
  wifi_ssid VARCHAR(100),
  wifi_password VARCHAR(100),
  codice_portone VARCHAR(50),
  codice_appartamento VARCHAR(50),
  istruzioni_accesso TEXT,
  checkin_orario VARCHAR(10) DEFAULT '15:00',
  checkout_orario VARCHAR(10) DEFAULT '10:00',
  regole_casa TEXT,
  smaltimento_rifiuti TEXT,
  parcheggio TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proprieta_tenant ON proprieta(tenant_id);
CREATE INDEX idx_proprieta_contatto ON proprieta(contatto_id);
CREATE INDEX idx_proprieta_fase ON proprieta(tenant_id, fase);

-- ============================================
-- TABELLA LOCALI
-- ============================================
CREATE TABLE IF NOT EXISTS locali (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  proprieta_id UUID NOT NULL REFERENCES proprieta(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('camera_matrimoniale', 'camera_singola', 'camera_doppia', 'soggiorno', 'cucina', 'bagno', 'ripostiglio', 'balcone', 'terrazzo', 'giardino', 'garage', 'posto_auto', 'cantina', 'altro')),
  nome VARCHAR(100) NOT NULL,
  mq INTEGER,
  posti_letto INTEGER,
  dotazioni TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locali_proprieta ON locali(proprieta_id);

-- ============================================
-- TABELLA ASSET
-- ============================================
CREATE TABLE IF NOT EXISTS asset (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  proprieta_id UUID NOT NULL REFERENCES proprieta(id) ON DELETE CASCADE,
  locale_id UUID REFERENCES locali(id) ON DELETE SET NULL,
  nome VARCHAR(200) NOT NULL,
  categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('elettrodomestico', 'arredo', 'biancheria', 'stoviglie', 'elettronica', 'decorazione', 'altro')),
  quantita INTEGER NOT NULL DEFAULT 1,
  attributi JSONB DEFAULT '{}',
  foto_url TEXT,
  scontrino_url TEXT,
  manuale_url TEXT,
  data_acquisto DATE,
  costo DECIMAL(10,2),
  fornitore VARCHAR(200),
  garanzia_scadenza DATE,
  stato VARCHAR(20) NOT NULL DEFAULT 'buono' CHECK (stato IN ('nuovo', 'buono', 'usato', 'da_sostituire', 'dismesso')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asset_proprieta ON asset(proprieta_id);
CREATE INDEX idx_asset_locale ON asset(locale_id);

-- ============================================
-- TABELLA PARTNER-PROPRIETA (Assegnazioni)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_proprieta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  partner_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
  proprieta_id UUID NOT NULL REFERENCES proprieta(id) ON DELETE CASCADE,
  ruolo VARCHAR(50) NOT NULL,
  priorita INTEGER DEFAULT 1,
  attivo BOOLEAN DEFAULT TRUE,
  tariffa DECIMAL(10,2),
  tariffa_tipo VARCHAR(20) CHECK (tariffa_tipo IN ('oraria', 'a_chiamata', 'mensile', 'per_intervento')),
  contratto_url TEXT,
  contratto_scadenza DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, proprieta_id, ruolo)
);

CREATE INDEX idx_partner_proprieta_partner ON partner_proprieta(partner_id);
CREATE INDEX idx_partner_proprieta_proprieta ON partner_proprieta(proprieta_id);

-- ============================================
-- TABELLA TEMPLATE DOCUMENTI
-- ============================================
CREATE TABLE IF NOT EXISTS template_documenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  tipo_entita VARCHAR(20) NOT NULL CHECK (tipo_entita IN ('cliente', 'proprieta')),
  fase VARCHAR(5) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('identita', 'fiscale', 'proprieta', 'certificazioni', 'contratti', 'procure', 'legale', 'operativo', 'marketing')),
  obbligatorio BOOLEAN DEFAULT FALSE,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template_documenti_entita ON template_documenti(tenant_id, tipo_entita, fase);

-- ============================================
-- TABELLA DOCUMENTI
-- ============================================
CREATE TABLE IF NOT EXISTS documenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES template_documenti(id),
  contatto_id UUID REFERENCES contatti(id) ON DELETE CASCADE,
  proprieta_id UUID REFERENCES proprieta(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('identita', 'fiscale', 'proprieta', 'certificazioni', 'contratti', 'procure', 'legale', 'operativo', 'marketing')),
  stato VARCHAR(20) NOT NULL DEFAULT 'mancante' CHECK (stato IN ('mancante', 'richiesto', 'ricevuto', 'verificato', 'scaduto')),
  obbligatorio BOOLEAN DEFAULT FALSE,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  data_scadenza DATE,
  data_caricamento TIMESTAMPTZ,
  data_verifica TIMESTAMPTZ,
  verificato_da UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documenti_contatto ON documenti(contatto_id);
CREATE INDEX idx_documenti_proprieta ON documenti(proprieta_id);

-- ============================================
-- TABELLA CATALOGO SERVIZI
-- ============================================
CREATE TABLE IF NOT EXISTS catalogo_servizi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descrizione TEXT,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('one_shot', 'ricorrente')),
  prezzo_base DECIMAL(10,2),
  prezzo_tipo VARCHAR(20) CHECK (prezzo_tipo IN ('fisso', 'percentuale', 'da_quotare')),
  fase_applicabile VARCHAR(10),
  attivo BOOLEAN DEFAULT TRUE,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_catalogo_servizi_tenant ON catalogo_servizi(tenant_id);

-- ============================================
-- TABELLA SERVIZI VENDUTI
-- ============================================
CREATE TABLE IF NOT EXISTS servizi_venduti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  servizio_id UUID NOT NULL REFERENCES catalogo_servizi(id),
  contatto_id UUID NOT NULL REFERENCES contatti(id),
  proprieta_id UUID REFERENCES proprieta(id),
  prezzo DECIMAL(10,2) NOT NULL,
  prezzo_tipo VARCHAR(20) NOT NULL CHECK (prezzo_tipo IN ('fisso', 'percentuale', 'da_quotare')),
  stato VARCHAR(20) NOT NULL DEFAULT 'da_iniziare' CHECK (stato IN ('da_iniziare', 'in_corso', 'completato', 'annullato')),
  data_vendita DATE NOT NULL DEFAULT CURRENT_DATE,
  data_inizio DATE,
  data_completamento DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_servizi_venduti_contatto ON servizi_venduti(contatto_id);
CREATE INDEX idx_servizi_venduti_proprieta ON servizi_venduti(proprieta_id);

-- ============================================
-- TABELLA TEMPLATE TASK
-- ============================================
CREATE TABLE IF NOT EXISTS template_task (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  tipo_entita VARCHAR(20) NOT NULL CHECK (tipo_entita IN ('lead', 'proprieta_lead', 'cliente', 'proprieta')),
  fase VARCHAR(5) NOT NULL,
  titolo VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(30) CHECK (categoria IN ('documenti', 'pratiche', 'comunicazioni', 'setup', 'verifica', 'altro')),
  ordine INTEGER DEFAULT 0,
  giorni_deadline INTEGER,
  prerequisito_id UUID REFERENCES template_task(id),
  attivo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template_task_entita ON template_task(tenant_id, tipo_entita, fase);

-- ============================================
-- TABELLA TASK
-- ============================================
CREATE TABLE IF NOT EXISTS task (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES template_task(id),
  contatto_id UUID REFERENCES contatti(id) ON DELETE CASCADE,
  proprieta_id UUID REFERENCES proprieta(id) ON DELETE CASCADE,
  proprieta_lead_id UUID REFERENCES proprieta_lead(id) ON DELETE CASCADE,
  titolo VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(30) CHECK (categoria IN ('documenti', 'pratiche', 'comunicazioni', 'setup', 'verifica', 'altro')),
  stato VARCHAR(20) NOT NULL DEFAULT 'da_fare' CHECK (stato IN ('da_fare', 'in_corso', 'completato', 'bloccato', 'annullato')),
  priorita VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente')),
  data_scadenza DATE,
  data_inizio DATE,
  data_completamento DATE,
  completato_da UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_tenant ON task(tenant_id);
CREATE INDEX idx_task_contatto ON task(contatto_id);
CREATE INDEX idx_task_proprieta ON task(proprieta_id);
CREATE INDEX idx_task_stato ON task(tenant_id, stato);

-- ============================================
-- TABELLA PRENOTAZIONI
-- ============================================
CREATE TABLE IF NOT EXISTS prenotazioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  proprieta_id UUID NOT NULL REFERENCES proprieta(id) ON DELETE CASCADE,
  external_id VARCHAR(100),
  canale VARCHAR(30) CHECK (canale IN ('airbnb', 'booking', 'vrbo', 'direct', 'altro')),
  codice_prenotazione VARCHAR(50),
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  notti INTEGER GENERATED ALWAYS AS (checkout - checkin) STORED,
  ospite_nome VARCHAR(100),
  ospite_cognome VARCHAR(100),
  ospite_email VARCHAR(255),
  ospite_telefono VARCHAR(50),
  ospite_nazione VARCHAR(50),
  num_ospiti INTEGER,
  num_adulti INTEGER,
  num_bambini INTEGER,
  importo_lordo DECIMAL(10,2),
  commissione_ota DECIMAL(10,2),
  importo_netto DECIMAL(10,2),
  costo_pulizie DECIMAL(10,2),
  tassa_soggiorno_totale DECIMAL(10,2),
  stato VARCHAR(20) NOT NULL DEFAULT 'confermata' CHECK (stato IN ('richiesta', 'confermata', 'checkin', 'checkout', 'cancellata', 'no_show')),
  pagato_proprietario BOOLEAN DEFAULT FALSE,
  data_pagamento_proprietario DATE,
  metodo_pagamento_proprietario VARCHAR(50),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prenotazioni_proprieta ON prenotazioni(proprieta_id);
CREATE INDEX idx_prenotazioni_date ON prenotazioni(checkin, checkout);
CREATE INDEX idx_prenotazioni_stato ON prenotazioni(tenant_id, stato);

-- ============================================
-- TABELLA PROPERTY MANAGER (Dati Aziendali PM)
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

CREATE INDEX idx_property_manager_tenant ON property_manager(tenant_id);

-- ============================================
-- TRIGGER PER UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica trigger a tutte le tabelle con updated_at
CREATE TRIGGER update_contatti_updated_at BEFORE UPDATE ON contatti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proprieta_lead_updated_at BEFORE UPDATE ON proprieta_lead FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proprieta_updated_at BEFORE UPDATE ON proprieta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locali_updated_at BEFORE UPDATE ON locali FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_updated_at BEFORE UPDATE ON asset FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_proprieta_updated_at BEFORE UPDATE ON partner_proprieta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documenti_updated_at BEFORE UPDATE ON documenti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servizi_venduti_updated_at BEFORE UPDATE ON servizi_venduti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON task FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prenotazioni_updated_at BEFORE UPDATE ON prenotazioni FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_manager_updated_at BEFORE UPDATE ON property_manager FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Abilita RLS su tutte le tabelle
ALTER TABLE contatti ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprieta_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprieta ENABLE ROW LEVEL SECURITY;
ALTER TABLE locali ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_proprieta ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_documenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE documenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_servizi ENABLE ROW LEVEL SECURITY;
ALTER TABLE servizi_venduti ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE task ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenotazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_manager ENABLE ROW LEVEL SECURITY;

-- Policy per permettere accesso completo (da configurare in produzione con auth)
-- Per ora permettiamo tutto per development
CREATE POLICY "Allow all for development" ON contatti FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON proprieta_lead FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON proprieta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON locali FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON asset FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON partner_proprieta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON template_documenti FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON documenti FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON catalogo_servizi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON servizi_venduti FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON template_task FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON task FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON prenotazioni FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON property_manager FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DATI DI DEFAULT (Tenant di test)
-- ============================================
-- Crea un tenant di default per i test
-- Il tenant_id deve corrispondere a quello in src/lib/supabase.ts
-- DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

-- ============================================
-- FINE SCHEMA
-- ============================================
