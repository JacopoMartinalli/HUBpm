-- ============================================
-- MIGRAZIONE: Sistema Erogazione Servizi v3
-- ============================================
-- Implementa la gerarchia: Pacchetto → Servizi → Task
-- con dipendenze tra pacchetti e stati derivati
-- ============================================

-- ============================================
-- NUOVE FASI PROPRIETÀ (unificazione flusso)
-- ============================================
-- Lead → Qualificata → Erogazione → Live/Fine

-- Aggiorna enum fasi proprietà
-- P0: Lead (proprietà appena entrata)
-- P1: Qualificata (decisione di lavorarci)
-- P2: Erogazione (pacchetti/servizi in corso)
-- P3: Live (gestione attiva)
-- P4: Offboarding (chiusura collaborazione)
-- P5: Archiviata

-- ============================================
-- TABELLA: DIPENDENZE TRA PACCHETTI
-- ============================================
-- Un pacchetto può richiedere che altri pacchetti siano completati prima

CREATE TABLE IF NOT EXISTS pacchetti_dipendenze (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pacchetto_id UUID NOT NULL REFERENCES pacchetti_servizi(id) ON DELETE CASCADE,
  dipende_da_id UUID NOT NULL REFERENCES pacchetti_servizi(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Un pacchetto non può dipendere da se stesso
  CONSTRAINT no_self_dependency CHECK (pacchetto_id != dipende_da_id),
  -- Combinazione unica
  UNIQUE(pacchetto_id, dipende_da_id)
);

CREATE INDEX IF NOT EXISTS idx_pacchetti_dipendenze_pacchetto ON pacchetti_dipendenze(pacchetto_id);
CREATE INDEX IF NOT EXISTS idx_pacchetti_dipendenze_dipende ON pacchetti_dipendenze(dipende_da_id);

-- RLS
ALTER TABLE pacchetti_dipendenze ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON pacchetti_dipendenze;
CREATE POLICY "Allow all for development" ON pacchetti_dipendenze FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELLA: TEMPLATE TASK PER SERVIZIO
-- ============================================
-- Definisce le task standard che compongono un servizio del catalogo

CREATE TABLE IF NOT EXISTS template_task_servizio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  servizio_id UUID NOT NULL REFERENCES catalogo_servizi(id) ON DELETE CASCADE,
  titolo VARCHAR(200) NOT NULL,
  descrizione TEXT,
  tipo VARCHAR(20) DEFAULT 'manuale' CHECK (tipo IN ('manuale', 'automatica')),
  trigger_automatico TEXT, -- Es: 'on_document_upload', 'on_phase_change', etc.
  ordine INTEGER DEFAULT 0,
  giorni_deadline INTEGER, -- Giorni dalla data inizio servizio
  obbligatoria BOOLEAN DEFAULT TRUE,
  attiva BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_task_servizio_servizio ON template_task_servizio(servizio_id);
CREATE INDEX IF NOT EXISTS idx_template_task_servizio_tenant ON template_task_servizio(tenant_id);

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_template_task_servizio_updated_at ON template_task_servizio;
CREATE TRIGGER update_template_task_servizio_updated_at
  BEFORE UPDATE ON template_task_servizio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE template_task_servizio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON template_task_servizio;
CREATE POLICY "Allow all for development" ON template_task_servizio FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELLA: EROGAZIONE PACCHETTI (per proprietà)
-- ============================================
-- Traccia l'erogazione di un pacchetto su una specifica proprietà

CREATE TABLE IF NOT EXISTS erogazione_pacchetti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  proprieta_id UUID NOT NULL REFERENCES proprieta(id) ON DELETE CASCADE,
  pacchetto_id UUID NOT NULL REFERENCES pacchetti_servizi(id) ON DELETE RESTRICT,
  -- Stato derivato calcolato (memorizzato per performance)
  stato VARCHAR(30) DEFAULT 'da_iniziare'
    CHECK (stato IN ('bloccato', 'da_iniziare', 'in_corso', 'completato', 'annullato')),
  -- bloccato = dipendenze non soddisfatte
  -- da_iniziare = pronto ma non iniziato
  -- in_corso = almeno un servizio iniziato
  -- completato = tutti i servizi completati
  -- annullato = cancellato

  prezzo_totale DECIMAL(10,2), -- Prezzo concordato per questo pacchetto
  sconto_percentuale DECIMAL(5,2) DEFAULT 0,
  note TEXT,

  data_inizio DATE,
  data_completamento DATE,
  data_scadenza_prevista DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Una proprietà può avere lo stesso pacchetto solo una volta (attivo)
  UNIQUE(proprieta_id, pacchetto_id)
);

