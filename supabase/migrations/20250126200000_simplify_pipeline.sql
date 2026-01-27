-- ============================================
-- SEMPLIFICAZIONE PIPELINE
-- ============================================
-- Lead: L0 (Nuovo) → L1 (Qualificato) - solo 2 fasi
-- Proprietà: P0-P5 (pipeline principale del business)
-- Cliente: stato derivato (ha proprietà in P3+)

-- 1. Aggiorna i lead con fasi obsolete
-- L2 e L3 diventano L1 (qualificato)
UPDATE contatti
SET fase_lead = 'L1'
WHERE tipo = 'lead'
AND fase_lead IN ('L2', 'L3');

-- 2. Rimuovi il vincolo FK sui task per poter eliminare i template
-- Prima salviamo i task esistenti scollegandoli dai template che verranno eliminati
UPDATE task
SET template_id = NULL
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'lead' AND fase IN ('L2', 'L3')
);

UPDATE task
SET template_id = NULL
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'cliente' AND fase IN ('C1', 'C2', 'C3')
);

UPDATE task
SET template_id = NULL
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'proprieta'
);

UPDATE task
SET template_id = NULL
WHERE template_id IN (
  SELECT id FROM template_task
  WHERE tipo_entita = 'lead'
);

-- 3. Aggiorna template_task per le nuove fasi lead
-- Rimuovi template per L2 e L3 (non più esistenti)
DELETE FROM template_task
WHERE tipo_entita = 'lead'
AND fase IN ('L2', 'L3');

-- 4. Pulizia: rimuovi template_task per fasi cliente obsolete
-- Manteniamo solo C0 come placeholder
DELETE FROM template_task
WHERE tipo_entita = 'cliente'
AND fase IN ('C1', 'C2', 'C3');

-- 5. Crea nuovi template task per la pipeline proprietà semplificata
-- Prima rimuoviamo i vecchi template proprietà
DELETE FROM template_task WHERE tipo_entita = 'proprieta';

-- Inserisci template per P0 (Valutazione)
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P0', 'Fissare appuntamento sopralluogo', 'Concordare data e ora per visita alla proprietà', 'comunicazioni', 1, 3, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P0', 'Effettuare sopralluogo', 'Visitare la proprietà e valutare fattibilità', 'verifica', 2, 7, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P0', 'Raccogliere dati proprietà', 'Metratura, stanze, dotazioni, foto preliminari', 'documenti', 3, 7, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P0', 'Analisi mercato e revenue stimato', 'Valutare potenziale di guadagno e commissioni', 'verifica', 4, 10, true);

-- Inserisci template per P1 (Proposta)
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P1', 'Preparare proposta commerciale', 'Creare proposta con servizi e pacchetti', 'documenti', 1, 5, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P1', 'Inviare proposta al proprietario', 'Presentare e spiegare la proposta', 'comunicazioni', 2, 3, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P1', 'Follow-up proposta', 'Verificare ricezione e rispondere a domande', 'comunicazioni', 3, 7, true);

-- Inserisci template per P2 (Onboarding - proposta accettata)
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P2', 'Firmare contratto di gestione', 'Ottenere firma su contratto e mandato', 'documenti', 1, 7, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P2', 'Raccogliere documenti proprietà', 'Visura, planimetria, APE, certificazioni', 'documenti', 2, 14, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P2', 'Raccogliere documenti proprietario', 'Documento identità, codice fiscale, IBAN', 'documenti', 3, 14, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P2', 'Definire commissione e servizi', 'Confermare dettagli economici', 'setup', 4, 7, true);

-- Inserisci template per P3 (Setup)
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Presentare SCIA', 'Avviare pratica SCIA al comune', 'pratiche', 1, 14, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Ottenere CIR', 'Richiedere Codice Identificativo Regionale', 'pratiche', 2, 21, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Ottenere CIN', 'Richiedere Codice Identificativo Nazionale', 'pratiche', 3, 30, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Attivare Alloggiati Web', 'Registrazione al portale Alloggiati', 'pratiche', 4, 14, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Shooting fotografico', 'Organizzare servizio foto professionale', 'setup', 5, 21, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Creare annunci OTA', 'Pubblicare su Airbnb, Booking, etc.', 'setup', 6, 28, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Configurare channel manager', 'Collegare calendari e sincronizzare', 'setup', 7, 28, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P3', 'Test prenotazione', 'Verificare flusso completo con prenotazione test', 'verifica', 8, 30, true);

-- Inserisci template per P4 (Operativa)
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P4', 'Monitoraggio prezzi mensile', 'Verificare e ottimizzare pricing', 'verifica', 1, 30, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proprieta', 'P4', 'Report mensile proprietario', 'Preparare e inviare report performance', 'comunicazioni', 2, 30, true);

-- 6. Aggiorna template_task per lead semplificato
DELETE FROM template_task WHERE tipo_entita = 'lead';

-- L0: Nuovo Lead
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'lead', 'L0', 'Prima chiamata di qualifica', 'Contattare il lead e verificare interesse', 'comunicazioni', 1, 2, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'lead', 'L0', 'Registrare dati proprietà', 'Raccogliere info base sulla proprietà interessata', 'documenti', 2, 3, true);

-- L1: Qualificato (pronto per creare proprietà)
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'lead', 'L1', 'Creare proprietà nel sistema', 'Registrare la proprietà per avviare valutazione', 'setup', 1, 3, true);

-- 7. Logica "cliente derivato":
-- Un contatto è considerato "cliente" quando:
-- - tipo = 'cliente' OPPURE
-- - ha almeno una proprietà con fase IN ('P3', 'P4')
-- Questo viene gestito a livello applicativo, non serve modifica DB
