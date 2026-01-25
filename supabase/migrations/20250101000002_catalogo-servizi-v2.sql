-- ============================================
-- MIGRAZIONE: Catalogo Servizi v2
-- Aggiunge: Categorie, Pacchetti, Campi aggiuntivi
-- ============================================

-- ============================================
-- TABELLA CATEGORIE SERVIZI
-- ============================================
CREATE TABLE IF NOT EXISTS categorie_servizi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,
  colore VARCHAR(20) DEFAULT '#6366f1', -- Colore per UI (hex)
  icona VARCHAR(50), -- Nome icona (es: 'camera', 'settings', 'file-text')
  ordine INTEGER DEFAULT 0,
  predefinita BOOLEAN DEFAULT FALSE, -- Se true, categoria di sistema non eliminabile
  attiva BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categorie_servizi_tenant ON categorie_servizi(tenant_id);

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_categorie_servizi_updated_at ON categorie_servizi;
CREATE TRIGGER update_categorie_servizi_updated_at
  BEFORE UPDATE ON categorie_servizi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE categorie_servizi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON categorie_servizi;
CREATE POLICY "Allow all for development" ON categorie_servizi FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- AGGIORNA TABELLA CATALOGO_SERVIZI
-- Aggiunge nuovi campi
-- ============================================

-- Aggiungi riferimento a categoria
ALTER TABLE catalogo_servizi
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorie_servizi(id) ON DELETE SET NULL;

-- Campi aggiuntivi richiesti (livello "Completo")
ALTER TABLE catalogo_servizi
  ADD COLUMN IF NOT EXISTS durata_stimata_ore DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS durata_stimata_giorni INTEGER,
  ADD COLUMN IF NOT EXISTS note_interne TEXT,
  ADD COLUMN IF NOT EXISTS documenti_richiesti TEXT[], -- Array di nomi documenti necessari
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index per categoria
CREATE INDEX IF NOT EXISTS idx_catalogo_servizi_categoria ON catalogo_servizi(categoria_id);

-- Trigger per updated_at su catalogo_servizi (se non esiste)
DROP TRIGGER IF EXISTS update_catalogo_servizi_updated_at ON catalogo_servizi;
CREATE TRIGGER update_catalogo_servizi_updated_at
  BEFORE UPDATE ON catalogo_servizi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELLA PACCHETTI SERVIZI
-- ============================================
CREATE TABLE IF NOT EXISTS pacchetti_servizi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descrizione TEXT,
  categoria_id UUID REFERENCES categorie_servizi(id) ON DELETE SET NULL,
  attivo BOOLEAN DEFAULT TRUE,
  ordine INTEGER DEFAULT 0,
  note_interne TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacchetti_servizi_tenant ON pacchetti_servizi(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pacchetti_servizi_categoria ON pacchetti_servizi(categoria_id);

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_pacchetti_servizi_updated_at ON pacchetti_servizi;
CREATE TRIGGER update_pacchetti_servizi_updated_at
  BEFORE UPDATE ON pacchetti_servizi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE pacchetti_servizi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON pacchetti_servizi;
CREATE POLICY "Allow all for development" ON pacchetti_servizi FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELLA SERVIZI IN PACCHETTO (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS pacchetti_servizi_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pacchetto_id UUID NOT NULL REFERENCES pacchetti_servizi(id) ON DELETE CASCADE,
  servizio_id UUID NOT NULL REFERENCES catalogo_servizi(id) ON DELETE CASCADE,
  ordine INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pacchetto_id, servizio_id)
);

CREATE INDEX IF NOT EXISTS idx_pacchetti_servizi_items_pacchetto ON pacchetti_servizi_items(pacchetto_id);
CREATE INDEX IF NOT EXISTS idx_pacchetti_servizi_items_servizio ON pacchetti_servizi_items(servizio_id);

-- RLS
ALTER TABLE pacchetti_servizi_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON pacchetti_servizi_items;
CREATE POLICY "Allow all for development" ON pacchetti_servizi_items FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INSERISCI CATEGORIE PREDEFINITE
-- ============================================
-- Nota: usa il tenant_id di default '00000000-0000-0000-0000-000000000001'

INSERT INTO categorie_servizi (tenant_id, nome, descrizione, colore, icona, ordine, predefinita) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Setup Iniziale', 'Servizi per l''avvio della gestione di una nuova proprietà', '#22c55e', 'rocket', 1, true),
  ('00000000-0000-0000-0000-000000000001', 'Gestione Operativa', 'Servizi ricorrenti per la gestione quotidiana', '#3b82f6', 'settings', 2, true),
  ('00000000-0000-0000-0000-000000000001', 'Marketing', 'Servizi di promozione e visibilità', '#f59e0b', 'megaphone', 3, true),
  ('00000000-0000-0000-0000-000000000001', 'Pratiche Burocratiche', 'Gestione documenti, permessi e adempimenti', '#8b5cf6', 'file-text', 4, true),
  ('00000000-0000-0000-0000-000000000001', 'Manutenzione', 'Interventi di manutenzione ordinaria e straordinaria', '#ef4444', 'wrench', 5, true),
  ('00000000-0000-0000-0000-000000000001', 'Extra', 'Servizi aggiuntivi e personalizzati', '#6b7280', 'plus-circle', 6, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
