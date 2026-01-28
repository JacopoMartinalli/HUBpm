-- Appointments (Appuntamenti) Tables
-- Adds calendar scheduling functionality for leads and properties

-- Create enum types
DO $$ BEGIN
    CREATE TYPE tipo_appuntamento AS ENUM ('sopralluogo', 'telefonata', 'videochiamata', 'riunione', 'altro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stato_appuntamento AS ENUM ('proposto', 'confermato', 'completato', 'annullato', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main appointments table
CREATE TABLE IF NOT EXISTS appuntamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Relations (optional, at least one recommended)
    contatto_id UUID REFERENCES contatti(id) ON DELETE SET NULL,
    proprieta_id UUID REFERENCES proprieta(id) ON DELETE SET NULL,
    proprieta_lead_id UUID REFERENCES proprieta_lead(id) ON DELETE SET NULL,
    
    -- Appointment data
    titolo TEXT NOT NULL,
    descrizione TEXT,
    tipo tipo_appuntamento NOT NULL DEFAULT 'sopralluogo',
    stato stato_appuntamento NOT NULL DEFAULT 'proposto',
    
    -- Date/time
    data_inizio TIMESTAMPTZ NOT NULL,
    data_fine TIMESTAMPTZ NOT NULL,
    tutto_il_giorno BOOLEAN DEFAULT FALSE,
    
    -- Location/mode
    luogo TEXT,
    note TEXT,
    
    -- Reminders/invites (for future use)
    promemoria_minuti INT,
    invito_inviato BOOLEAN DEFAULT FALSE,
    invito_accettato BOOLEAN,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template for auto-generating appointment suggestions on phase changes
CREATE TABLE IF NOT EXISTS template_appuntamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Trigger: when to generate
    tipo_entita TEXT NOT NULL,  -- 'lead' | 'proprieta_lead'
    fase_trigger TEXT NOT NULL,  -- 'L1' | 'P0' etc.
    
    -- Template data
    titolo TEXT NOT NULL,
    descrizione TEXT,
    tipo tipo_appuntamento NOT NULL DEFAULT 'sopralluogo',
    durata_minuti INT DEFAULT 60,
    
    attivo BOOLEAN DEFAULT TRUE,
    ordine INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appuntamento_tenant ON appuntamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appuntamento_data ON appuntamento(data_inizio);
CREATE INDEX IF NOT EXISTS idx_appuntamento_contatto ON appuntamento(contatto_id);
CREATE INDEX IF NOT EXISTS idx_appuntamento_proprieta ON appuntamento(proprieta_id);
CREATE INDEX IF NOT EXISTS idx_appuntamento_proprieta_lead ON appuntamento(proprieta_lead_id);
CREATE INDEX IF NOT EXISTS idx_appuntamento_stato ON appuntamento(stato);

CREATE INDEX IF NOT EXISTS idx_template_appuntamento_tenant ON template_appuntamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_appuntamento_trigger ON template_appuntamento(tipo_entita, fase_trigger);

-- RLS Policies
ALTER TABLE appuntamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_appuntamento ENABLE ROW LEVEL SECURITY;

-- Appuntamento policies
DROP POLICY IF EXISTS "Allow all appuntamento" ON appuntamento;
CREATE POLICY "Allow all appuntamento" ON appuntamento FOR ALL USING (true) WITH CHECK (true);

-- Template appuntamento policies
DROP POLICY IF EXISTS "Allow all template_appuntamento" ON template_appuntamento;
CREATE POLICY "Allow all template_appuntamento" ON template_appuntamento FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_appuntamento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appuntamento_updated_at ON appuntamento;
CREATE TRIGGER appuntamento_updated_at
    BEFORE UPDATE ON appuntamento
    FOR EACH ROW
    EXECUTE FUNCTION update_appuntamento_updated_at();

-- Insert default template for L1 (site visit suggestion)
-- Using property_manager as a way to find existing tenant_ids
INSERT INTO template_appuntamento (tenant_id, tipo_entita, fase_trigger, titolo, descrizione, tipo, durata_minuti, ordine)
SELECT 
    tenant_id,
    'lead',
    'L1',
    'Sopralluogo proprietà',
    'Programma una visita per valutare la proprietà del cliente',
    'sopralluogo',
    60,
    1
FROM property_manager
ON CONFLICT DO NOTHING;

