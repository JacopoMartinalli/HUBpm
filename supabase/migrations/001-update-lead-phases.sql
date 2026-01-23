-- ============================================
-- MIGRAZIONE: Aggiornamento fasi Lead (L0-L3 invece di L0-L4)
-- ============================================
-- Le fasi Lead ora sono:
-- L0: Primo Contatto
-- L1: Qualifica in Corso
-- L2: Lead Qualificato
-- L3: Pronto Conversione
--
-- Nota: Se ci sono lead in fase L4, vanno migrati a L3 prima di eseguire

-- Prima verifica se ci sono lead in L4
-- SELECT COUNT(*) FROM contatti WHERE fase_lead = 'L4';

-- Se ci sono, migra a L3
UPDATE contatti SET fase_lead = 'L3' WHERE fase_lead = 'L4';

-- Aggiorna il vincolo CHECK (rimuovi L4)
ALTER TABLE contatti DROP CONSTRAINT IF EXISTS contatti_fase_lead_check;
ALTER TABLE contatti ADD CONSTRAINT contatti_fase_lead_check
  CHECK (fase_lead IN ('L0', 'L1', 'L2', 'L3'));

-- IMPORTANTE: Prima gestire i task che referenziano i template, poi eliminare i template
-- Per i task completati: rimuovi il riferimento al template (mantieni lo storico)
UPDATE task
SET template_id = NULL
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'lead' AND tenant_id = '00000000-0000-0000-0000-000000000001'
)
AND stato = 'completato';

-- Per i task non completati: elimina (verranno rigenerati con i nuovi template)
DELETE FROM task
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'lead' AND tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- Ora possiamo eliminare i vecchi template task per lead
DELETE FROM template_task WHERE tipo_entita = 'lead' AND tenant_id = '00000000-0000-0000-0000-000000000001';