CREATE INDEX IF NOT EXISTS idx_erogazione_pacchetti_proprieta ON erogazione_pacchetti(proprieta_id);
CREATE INDEX IF NOT EXISTS idx_erogazione_pacchetti_pacchetto ON erogazione_pacchetti(pacchetto_id);
CREATE INDEX IF NOT EXISTS idx_erogazione_pacchetti_stato ON erogazione_pacchetti(stato);

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_erogazione_pacchetti_updated_at ON erogazione_pacchetti;
CREATE TRIGGER update_erogazione_pacchetti_updated_at
  BEFORE UPDATE ON erogazione_pacchetti
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE erogazione_pacchetti ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON erogazione_pacchetti;
CREATE POLICY "Allow all for development" ON erogazione_pacchetti FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELLA: EROGAZIONE SERVIZI (per proprietà)
-- ============================================
-- Traccia l'erogazione di un servizio all'interno di un pacchetto

CREATE TABLE IF NOT EXISTS erogazione_servizi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  erogazione_pacchetto_id UUID NOT NULL REFERENCES erogazione_pacchetti(id) ON DELETE CASCADE,
  servizio_id UUID NOT NULL REFERENCES catalogo_servizi(id) ON DELETE RESTRICT,

  -- Stato derivato (completato quando tutte le task obbligatorie sono complete)
  stato VARCHAR(30) DEFAULT 'da_iniziare'
    CHECK (stato IN ('da_iniziare', 'in_corso', 'completato', 'bloccato', 'annullato')),

  prezzo DECIMAL(10,2), -- Prezzo specifico per questo servizio (può differire dal catalogo)
  assegnato_a UUID, -- Partner/collaboratore assegnato (riferimento a contatti)

  data_inizio DATE,
  data_completamento DATE,
  data_scadenza DATE,

  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un servizio può apparire una sola volta per erogazione pacchetto
  UNIQUE(erogazione_pacchetto_id, servizio_id)
);

CREATE INDEX IF NOT EXISTS idx_erogazione_servizi_pacchetto ON erogazione_servizi(erogazione_pacchetto_id);
CREATE INDEX IF NOT EXISTS idx_erogazione_servizi_servizio ON erogazione_servizi(servizio_id);
CREATE INDEX IF NOT EXISTS idx_erogazione_servizi_stato ON erogazione_servizi(stato);

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_erogazione_servizi_updated_at ON erogazione_servizi;
CREATE TRIGGER update_erogazione_servizi_updated_at
  BEFORE UPDATE ON erogazione_servizi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE erogazione_servizi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON erogazione_servizi;
CREATE POLICY "Allow all for development" ON erogazione_servizi FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELLA: EROGAZIONE TASK
-- ============================================
-- Le singole task operative di un servizio erogato

