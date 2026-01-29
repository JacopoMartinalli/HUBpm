-- =============================================
-- MIGRAZIONE: Portale Clienti Self-Service
-- Data: 2025-01-30
-- Descrizione: Crea tabelle per il portale clienti con autenticazione magic link
-- =============================================

-- 1. ENUM Types
DO $$ BEGIN
  CREATE TYPE stato_richiesta_servizio AS ENUM (
    'in_attesa',        -- Cliente ha richiesto, PM deve valutare
    'in_valutazione',   -- PM sta preparando proposta
    'proposta_inviata', -- Proposta creata e inviata
    'accettata',        -- Cliente ha accettato
    'rifiutata',        -- PM o cliente hanno rifiutato
    'completata'        -- Servizio erogato
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_mittente_messaggio AS ENUM ('cliente', 'pm');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_notifica_portale AS ENUM (
    'documento_richiesto',
    'documento_verificato',
    'proposta_ricevuta',
    'servizio_iniziato',
    'servizio_completato',
    'messaggio_ricevuto',
    'fase_proprieta_cambiata'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. TABELLA: utenti_portale
-- Collega Supabase Auth ai contatti esistenti
-- =============================================
CREATE TABLE IF NOT EXISTS utenti_portale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,

  -- Stato account
  attivo BOOLEAN DEFAULT true,
  ultimo_accesso TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Un utente portale per contatto per tenant
  UNIQUE(tenant_id, contatto_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_utenti_portale_auth_user ON utenti_portale(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_utenti_portale_contatto ON utenti_portale(contatto_id);
CREATE INDEX IF NOT EXISTS idx_utenti_portale_tenant ON utenti_portale(tenant_id);

-- =============================================
-- 3. TABELLA: inviti_portale
-- Gestione inviti per accesso al portale
-- =============================================
CREATE TABLE IF NOT EXISTS inviti_portale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,

  -- Token e email
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,

  -- Stato
  usato BOOLEAN DEFAULT false,
  data_scadenza TIMESTAMP WITH TIME ZONE NOT NULL,
  data_utilizzo TIMESTAMP WITH TIME ZONE,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID -- ID dell'admin che ha creato l'invito
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_inviti_portale_token ON inviti_portale(token) WHERE usato = false;
CREATE INDEX IF NOT EXISTS idx_inviti_portale_contatto ON inviti_portale(contatto_id);

-- =============================================
-- 4. TABELLA: richieste_servizi
-- Richieste di servizi dal portale clienti
-- =============================================
CREATE TABLE IF NOT EXISTS richieste_servizi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
  proprieta_id UUID REFERENCES proprieta(id) ON DELETE SET NULL,

  -- Riferimento al servizio/pacchetto richiesto (opzionale)
  servizio_id UUID REFERENCES catalogo_servizi(id) ON DELETE SET NULL,
  pacchetto_id UUID REFERENCES pacchetti_servizi(id) ON DELETE SET NULL,

  -- Dati richiesta
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT,
  stato stato_richiesta_servizio DEFAULT 'in_attesa',

  -- Proposta collegata (se generata dal PM)
  proposta_id UUID REFERENCES proposte_commerciali(id) ON DELETE SET NULL,

  -- Note
  note_cliente TEXT,
  note_pm TEXT,
  motivo_rifiuto TEXT,

  -- Tracking
  data_richiesta TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_risposta TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_richieste_servizi_contatto ON richieste_servizi(contatto_id);
CREATE INDEX IF NOT EXISTS idx_richieste_servizi_proprieta ON richieste_servizi(proprieta_id);
CREATE INDEX IF NOT EXISTS idx_richieste_servizi_stato ON richieste_servizi(stato);
CREATE INDEX IF NOT EXISTS idx_richieste_servizi_tenant ON richieste_servizi(tenant_id);

-- =============================================
-- 5. TABELLA: messaggi_portale
-- Comunicazione cliente-PM
-- =============================================
CREATE TABLE IF NOT EXISTS messaggi_portale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,

  -- Contesto opzionale (a cosa si riferisce il messaggio)
  proprieta_id UUID REFERENCES proprieta(id) ON DELETE SET NULL,
  richiesta_servizio_id UUID REFERENCES richieste_servizi(id) ON DELETE SET NULL,
  documento_id UUID REFERENCES documenti(id) ON DELETE SET NULL,

  -- Contenuto
  mittente tipo_mittente_messaggio NOT NULL,
  oggetto VARCHAR(255),
  contenuto TEXT NOT NULL,

  -- Stato lettura
  letto BOOLEAN DEFAULT false,
  data_lettura TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_messaggi_portale_contatto ON messaggi_portale(contatto_id);
CREATE INDEX IF NOT EXISTS idx_messaggi_portale_proprieta ON messaggi_portale(proprieta_id);
CREATE INDEX IF NOT EXISTS idx_messaggi_portale_non_letto ON messaggi_portale(contatto_id, letto) WHERE letto = false;
CREATE INDEX IF NOT EXISTS idx_messaggi_portale_tenant ON messaggi_portale(tenant_id);

-- =============================================
-- 6. TABELLA: notifiche_portale
-- Notifiche per i clienti
-- =============================================
CREATE TABLE IF NOT EXISTS notifiche_portale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contatto_id UUID NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,

  tipo tipo_notifica_portale NOT NULL,
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT,

  -- Riferimenti opzionali
  proprieta_id UUID REFERENCES proprieta(id) ON DELETE SET NULL,
  documento_id UUID REFERENCES documenti(id) ON DELETE SET NULL,
  proposta_id UUID REFERENCES proposte_commerciali(id) ON DELETE SET NULL,
  richiesta_id UUID REFERENCES richieste_servizi(id) ON DELETE SET NULL,

  -- Stato
  letta BOOLEAN DEFAULT false,
  data_lettura TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_notifiche_portale_contatto ON notifiche_portale(contatto_id);
CREATE INDEX IF NOT EXISTS idx_notifiche_portale_non_letta ON notifiche_portale(contatto_id, letta) WHERE letta = false;
CREATE INDEX IF NOT EXISTS idx_notifiche_portale_tenant ON notifiche_portale(tenant_id);

-- =============================================
-- 7. TRIGGER: updated_at automatico
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_utenti_portale_updated_at ON utenti_portale;
CREATE TRIGGER update_utenti_portale_updated_at
  BEFORE UPDATE ON utenti_portale
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_richieste_servizi_updated_at ON richieste_servizi;
CREATE TRIGGER update_richieste_servizi_updated_at
  BEFORE UPDATE ON richieste_servizi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. HELPER FUNCTIONS per RLS
-- =============================================

-- Ottieni contatto_id dall'utente autenticato
CREATE OR REPLACE FUNCTION get_current_contatto_id()
RETURNS UUID AS $$
  SELECT contatto_id
  FROM utenti_portale
  WHERE auth_user_id = auth.uid()
  AND attivo = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se l'utente corrente e' un cliente del portale
CREATE OR REPLACE FUNCTION is_portal_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM utenti_portale
    WHERE auth_user_id = auth.uid()
    AND attivo = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 9. RLS POLICIES
-- =============================================

-- Abilita RLS sulle nuove tabelle
ALTER TABLE utenti_portale ENABLE ROW LEVEL SECURITY;
ALTER TABLE inviti_portale ENABLE ROW LEVEL SECURITY;
ALTER TABLE richieste_servizi ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaggi_portale ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifiche_portale ENABLE ROW LEVEL SECURITY;

-- POLICIES: utenti_portale
CREATE POLICY "utenti_portale_select_own" ON utenti_portale
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "utenti_portale_admin_all" ON utenti_portale
  FOR ALL USING (NOT is_portal_user());

-- POLICIES: inviti_portale (solo admin)
CREATE POLICY "inviti_portale_admin_all" ON inviti_portale
  FOR ALL USING (NOT is_portal_user());

-- POLICIES: richieste_servizi
CREATE POLICY "richieste_servizi_select_own" ON richieste_servizi
  FOR SELECT USING (
    contatto_id = get_current_contatto_id()
    OR NOT is_portal_user()
  );

CREATE POLICY "richieste_servizi_insert_own" ON richieste_servizi
  FOR INSERT WITH CHECK (
    contatto_id = get_current_contatto_id()
    OR NOT is_portal_user()
  );

CREATE POLICY "richieste_servizi_update_own" ON richieste_servizi
  FOR UPDATE USING (
    contatto_id = get_current_contatto_id()
    OR NOT is_portal_user()
  );

CREATE POLICY "richieste_servizi_delete_admin" ON richieste_servizi
  FOR DELETE USING (NOT is_portal_user());

-- POLICIES: messaggi_portale
CREATE POLICY "messaggi_portale_select_own" ON messaggi_portale
  FOR SELECT USING (
    contatto_id = get_current_contatto_id()
    OR NOT is_portal_user()
  );

CREATE POLICY "messaggi_portale_insert" ON messaggi_portale
  FOR INSERT WITH CHECK (
    (contatto_id = get_current_contatto_id() AND mittente = 'cliente')
    OR NOT is_portal_user()
  );

CREATE POLICY "messaggi_portale_update_read" ON messaggi_portale
  FOR UPDATE USING (
    (contatto_id = get_current_contatto_id() AND mittente = 'pm')
    OR NOT is_portal_user()
  );

-- POLICIES: notifiche_portale
CREATE POLICY "notifiche_portale_select_own" ON notifiche_portale
  FOR SELECT USING (
    contatto_id = get_current_contatto_id()
    OR NOT is_portal_user()
  );

CREATE POLICY "notifiche_portale_update_read" ON notifiche_portale
  FOR UPDATE USING (
    contatto_id = get_current_contatto_id()
    OR NOT is_portal_user()
  );

CREATE POLICY "notifiche_portale_insert_admin" ON notifiche_portale
  FOR INSERT WITH CHECK (NOT is_portal_user());

CREATE POLICY "notifiche_portale_delete_admin" ON notifiche_portale
  FOR DELETE USING (NOT is_portal_user());

-- =============================================
-- 10. COMMENTI TABELLE
-- =============================================
COMMENT ON TABLE utenti_portale IS 'Collega gli utenti Supabase Auth ai contatti per il portale clienti';
COMMENT ON TABLE inviti_portale IS 'Gestione inviti magic link per accesso al portale';
COMMENT ON TABLE richieste_servizi IS 'Richieste di servizi inviate dai clienti tramite portale';
COMMENT ON TABLE messaggi_portale IS 'Messaggi tra clienti e property manager';
COMMENT ON TABLE notifiche_portale IS 'Notifiche per i clienti del portale';

COMMENT ON FUNCTION get_current_contatto_id() IS 'Restituisce il contatto_id dell utente portale autenticato';
COMMENT ON FUNCTION is_portal_user() IS 'Verifica se l utente corrente e un cliente del portale';
