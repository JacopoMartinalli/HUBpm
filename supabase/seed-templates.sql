-- ============================================
-- HUB PM - TEMPLATE TASK E DOCUMENTI
-- ============================================
-- Esegui questo script dopo schema.sql per popolare i template
-- Tenant ID di default: 00000000-0000-0000-0000-000000000001

-- Pulisci template esistenti (opzionale, decommenta se necessario)
-- DELETE FROM template_task WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- DELETE FROM template_documenti WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- TEMPLATE TASK - LEAD
-- ============================================

-- L0: Primo Contatto
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'lead', 'L0', 'Registrare dati lead', 'Inserire nome, cognome, telefono, email e fonte del contatto', 'setup', 1, 1, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L0', 'Primo contatto / Discovery call', 'Contattare il lead per capire esigenze, proprieta e interesse', 'comunicazioni', 2, 3, true);

-- L1: Qualifica in Corso
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'lead', 'L1', 'Fissare incontro (studio o sopralluogo)', 'Organizzare un incontro in studio o direttamente sulla proprieta', 'comunicazioni', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L1', 'Effettuare incontro', 'Incontrare il lead per valutazione e interesse reciproco', 'verifica', 2, 7, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L1', 'Aggiungere proprieta lead al sistema', 'Inserire almeno una proprieta lead con i dati base', 'setup', 3, 5, true);

-- L2: Lead Qualificato
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'lead', 'L2', 'Monitorare qualifica proprieta', 'Verificare avanzamento qualifica delle proprieta lead associate', 'verifica', 1, NULL, true);

-- L3: Pronto Conversione (nessun task specifico, la conversione avviene manualmente)

-- ============================================
-- TEMPLATE TASK - PROPRIETA LEAD
-- ============================================

-- PL0: Registrata
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL0', 'Inserire dati base proprieta', 'Compilare indirizzo, citta, tipologia della proprieta', 'setup', 1, 1, true);

-- PL1: Raccolta Info
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Richiedere foto proprieta', 'Chiedere al lead di inviare foto degli interni e esterni', 'comunicazioni', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Raccogliere info struttura', 'Mq, numero camere, bagni, piano, dotazioni principali', 'setup', 2, 5, true);

-- PL2: Valutazione
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Analizzare potenziale revenue', 'Stimare revenue annuo basandosi su zona, tipologia e caratteristiche', 'verifica', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Fissare sopralluogo', 'Organizzare visita fisica alla proprieta', 'comunicazioni', 2, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Effettuare sopralluogo', 'Visitare la proprieta, scattare foto, verificare stato', 'verifica', 3, 10, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Decidere se procedere', 'Valutare se la proprieta ha potenziale e se procedere con proposta', 'verifica', 4, 12, true);

-- PL3: Proposta
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL3', 'Preparare proposta commerciale', 'Definire commissione, servizi inclusi, condizioni contrattuali', 'documenti', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL3', 'Presentare proposta al lead', 'Illustrare la proposta e rispondere a domande', 'comunicazioni', 2, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL3', 'Negoziare condizioni', 'Eventuale trattativa su commissioni o servizi', 'comunicazioni', 3, 10, true);

-- PL4: Qualificata (proposta accettata, pronta per onboarding)
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL4', 'Confermare accettazione proposta', 'Verificare che il lead abbia accettato formalmente la proposta', 'verifica', 1, 3, true);

-- ============================================
-- TEMPLATE TASK - CLIENTE
-- ============================================

-- C0: Onboarding
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Raccogliere dati fiscali', 'Codice fiscale, partita IVA (se applicabile), indirizzo di fatturazione', 'documenti', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Far firmare trattamento dati', 'Inviare e far firmare informativa privacy e consenso trattamento dati', 'documenti', 2, 5, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Far firmare contratto di gestione', 'Inviare e far firmare il contratto di property management', 'documenti', 3, 7, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Raccogliere documenti identita', 'Carta identita o passaporto del cliente', 'documenti', 4, 7, true);

-- C1: Servizi
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'cliente', 'C1', 'Configurare accesso portale', 'Creare account cliente per accesso a reportistica e documenti', 'setup', 1, 3, true);

