-- Migrazione per collegare erogazioni alle proposte commerciali
-- e permettere servizi singoli (senza pacchetto)

-- 1. Rendi pacchetto_id nullable per permettere "contenitori" di servizi singoli
ALTER TABLE erogazione_pacchetti
ALTER COLUMN pacchetto_id DROP NOT NULL;

-- 2. Aggiungi colonna proposta_id per tracciare l'origine dell'erogazione
ALTER TABLE erogazione_pacchetti
ADD COLUMN IF NOT EXISTS proposta_id UUID REFERENCES proposte_commerciali(id) ON DELETE SET NULL;

-- 3. Crea indice per proposta_id
CREATE INDEX IF NOT EXISTS idx_erogazione_pacchetti_proposta ON erogazione_pacchetti(proposta_id);

-- 4. Aggiorna il constraint UNIQUE per permettere servizi singoli (pacchetto_id NULL)
-- Prima rimuovi il vecchio constraint
ALTER TABLE erogazione_pacchetti
DROP CONSTRAINT IF EXISTS erogazione_pacchetti_proprieta_id_pacchetto_id_key;

-- Crea un nuovo constraint che permette multipli NULL per pacchetto_id
-- (con UNIQUE, NULL values sono considerati diversi, quindi non serve cambio)
-- Ma aggiungiamo un constraint parziale per i pacchetti non-null
CREATE UNIQUE INDEX IF NOT EXISTS idx_erogazione_pacchetti_unique_pacchetto
ON erogazione_pacchetti(proprieta_id, pacchetto_id)
WHERE pacchetto_id IS NOT NULL;

-- Commento esplicativo
COMMENT ON COLUMN erogazione_pacchetti.pacchetto_id IS
'NULL per contenitori di servizi singoli, non-NULL per pacchetti dal catalogo';

COMMENT ON COLUMN erogazione_pacchetti.proposta_id IS
'Riferimento alla proposta commerciale che ha generato questa erogazione';
