-- ============================================
-- MIGRAZIONE: Aggiornamento fasi Lead e Proprietà Lead v2
-- ============================================
--
-- Fasi Lead (invariate):
-- L0: Nuovo Lead
-- L1: Contattato
-- L2: In Valutazione
-- L3: Qualificato (pronto per conversione)
--
-- Fasi Proprietà Lead (aggiornate, rimossa PL4):
-- PL0: Registrata
-- PL1: Info Raccolte
-- PL2: Sopralluogo
-- PL3: Valutata (ultima fase, pronta per proposta post-conversione)
--
-- Motivi Lead Perso:
-- prezzo, competitor, non_risponde, tempistiche, proprieta_non_idonea, cambio_idea, altro

-- ============================================
-- 1. Aggiornamento fasi Proprietà Lead (rimuovi PL4)
-- ============================================

-- Migra eventuali proprietà in PL4 a PL3
UPDATE proprieta_lead SET fase = 'PL3' WHERE fase = 'PL4';

-- Aggiorna il vincolo CHECK (rimuovi PL4)
ALTER TABLE proprieta_lead DROP CONSTRAINT IF EXISTS proprieta_lead_fase_check;
ALTER TABLE proprieta_lead ADD CONSTRAINT proprieta_lead_fase_check
  CHECK (fase IN ('PL0', 'PL1', 'PL2', 'PL3'));

-- ============================================
-- 2. Aggiunta colonna motivo_perso tipizzata per lead
-- ============================================

-- La colonna motivo_perso esiste già come TEXT, aggiungiamo un CHECK constraint
-- per validare i valori ammessi (ma permettiamo anche valori custom per retrocompatibilità)
-- Non aggiungiamo constraint per permettere note libere nel campo esistente

-- Invece aggiungiamo una nuova colonna per il motivo codificato
ALTER TABLE contatti
ADD COLUMN IF NOT EXISTS motivo_perso_codice VARCHAR(50);

-- Aggiungiamo il CHECK constraint per i valori validi
ALTER TABLE contatti DROP CONSTRAINT IF EXISTS contatti_motivo_perso_codice_check;
ALTER TABLE contatti ADD CONSTRAINT contatti_motivo_perso_codice_check
  CHECK (motivo_perso_codice IS NULL OR motivo_perso_codice IN (
    'prezzo', 'competitor', 'non_risponde', 'tempistiche',
    'proprieta_non_idonea', 'cambio_idea', 'altro'
  ));

-- ============================================
-- 3. Aggiornamento template task per lead (nuove descrizioni)
-- ============================================

-- Elimina vecchi template task per lead
DELETE FROM task
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'lead'
)
AND stato != 'completato';

-- Rimuovi riferimento template per task completati
UPDATE task
SET template_id = NULL
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'lead'
)
AND stato = 'completato';

-- Elimina template vecchi
DELETE FROM template_task WHERE tipo_entita = 'lead';

-- Inserisci nuovi template task per fasi lead
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  -- L0: Nuovo Lead
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L0', 'Prima chiamata di qualifica', 'Effettuare chiamata telefonica per verificare interesse e raccogliere info base', 'comunicazioni', 1, 1, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L0', 'Registrare fonte lead', 'Annotare da dove arriva il lead (campagna, passaparola, sito, etc.)', 'altro', 2, 1, true),

  -- L1: Contattato
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L1', 'Aggiungere proprietà lead', 'Registrare almeno una proprietà del lead da valutare', 'setup', 1, 3, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L1', 'Raccogliere dati proprietà', 'Richiedere foto, planimetrie e info sulla proprietà', 'documenti', 2, 5, true),

  -- L2: In Valutazione
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L2', 'Pianificare sopralluogo', 'Fissare appuntamento per visita proprietà', 'pratiche', 1, 3, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L2', 'Effettuare sopralluogo', 'Visitare la proprietà e completare valutazione tecnica', 'verifica', 2, 7, true),

  -- L3: Qualificato
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L3', 'Preparare per conversione', 'Verificare che tutti i dati siano completi per onboarding cliente', 'verifica', 1, 2, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'L3', 'Convertire a cliente', 'Avviare processo di onboarding cliente', 'pratiche', 2, 3, true);

-- ============================================
-- 4. Aggiornamento template task per proprietà lead
-- ============================================

-- Elimina vecchi template task per proprieta_lead
DELETE FROM task
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'proprieta_lead'
)
AND stato != 'completato';

UPDATE task
SET template_id = NULL
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'proprieta_lead'
)
AND stato = 'completato';

DELETE FROM template_task WHERE tipo_entita = 'proprieta_lead';

-- Inserisci nuovi template task per fasi proprietà lead
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  -- PL0: Registrata
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL0', 'Inserire dati base', 'Completare indirizzo, tipologia e dati principali', 'setup', 1, 1, true),

  -- PL1: Info Raccolte
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Richiedere foto proprietà', 'Ottenere foto degli ambienti principali', 'documenti', 1, 3, true),
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Raccogliere planimetria', 'Ottenere planimetria o disegno degli spazi', 'documenti', 2, 5, true),
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Compilare caratteristiche', 'Annotare dotazioni, servizi e caratteristiche speciali', 'setup', 3, 3, true),

  -- PL2: Sopralluogo
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Fissare appuntamento sopralluogo', 'Concordare data e ora per la visita', 'comunicazioni', 1, 2, true),
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Eseguire sopralluogo', 'Visitare proprietà e verificare stato reale', 'verifica', 2, 5, true),
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Compilare note sopralluogo', 'Documentare osservazioni e foto durante visita', 'documenti', 3, 1, true),

  -- PL3: Valutata
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL3', 'Stimare revenue annuo', 'Calcolare potenziale di guadagno della proprietà', 'verifica', 1, 2, true),
  ('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL3', 'Valutare investimenti necessari', 'Identificare eventuali interventi richiesti', 'verifica', 2, 2, true);

-- ============================================
-- 5. Commento finale
-- ============================================
-- Migrazione completata. Le fasi sono ora:
-- Lead: L0 (Nuovo) → L1 (Contattato) → L2 (In Valutazione) → L3 (Qualificato) → Conversione a Cliente
-- Proprietà Lead: PL0 (Registrata) → PL1 (Info Raccolte) → PL2 (Sopralluogo) → PL3 (Valutata)