CREATE TABLE IF NOT EXISTS erogazione_task (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  erogazione_servizio_id UUID NOT NULL REFERENCES erogazione_servizi(id) ON DELETE CASCADE,
  template_id UUID REFERENCES template_task_servizio(id) ON DELETE SET NULL,

  titolo VARCHAR(200) NOT NULL,
  descrizione TEXT,
  tipo VARCHAR(20) DEFAULT 'manuale' CHECK (tipo IN ('manuale', 'automatica')),

  stato VARCHAR(20) DEFAULT 'da_fare'
    CHECK (stato IN ('da_fare', 'in_corso', 'completata', 'bloccata', 'annullata')),

  obbligatoria BOOLEAN DEFAULT TRUE,
  ordine INTEGER DEFAULT 0,

  assegnato_a UUID, -- Partner/collaboratore

  data_scadenza DATE,
  data_inizio TIMESTAMPTZ,
  data_completamento TIMESTAMPTZ,
  completato_da UUID, -- Chi ha completato la task

  -- Per task automatiche
  trigger_automatico TEXT,
  trigger_eseguito BOOLEAN DEFAULT FALSE,
  trigger_data TIMESTAMPTZ,

  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erogazione_task_servizio ON erogazione_task(erogazione_servizio_id);
CREATE INDEX IF NOT EXISTS idx_erogazione_task_stato ON erogazione_task(stato);
CREATE INDEX IF NOT EXISTS idx_erogazione_task_assegnato ON erogazione_task(assegnato_a);

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_erogazione_task_updated_at ON erogazione_task;
CREATE TRIGGER update_erogazione_task_updated_at
  BEFORE UPDATE ON erogazione_task
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE erogazione_task ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for development" ON erogazione_task;
CREATE POLICY "Allow all for development" ON erogazione_task FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- AGGIORNAMENTI A PACCHETTI_SERVIZI
-- ============================================
-- Aggiungi campi per prezzo e tipo esito

ALTER TABLE pacchetti_servizi
  ADD COLUMN IF NOT EXISTS prezzo_base DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS tipo_esito VARCHAR(20) DEFAULT 'one_shot'
    CHECK (tipo_esito IS NULL OR tipo_esito IN ('one_shot', 'gestione'));
-- one_shot: Lead → Qualificata → Erogazione → Saldo → FINE
-- gestione: Lead → Qualificata → Erogazione → Live (richiede tutti pacchetti propedeutici)

-- ============================================
-- VIEW: STATO EROGAZIONE PACCHETTO (calcolato)
-- ============================================
-- Calcola lo stato del pacchetto basandosi sui servizi

CREATE OR REPLACE VIEW v_erogazione_pacchetti_stato AS
SELECT
  ep.id,
  ep.proprieta_id,
  ep.pacchetto_id,
  ep.tenant_id,
  ps.nome AS pacchetto_nome,
  ps.tipo_esito,
  ep.prezzo_totale,
  ep.data_inizio,
  ep.data_completamento,

  -- Conta servizi per stato
  COUNT(es.id) AS totale_servizi,
  COUNT(CASE WHEN es.stato = 'completato' THEN 1 END) AS servizi_completati,
  COUNT(CASE WHEN es.stato = 'in_corso' THEN 1 END) AS servizi_in_corso,
  COUNT(CASE WHEN es.stato = 'bloccato' THEN 1 END) AS servizi_bloccati,

  -- Calcola stato derivato
  CASE
    WHEN ep.stato = 'annullato' THEN 'annullato'
    WHEN EXISTS (
      SELECT 1 FROM pacchetti_dipendenze pd
      JOIN erogazione_pacchetti ep_dep ON ep_dep.pacchetto_id = pd.dipende_da_id
        AND ep_dep.proprieta_id = ep.proprieta_id
      WHERE pd.pacchetto_id = ep.pacchetto_id
        AND ep_dep.stato != 'completato'
    ) THEN 'bloccato'
    WHEN COUNT(es.id) = 0 THEN 'da_iniziare'
    WHEN COUNT(CASE WHEN es.stato = 'completato' THEN 1 END) = COUNT(es.id) THEN 'completato'
    WHEN COUNT(CASE WHEN es.stato IN ('in_corso', 'completato') THEN 1 END) > 0 THEN 'in_corso'
    ELSE 'da_iniziare'
  END AS stato_calcolato,

  -- Percentuale completamento
  CASE
    WHEN COUNT(es.id) = 0 THEN 0
    ELSE ROUND(COUNT(CASE WHEN es.stato = 'completato' THEN 1 END)::DECIMAL / COUNT(es.id) * 100, 1)
  END AS percentuale_completamento

FROM erogazione_pacchetti ep
JOIN pacchetti_servizi ps ON ps.id = ep.pacchetto_id
LEFT JOIN erogazione_servizi es ON es.erogazione_pacchetto_id = ep.id
GROUP BY ep.id, ep.proprieta_id, ep.pacchetto_id, ep.tenant_id,
         ps.nome, ps.tipo_esito, ep.prezzo_totale, ep.data_inizio, ep.data_completamento, ep.stato;

-- ============================================
-- VIEW: STATO EROGAZIONE SERVIZIO (calcolato)
-- ============================================

CREATE OR REPLACE VIEW v_erogazione_servizi_stato AS
SELECT
  es.id,
  es.erogazione_pacchetto_id,
  es.servizio_id,
  es.tenant_id,
  cs.nome AS servizio_nome,
  cs.tipo AS servizio_tipo,
  es.prezzo,
  es.data_inizio,
  es.data_completamento,

  -- Conta task
  COUNT(et.id) AS totale_task,
  COUNT(CASE WHEN et.stato = 'completata' THEN 1 END) AS task_completate,
  COUNT(CASE WHEN et.stato = 'in_corso' THEN 1 END) AS task_in_corso,
  COUNT(CASE WHEN et.stato = 'bloccata' THEN 1 END) AS task_bloccate,
  COUNT(CASE WHEN et.obbligatoria = TRUE THEN 1 END) AS task_obbligatorie,
  COUNT(CASE WHEN et.obbligatoria = TRUE AND et.stato = 'completata' THEN 1 END) AS task_obb_completate,

  -- Stato derivato (basato su task obbligatorie)
  CASE
    WHEN es.stato = 'annullato' THEN 'annullato'
    WHEN es.stato = 'bloccato' THEN 'bloccato'
    WHEN COUNT(et.id) = 0 THEN 'da_iniziare'
    WHEN COUNT(CASE WHEN et.obbligatoria = TRUE AND et.stato != 'completata' AND et.stato != 'annullata' THEN 1 END) = 0 THEN 'completato'
    WHEN COUNT(CASE WHEN et.stato = 'in_corso' THEN 1 END) > 0 THEN 'in_corso'
    WHEN COUNT(CASE WHEN et.stato = 'completata' THEN 1 END) > 0 THEN 'in_corso'
    ELSE 'da_iniziare'
  END AS stato_calcolato,

  -- Percentuale (solo task obbligatorie)
  CASE
    WHEN COUNT(CASE WHEN et.obbligatoria = TRUE THEN 1 END) = 0 THEN 100
    ELSE ROUND(
      COUNT(CASE WHEN et.obbligatoria = TRUE AND et.stato = 'completata' THEN 1 END)::DECIMAL /
      NULLIF(COUNT(CASE WHEN et.obbligatoria = TRUE THEN 1 END), 0) * 100, 1
    )
  END AS percentuale_completamento

FROM erogazione_servizi es
JOIN catalogo_servizi cs ON cs.id = es.servizio_id
LEFT JOIN erogazione_task et ON et.erogazione_servizio_id = es.id
GROUP BY es.id, es.erogazione_pacchetto_id, es.servizio_id, es.tenant_id,
         cs.nome, cs.tipo, es.prezzo, es.data_inizio, es.data_completamento, es.stato;

-- ============================================
-- VIEW: RIEPILOGO EROGAZIONE PER PROPRIETÀ
-- ============================================

CREATE OR REPLACE VIEW v_proprieta_erogazione AS
SELECT
  p.id AS proprieta_id,
  p.nome AS proprieta_nome,
  p.fase,
  p.tenant_id,

  COUNT(DISTINCT ep.id) AS totale_pacchetti,
  COUNT(DISTINCT CASE WHEN ep.stato = 'completato' THEN ep.id END) AS pacchetti_completati,
  COUNT(DISTINCT CASE WHEN ep.stato = 'in_corso' THEN ep.id END) AS pacchetti_in_corso,
  COUNT(DISTINCT CASE WHEN ep.stato = 'bloccato' THEN ep.id END) AS pacchetti_bloccati,

  SUM(ep.prezzo_totale) AS valore_totale,

  -- Pronto per Live? (tutti i pacchetti propedeutici gestione completati)
  CASE
    WHEN COUNT(DISTINCT CASE WHEN ps.tipo_esito = 'gestione' AND ep.stato != 'completato' THEN ep.id END) = 0
         AND COUNT(DISTINCT CASE WHEN ps.tipo_esito = 'gestione' THEN ep.id END) > 0
    THEN TRUE
    ELSE FALSE
  END AS pronto_per_live

FROM proprieta p
LEFT JOIN erogazione_pacchetti ep ON ep.proprieta_id = p.id AND ep.stato != 'annullato'
LEFT JOIN pacchetti_servizi ps ON ps.id = ep.pacchetto_id
GROUP BY p.id, p.nome, p.fase, p.tenant_id;

-- ============================================
-- FUNZIONE: Crea erogazione servizi da pacchetto
-- ============================================
-- Quando si aggiunge un pacchetto a una proprietà, crea automaticamente
-- i record di erogazione servizi con le relative task

CREATE OR REPLACE FUNCTION fn_crea_erogazione_da_pacchetto()
RETURNS TRIGGER AS $$
DECLARE
  v_servizio RECORD;
  v_erogazione_servizio_id UUID;
  v_task RECORD;
BEGIN
  -- Per ogni servizio nel pacchetto
  FOR v_servizio IN
    SELECT psi.servizio_id, psi.ordine, psi.note
    FROM pacchetti_servizi_items psi
    WHERE psi.pacchetto_id = NEW.pacchetto_id
    ORDER BY psi.ordine
  LOOP
    -- Crea erogazione servizio
    INSERT INTO erogazione_servizi (
      tenant_id,
      erogazione_pacchetto_id,
      servizio_id,
      stato,
      note
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      v_servizio.servizio_id,
      'da_iniziare',
      v_servizio.note
    ) RETURNING id INTO v_erogazione_servizio_id;

    -- Crea task dal template
    FOR v_task IN
      SELECT *
      FROM template_task_servizio
      WHERE servizio_id = v_servizio.servizio_id
        AND attiva = TRUE
      ORDER BY ordine
    LOOP
      INSERT INTO erogazione_task (
        tenant_id,
        erogazione_servizio_id,
        template_id,
        titolo,
        descrizione,
        tipo,
        obbligatoria,
        ordine,
        trigger_automatico,
        data_scadenza
      ) VALUES (
        NEW.tenant_id,
        v_erogazione_servizio_id,
        v_task.id,
        v_task.titolo,
        v_task.descrizione,
        v_task.tipo,
        v_task.obbligatoria,
        v_task.ordine,
        v_task.trigger_automatico,
        CASE
          WHEN v_task.giorni_deadline IS NOT NULL AND NEW.data_inizio IS NOT NULL
          THEN NEW.data_inizio + v_task.giorni_deadline
          ELSE NULL
        END
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per creazione automatica
DROP TRIGGER IF EXISTS trg_crea_erogazione_da_pacchetto ON erogazione_pacchetti;
CREATE TRIGGER trg_crea_erogazione_da_pacchetto
  AFTER INSERT ON erogazione_pacchetti
  FOR EACH ROW EXECUTE FUNCTION fn_crea_erogazione_da_pacchetto();

-- ============================================
-- FUNZIONE: Aggiorna stato servizio quando task cambia
-- ============================================

CREATE OR REPLACE FUNCTION fn_aggiorna_stato_servizio()
RETURNS TRIGGER AS $$
DECLARE
  v_nuovo_stato VARCHAR(30);
  v_task_obbligatorie INTEGER;
  v_task_obb_completate INTEGER;
  v_task_in_corso INTEGER;
BEGIN
  -- Conta task obbligatorie
  SELECT
    COUNT(*) FILTER (WHERE obbligatoria = TRUE AND stato NOT IN ('annullata')),
    COUNT(*) FILTER (WHERE obbligatoria = TRUE AND stato = 'completata'),
    COUNT(*) FILTER (WHERE stato = 'in_corso')
  INTO v_task_obbligatorie, v_task_obb_completate, v_task_in_corso
  FROM erogazione_task
  WHERE erogazione_servizio_id = COALESCE(NEW.erogazione_servizio_id, OLD.erogazione_servizio_id);

  -- Determina nuovo stato
  IF v_task_obbligatorie = 0 OR v_task_obb_completate = v_task_obbligatorie THEN
    v_nuovo_stato := 'completato';
  ELSIF v_task_in_corso > 0 OR v_task_obb_completate > 0 THEN
    v_nuovo_stato := 'in_corso';
  ELSE
    v_nuovo_stato := 'da_iniziare';
  END IF;

  -- Aggiorna servizio
  UPDATE erogazione_servizi
  SET stato = v_nuovo_stato,
      data_completamento = CASE WHEN v_nuovo_stato = 'completato' THEN CURRENT_DATE ELSE NULL END
  WHERE id = COALESCE(NEW.erogazione_servizio_id, OLD.erogazione_servizio_id)
    AND stato NOT IN ('annullato', 'bloccato');

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aggiorna_stato_servizio ON erogazione_task;
CREATE TRIGGER trg_aggiorna_stato_servizio
  AFTER INSERT OR UPDATE OF stato ON erogazione_task
  FOR EACH ROW EXECUTE FUNCTION fn_aggiorna_stato_servizio();

-- ============================================
-- FUNZIONE: Aggiorna stato pacchetto quando servizio cambia
-- ============================================

CREATE OR REPLACE FUNCTION fn_aggiorna_stato_pacchetto()
RETURNS TRIGGER AS $$
DECLARE
  v_nuovo_stato VARCHAR(30);
  v_totale_servizi INTEGER;
  v_servizi_completati INTEGER;
  v_servizi_in_corso INTEGER;
  v_pacchetto_id UUID;
  v_proprieta_id UUID;
  v_ha_dipendenze_incomplete BOOLEAN;
BEGIN
  -- Ottieni info pacchetto
  SELECT ep.pacchetto_id, ep.proprieta_id
  INTO v_pacchetto_id, v_proprieta_id
  FROM erogazione_pacchetti ep
  WHERE ep.id = COALESCE(NEW.erogazione_pacchetto_id, OLD.erogazione_pacchetto_id);

  -- Verifica dipendenze
  SELECT EXISTS (
    SELECT 1 FROM pacchetti_dipendenze pd
    JOIN erogazione_pacchetti ep_dep ON ep_dep.pacchetto_id = pd.dipende_da_id
      AND ep_dep.proprieta_id = v_proprieta_id
    WHERE pd.pacchetto_id = v_pacchetto_id
      AND ep_dep.stato != 'completato'
  ) INTO v_ha_dipendenze_incomplete;

  IF v_ha_dipendenze_incomplete THEN
    v_nuovo_stato := 'bloccato';
  ELSE
    -- Conta servizi
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE stato = 'completato'),
      COUNT(*) FILTER (WHERE stato = 'in_corso')
    INTO v_totale_servizi, v_servizi_completati, v_servizi_in_corso
    FROM erogazione_servizi
    WHERE erogazione_pacchetto_id = COALESCE(NEW.erogazione_pacchetto_id, OLD.erogazione_pacchetto_id)
      AND stato != 'annullato';

    IF v_totale_servizi = 0 THEN
      v_nuovo_stato := 'da_iniziare';
    ELSIF v_servizi_completati = v_totale_servizi THEN
      v_nuovo_stato := 'completato';
    ELSIF v_servizi_in_corso > 0 OR v_servizi_completati > 0 THEN
      v_nuovo_stato := 'in_corso';
    ELSE
      v_nuovo_stato := 'da_iniziare';
    END IF;
  END IF;

  -- Aggiorna pacchetto
  UPDATE erogazione_pacchetti
  SET stato = v_nuovo_stato,
      data_completamento = CASE WHEN v_nuovo_stato = 'completato' THEN CURRENT_DATE ELSE NULL END
  WHERE id = COALESCE(NEW.erogazione_pacchetto_id, OLD.erogazione_pacchetto_id)
    AND stato != 'annullato';

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aggiorna_stato_pacchetto ON erogazione_servizi;
CREATE TRIGGER trg_aggiorna_stato_pacchetto
  AFTER INSERT OR UPDATE OF stato ON erogazione_servizi
  FOR EACH ROW EXECUTE FUNCTION fn_aggiorna_stato_pacchetto();

-- ============================================
-- INSERISCI PACCHETTI PREDEFINITI
-- ============================================
-- Usa tenant_id default

-- Pacchetto: Legale
INSERT INTO pacchetti_servizi (tenant_id, nome, descrizione, prezzo_base, tipo_esito, ordine)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Pratiche Legali',
  'SCIA, CIR, CIN, Alloggiati Web - Tutti gli adempimenti burocratici',
  500.00,
  'one_shot',
  1
) ON CONFLICT DO NOTHING;

-- Pacchetto: Set Fotografico
INSERT INTO pacchetti_servizi (tenant_id, nome, descrizione, prezzo_base, tipo_esito, ordine)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Set Fotografico',
  'Shooting fotografico professionale + editing',
  400.00,
  'one_shot',
  2
) ON CONFLICT DO NOTHING;

-- Pacchetto: Setup OTA (dipende da Legale + Foto)
INSERT INTO pacchetti_servizi (tenant_id, nome, descrizione, prezzo_base, tipo_esito, ordine)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Setup Annunci OTA',
  'Creazione annunci su Airbnb, Booking.com e configurazione channel manager',
  600.00,
  'one_shot',
  3
) ON CONFLICT DO NOTHING;

-- Pacchetto: Gestione (determina esito Live)
INSERT INTO pacchetti_servizi (tenant_id, nome, descrizione, prezzo_base, tipo_esito, ordine)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Attivazione Gestione',
  'Attivazione della gestione completa della proprietà',
  0.00,
  'gestione',
  4
) ON CONFLICT DO NOTHING;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