-- ============================================
-- TEMPLATE TASK - PROPRIETA
-- ============================================

-- P0: Onboarding
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Raccogliere visura catastale', 'Richiedere visura catastale aggiornata', 'documenti', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Raccogliere planimetria', 'Richiedere planimetria catastale', 'documenti', 2, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Raccogliere APE', 'Richiedere Attestato Prestazione Energetica', 'documenti', 3, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Compilare scheda proprieta', 'Inserire tutti i dettagli strutturali nel sistema', 'setup', 4, 3, true);

-- P1: Setup Legale
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Preparare e inviare SCIA', 'Compilare e inviare SCIA al comune competente', 'pratiche', 1, 10, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Ottenere CIR', 'Richiedere e ottenere Codice Identificativo Regionale', 'pratiche', 2, 15, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Ottenere CIN', 'Richiedere e ottenere Codice Identificativo Nazionale', 'pratiche', 3, 20, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Attivare Alloggiati Web', 'Registrare la struttura su Alloggiati Web', 'pratiche', 4, 15, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Attivare ROSS1000', 'Registrare la struttura su ROSS1000 (se in Lombardia)', 'pratiche', 5, 15, true);

-- P2: Setup Operativo
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Organizzare servizio fotografico', 'Pianificare shooting professionale della proprieta', 'setup', 1, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Creare annuncio Airbnb', 'Configurare listing completo su Airbnb', 'setup', 2, 10, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Creare annuncio Booking', 'Configurare listing completo su Booking.com', 'setup', 3, 10, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Configurare channel manager', 'Collegare proprieta al channel manager e sincronizzare calendari', 'setup', 4, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Definire prezzi e stagionalita', 'Impostare tariffe base e variazioni stagionali', 'setup', 5, 5, true);

-- P3: Go-Live
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Attivare annunci', 'Rendere visibili gli annunci su tutte le piattaforme', 'setup', 1, 2, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Test prenotazione', 'Effettuare prenotazione di test per verificare il flusso', 'verifica', 2, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Assegnare team pulizie', 'Collegare partner pulizie alla proprieta', 'setup', 3, 5, true);

-- ============================================
-- TEMPLATE DOCUMENTI - CLIENTE
-- ============================================

-- C0: Onboarding
INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Documento identita', 'Carta identita o passaporto del cliente', 'identita', true, 1),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Codice fiscale', 'Tessera sanitaria o documento con CF', 'fiscale', true, 2),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Consenso trattamento dati', 'Informativa privacy firmata', 'contratti', true, 3),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Contratto di gestione', 'Contratto di property management firmato', 'contratti', true, 4),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Visura camerale', 'Solo per societa - visura CCIAA', 'fiscale', false, 5);

-- ============================================
-- TEMPLATE DOCUMENTI - PROPRIETA
-- ============================================

-- P0: Onboarding
INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Visura catastale', 'Visura catastale aggiornata', 'proprieta', true, 1),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Planimetria catastale', 'Planimetria depositata al catasto', 'proprieta', true, 2),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'APE', 'Attestato Prestazione Energetica', 'certificazioni', true, 3),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Atto di proprieta', 'Rogito o atto di compravendita', 'proprieta', false, 4),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Procura speciale', 'Se il cliente non e proprietario diretto', 'procure', false, 5);

-- P1: Setup Legale
INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'SCIA protocollata', 'Ricevuta SCIA con numero protocollo', 'legale', true, 1),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Certificato CIR', 'Certificato Codice Identificativo Regionale', 'legale', true, 2),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Certificato CIN', 'Certificato Codice Identificativo Nazionale', 'legale', true, 3),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Registrazione Alloggiati', 'Conferma registrazione Alloggiati Web', 'legale', true, 4),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Assicurazione RC', 'Polizza responsabilita civile', 'certificazioni', false, 5);

-- P2: Setup Operativo
INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Foto professionali', 'Set completo foto professionali', 'marketing', true, 1),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Contratto Airbnb', 'Termini accettati piattaforma', 'operativo', false, 2),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Contratto Booking', 'Termini accettati piattaforma', 'operativo', false, 3);

-- ============================================
-- FINE SEED
-- ============================================
