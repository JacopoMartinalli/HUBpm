-- ============================================
-- PROPOSTE COMMERCIALI
-- Sistema per generare preventivi/proposte
-- ============================================

-- Tabella principale proposte
CREATE TABLE IF NOT EXISTS proposte_commerciali (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Riferimenti
  proprieta_id UUID NOT NULL REFERENCES proprieta(id) ON DELETE CASCADE,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,

  -- Dati proposta
  numero VARCHAR(50), -- Numero proposta (es. PROP-2025-001)
  titolo VARCHAR(255),
  descrizione TEXT,

  -- Stato
  stato VARCHAR(20) NOT NULL DEFAULT 'bozza' CHECK (stato IN ('bozza', 'inviata', 'accettata', 'rifiutata', 'scaduta')),

  -- Date
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_invio TIMESTAMPTZ,
  data_scadenza DATE, -- Entro quando deve rispondere
  data_risposta TIMESTAMPTZ,

  -- Importi
  subtotale DECIMAL(10, 2) DEFAULT 0,
  sconto_percentuale DECIMAL(5, 2) DEFAULT 0,
  sconto_fisso DECIMAL(10, 2) DEFAULT 0,
  totale DECIMAL(10, 2) DEFAULT 0,

  -- Note
  note_interne TEXT, -- Note visibili solo internamente
  note_cliente TEXT, -- Note visibili al cliente
  motivo_rifiuto TEXT, -- Se rifiutata, perché

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Tabella items della proposta (servizi/pacchetti inclusi)
CREATE TABLE IF NOT EXISTS proposte_commerciali_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposta_id UUID NOT NULL REFERENCES proposte_commerciali(id) ON DELETE CASCADE,

  -- Può essere un servizio singolo O un pacchetto
  servizio_id UUID REFERENCES catalogo_servizi(id) ON DELETE SET NULL,
  pacchetto_id UUID REFERENCES pacchetti_servizi(id) ON DELETE SET NULL,

  -- Dati dell'item
  nome VARCHAR(255) NOT NULL, -- Nome al momento della creazione (snapshot)
  descrizione TEXT,

  -- Prezzi
  quantita INTEGER NOT NULL DEFAULT 1,
  prezzo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sconto_percentuale DECIMAL(5, 2) DEFAULT 0,
  prezzo_totale DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Ordinamento
  ordine INTEGER NOT NULL DEFAULT 0,

  -- Note specifiche per questo item
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Almeno uno tra servizio_id e pacchetto_id deve essere valorizzato
  CONSTRAINT check_item_type CHECK (
    (servizio_id IS NOT NULL AND pacchetto_id IS NULL) OR
    (servizio_id IS NULL AND pacchetto_id IS NOT NULL)
  )
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_proposte_tenant ON proposte_commerciali(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposte_proprieta ON proposte_commerciali(proprieta_id);
CREATE INDEX IF NOT EXISTS idx_proposte_contatto ON proposte_commerciali(contatto_id);
CREATE INDEX IF NOT EXISTS idx_proposte_stato ON proposte_commerciali(stato);
CREATE INDEX IF NOT EXISTS idx_proposte_data ON proposte_commerciali(data_creazione DESC);
CREATE INDEX IF NOT EXISTS idx_proposte_items_proposta ON proposte_commerciali_items(proposta_id);

-- RLS (permissivo per sviluppo)
ALTER TABLE proposte_commerciali ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposte_commerciali_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for development" ON proposte_commerciali;
CREATE POLICY "Allow all for development" ON proposte_commerciali FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for development" ON proposte_commerciali_items;
CREATE POLICY "Allow all for development" ON proposte_commerciali_items FOR ALL USING (true) WITH CHECK (true);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_proposte_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposte_updated_at ON proposte_commerciali;
CREATE TRIGGER trigger_proposte_updated_at
  BEFORE UPDATE ON proposte_commerciali
  FOR EACH ROW
  EXECUTE FUNCTION update_proposte_updated_at();

-- Funzione per generare numero proposta
CREATE OR REPLACE FUNCTION generate_numero_proposta(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_anno INTEGER;
  v_count INTEGER;
  v_numero VARCHAR(50);
BEGIN
  v_anno := EXTRACT(YEAR FROM NOW());

  SELECT COUNT(*) + 1 INTO v_count
  FROM proposte_commerciali
  WHERE tenant_id = p_tenant_id
  AND EXTRACT(YEAR FROM data_creazione) = v_anno;

  v_numero := 'PROP-' || v_anno || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- Trigger per generare numero automaticamente
CREATE OR REPLACE FUNCTION set_numero_proposta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := generate_numero_proposta(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_numero_proposta ON proposte_commerciali;
CREATE TRIGGER trigger_set_numero_proposta
  BEFORE INSERT ON proposte_commerciali
  FOR EACH ROW
  EXECUTE FUNCTION set_numero_proposta();

-- Funzione per ricalcolare totali proposta
CREATE OR REPLACE FUNCTION ricalcola_totali_proposta(p_proposta_id UUID)
RETURNS VOID AS $$
DECLARE
  v_subtotale DECIMAL(10, 2);
  v_sconto_perc DECIMAL(5, 2);
  v_sconto_fisso DECIMAL(10, 2);
  v_totale DECIMAL(10, 2);
BEGIN
  -- Calcola subtotale dagli items
  SELECT COALESCE(SUM(prezzo_totale), 0) INTO v_subtotale
  FROM proposte_commerciali_items
  WHERE proposta_id = p_proposta_id;

  -- Recupera sconti
  SELECT sconto_percentuale, sconto_fisso INTO v_sconto_perc, v_sconto_fisso
  FROM proposte_commerciali
  WHERE id = p_proposta_id;

  -- Calcola totale
  v_totale := v_subtotale;
  IF v_sconto_perc > 0 THEN
    v_totale := v_totale * (1 - v_sconto_perc / 100);
  END IF;
  v_totale := v_totale - COALESCE(v_sconto_fisso, 0);

  -- Aggiorna proposta
  UPDATE proposte_commerciali
  SET subtotale = v_subtotale, totale = v_totale
  WHERE id = p_proposta_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger per ricalcolare totali quando cambiano gli items
CREATE OR REPLACE FUNCTION trigger_ricalcola_totali()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM ricalcola_totali_proposta(OLD.proposta_id);
    RETURN OLD;
  ELSE
    PERFORM ricalcola_totali_proposta(NEW.proposta_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_items_ricalcola ON proposte_commerciali_items;
CREATE TRIGGER trigger_items_ricalcola
  AFTER INSERT OR UPDATE OR DELETE ON proposte_commerciali_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ricalcola_totali();

-- ============================================
-- COMMENTI
-- ============================================
COMMENT ON TABLE proposte_commerciali IS 'Proposte commerciali/preventivi per i clienti';
COMMENT ON TABLE proposte_commerciali_items IS 'Servizi e pacchetti inclusi in una proposta';
COMMENT ON COLUMN proposte_commerciali.stato IS 'bozza, inviata, accettata, rifiutata, scaduta';
COMMENT ON COLUMN proposte_commerciali_items.nome IS 'Snapshot del nome al momento della creazione';
