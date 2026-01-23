-- ============================================
-- DATI DI TEST PER HUB PROPERTY MANAGEMENT
-- ============================================
-- Esegui dopo schema.sql per popolare il database con dati di esempio

-- Tenant ID di default (deve corrispondere a DEFAULT_TENANT_ID in supabase.ts)
-- Se vuoi cambiarlo, modifica anche src/lib/supabase.ts

-- ============================================
-- LEAD DI ESEMPIO
-- ============================================
INSERT INTO contatti (tenant_id, tipo, tipo_persona, nome, cognome, email, telefono, citta, provincia, fase_lead, esito_lead, fonte_lead, valore_stimato) VALUES
('00000000-0000-0000-0000-000000000001', 'lead', 'persona_fisica', 'Mario', 'Rossi', 'mario.rossi@email.com', '+39 333 1234567', 'Sondrio', 'SO', 'L1', 'in_corso', 'passaparola', 15000),
('00000000-0000-0000-0000-000000000001', 'lead', 'persona_fisica', 'Laura', 'Bianchi', 'laura.bianchi@email.com', '+39 339 7654321', 'Morbegno', 'SO', 'L2', 'in_corso', 'sito_web', 20000),
('00000000-0000-0000-0000-000000000001', 'lead', 'persona_giuridica', 'Giuseppe', 'Verdi', 'g.verdi@immobiliare.it', '+39 342 9876543', 'Chiavenna', 'SO', 'L0', 'in_corso', 'google', 35000),
('00000000-0000-0000-0000-000000000001', 'lead', 'persona_fisica', 'Anna', 'Neri', 'anna.neri@gmail.com', '+39 347 1112223', 'Lecco', 'LC', 'L3', 'in_corso', 'fiera', 25000);

-- ============================================
-- CLIENTI DI ESEMPIO
-- ============================================
INSERT INTO contatti (tenant_id, tipo, tipo_persona, nome, cognome, email, telefono, citta, provincia, fase_cliente, data_conversione, codice_fiscale) VALUES
('00000000-0000-0000-0000-000000000001', 'cliente', 'persona_fisica', 'Francesco', 'Colombo', 'f.colombo@email.com', '+39 335 4445556', 'Bormio', 'SO', 'C2', '2024-01-15', 'CLMFNC80A01B049Z'),
('00000000-0000-0000-0000-000000000001', 'cliente', 'persona_fisica', 'Elena', 'Ferrari', 'elena.ferrari@pec.it', '+39 338 6667778', 'Livigno', 'SO', 'C1', '2024-03-20', 'FRRLNE85M41L872K'),
('00000000-0000-0000-0000-000000000001', 'cliente', 'persona_giuridica', 'Marco', 'Ricci', 'marco@ricciimmobili.it', '+39 340 8889990', 'Como', 'CO', 'C2', '2023-11-10', 'RCCMRC75D15C933H');

-- ============================================
-- PARTNER DI ESEMPIO
-- ============================================
INSERT INTO contatti (tenant_id, tipo, nome, cognome, email, telefono, citta, provincia, tipo_partner, azienda, specializzazioni, tariffa_default, tariffa_tipo) VALUES
('00000000-0000-0000-0000-000000000001', 'partner', 'Maria', 'Pulizie', 'maria@pulizieperfette.it', '+39 333 1111111', 'Sondrio', 'SO', 'pulizie', 'Pulizie Perfette Srl', 'Appartamenti, B&B, Case vacanza', 50, 'a_chiamata'),
('00000000-0000-0000-0000-000000000001', 'partner', 'Luigi', 'Tecnico', 'luigi@manutenzionitop.it', '+39 333 2222222', 'Morbegno', 'SO', 'manutenzione', 'Manutenzioni Top', 'Idraulica, Elettricità, Piccole riparazioni', 40, 'oraria'),
('00000000-0000-0000-0000-000000000001', 'partner', 'Sara', 'Foto', 'sara@fotografiaimmobiliare.it', '+39 333 3333333', 'Lecco', 'LC', 'fotografo', 'Studio Fotografico Sara', 'Foto professionali, Virtual tour, Droni', 150, 'per_intervento');

-- ============================================
-- PROPRIETA DI ESEMPIO
-- ============================================
-- Prima otteniamo gli ID dei clienti (useremo i primi 2)
DO $$
DECLARE
  cliente1_id UUID;
  cliente2_id UUID;
  prop1_id UUID;
  prop2_id UUID;
BEGIN
  -- Prendi i primi 2 clienti
  SELECT id INTO cliente1_id FROM contatti WHERE tipo = 'cliente' AND tenant_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
  SELECT id INTO cliente2_id FROM contatti WHERE tipo = 'cliente' AND tenant_id = '00000000-0000-0000-0000-000000000001' OFFSET 1 LIMIT 1;

  -- Crea proprietà
  INSERT INTO proprieta (tenant_id, contatto_id, nome, indirizzo, citta, cap, provincia, tipologia, fase, commissione_percentuale, max_ospiti, camere, bagni, mq, cir, wifi_ssid, wifi_password, checkin_orario, checkout_orario)
  VALUES
  ('00000000-0000-0000-0000-000000000001', cliente1_id, 'Chalet Panorama Bormio', 'Via delle Terme 42', 'Bormio', '23032', 'SO', 'chalet', 'P4', 18, 8, 3, 2, 120, 'CIR-SO-12345', 'Chalet_Panorama', 'Welcome2024!', '15:00', '10:00')
  RETURNING id INTO prop1_id;

  INSERT INTO proprieta (tenant_id, contatto_id, nome, indirizzo, citta, cap, provincia, tipologia, fase, commissione_percentuale, max_ospiti, camere, bagni, mq, cir, wifi_ssid, wifi_password, checkin_orario, checkout_orario)
  VALUES
  ('00000000-0000-0000-0000-000000000001', cliente2_id, 'Appartamento Centro Livigno', 'Via Plan 18', 'Livigno', '23041', 'SO', 'appartamento', 'P3', 20, 4, 1, 1, 55, 'CIR-SO-67890', 'Apt_Livigno', 'Skiing2024!', '16:00', '10:00')
  RETURNING id INTO prop2_id;

  -- Crea locali per la prima proprietà
  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, mq, posti_letto) VALUES
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'camera_matrimoniale', 'Camera Master', 25, 2),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'camera_doppia', 'Camera Bambini', 18, 2),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'camera_singola', 'Camera Ospiti', 12, 1),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'soggiorno', 'Soggiorno con Camino', 35, 2),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'cucina', 'Cucina Attrezzata', 15, 0),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'bagno', 'Bagno Principale', 8, 0),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'bagno', 'Bagno Secondario', 5, 0);

  -- Crea locali per la seconda proprietà
  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, mq, posti_letto) VALUES
  ('00000000-0000-0000-0000-000000000001', prop2_id, 'camera_matrimoniale', 'Camera', 16, 2),
  ('00000000-0000-0000-0000-000000000001', prop2_id, 'soggiorno', 'Soggiorno con Divano Letto', 20, 2),
  ('00000000-0000-0000-0000-000000000001', prop2_id, 'cucina', 'Angolo Cottura', 8, 0),
  ('00000000-0000-0000-0000-000000000001', prop2_id, 'bagno', 'Bagno', 6, 0);

  -- Crea prenotazioni per la prima proprietà
  INSERT INTO prenotazioni (tenant_id, proprieta_id, canale, codice_prenotazione, checkin, checkout, ospite_nome, ospite_cognome, ospite_email, ospite_nazione, num_ospiti, importo_lordo, commissione_ota, importo_netto, costo_pulizie, stato) VALUES
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'airbnb', 'HMABCD1234', CURRENT_DATE + 7, CURRENT_DATE + 14, 'John', 'Smith', 'john.smith@email.com', 'UK', 4, 1400, 210, 1190, 80, 'confermata'),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'booking', 'BK9876543', CURRENT_DATE + 21, CURRENT_DATE + 28, 'Hans', 'Mueller', 'hans.m@email.de', 'Germania', 6, 1800, 306, 1494, 80, 'confermata'),
  ('00000000-0000-0000-0000-000000000001', prop1_id, 'direct', 'DIR-001', CURRENT_DATE - 7, CURRENT_DATE - 2, 'Paolo', 'Verdi', 'paolo.v@email.it', 'Italia', 4, 900, 0, 900, 80, 'checkout');

END $$;

-- ============================================
-- TASK DI ESEMPIO
-- ============================================
INSERT INTO task (tenant_id, titolo, descrizione, categoria, stato, priorita, data_scadenza) VALUES
('00000000-0000-0000-0000-000000000001', 'Verificare documentazione Chalet Bormio', 'Controllare che tutti i documenti siano in ordine per la stagione invernale', 'documenti', 'da_fare', 'alta', CURRENT_DATE + 3),
('00000000-0000-0000-0000-000000000001', 'Organizzare pulizie pre-stagione', 'Contattare Maria per le pulizie approfondite', 'setup', 'in_corso', 'media', CURRENT_DATE + 5),
('00000000-0000-0000-0000-000000000001', 'Aggiornare foto appartamento Livigno', 'Fare nuove foto per gli annunci', 'marketing', 'da_fare', 'bassa', CURRENT_DATE + 14),
('00000000-0000-0000-0000-000000000001', 'Rinnovo SCIA Chalet Bormio', 'Verificare scadenza e procedere con il rinnovo', 'pratiche', 'da_fare', 'urgente', CURRENT_DATE + 1),
('00000000-0000-0000-0000-000000000001', 'Chiamare lead Mario Rossi', 'Follow-up sulla presentazione servizi', 'comunicazioni', 'da_fare', 'alta', CURRENT_DATE);

-- ============================================
-- CATALOGO SERVIZI DI ESEMPIO
-- ============================================
INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, attivo, ordine) VALUES
('00000000-0000-0000-0000-000000000001', 'Setup Completo Proprietà', 'Servizio completo di avvio: foto, annunci, configurazione channel manager', 'one_shot', 500, 'fisso', true, 1),
('00000000-0000-0000-0000-000000000001', 'Gestione Annunci', 'Gestione e ottimizzazione annunci su tutte le piattaforme', 'ricorrente', 15, 'percentuale', true, 2),
('00000000-0000-0000-0000-000000000001', 'Servizio Fotografico', 'Shooting professionale con fotografo dedicato', 'one_shot', 250, 'fisso', true, 3),
('00000000-0000-0000-0000-000000000001', 'Virtual Tour 360°', 'Creazione tour virtuale interattivo', 'one_shot', 350, 'fisso', true, 4),
('00000000-0000-0000-0000-000000000001', 'Gestione Check-in/out', 'Servizio di accoglienza e gestione ospiti', 'ricorrente', 30, 'fisso', true, 5),
('00000000-0000-0000-0000-000000000001', 'Pratiche Burocratiche', 'Gestione SCIA, CIR, CIN, Alloggiati Web', 'one_shot', NULL, 'da_quotare', true, 6);

-- ============================================
-- TEMPLATE DOCUMENTI CLIENTE
-- ============================================
INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
-- C0 - Onboarding Cliente
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Documento identità', 'Carta d''identità o passaporto in corso di validità', 'identita', true, 1),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Codice fiscale', 'Tessera sanitaria o certificato codice fiscale', 'fiscale', true, 2),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Visura camerale', 'Visura camerale aggiornata (solo per società, validità 6 mesi)', 'fiscale', false, 3),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Privacy GDPR firmato', 'Informativa privacy e consenso trattamento dati firmato', 'contratti', true, 4),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Dati bancari (IBAN)', 'Coordinate bancarie per accredito compensi', 'fiscale', true, 5),
-- C1 - Setup Servizi
('00000000-0000-0000-0000-000000000001', 'cliente', 'C1', 'Contratto di gestione firmato', 'Contratto di gestione immobiliare firmato da entrambe le parti', 'contratti', true, 1),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C1', 'Procura per pratiche', 'Procura speciale per presentazione pratiche burocratiche (se necessaria)', 'procure', false, 2);

-- ============================================
-- TEMPLATE DOCUMENTI PROPRIETA
-- ============================================
INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
-- P0 - Onboarding Proprietà
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Visura catastale', 'Visura catastale aggiornata dell''immobile', 'proprieta', true, 1),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Planimetria catastale', 'Planimetria catastale con numero civico indicato', 'proprieta', true, 2),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'APE', 'Attestato di Prestazione Energetica in corso di validità (10 anni)', 'certificazioni', true, 3),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Atto di proprietà', 'Rogito notarile o atto di proprietà dell''immobile', 'proprieta', true, 4),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Certificato di agibilità', 'Certificato di agibilità/abitabilità (eccezione ammessa se non disponibile)', 'certificazioni', false, 5),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Conformità impianto elettrico', 'Dichiarazione di conformità impianto elettrico (eccezione ammessa se non disponibile)', 'certificazioni', false, 6),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Libretto caldaia', 'Libretto caldaia con manutenzione in regola (se presente impianto)', 'certificazioni', false, 7),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Regolamento condominiale', 'Regolamento condominiale (se immobile in condominio)', 'proprieta', false, 8),
-- P1 - Setup Legale
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'SCIA protocollata', 'SCIA per locazione turistica protocollata al SUAP', 'legale', true, 1),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Ricevuta SCIA SUAP', 'Ricevuta di protocollazione SCIA dal SUAP', 'legale', true, 2),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Abilitazione ROSS 1000', 'Documento di abilitazione al portale ROSS 1000 dalla Provincia', 'legale', true, 3),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'CIR', 'Codice Identificativo Regionale rilasciato dalla Regione', 'legale', true, 4),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'CIN', 'Codice Identificativo Nazionale (richiesta entro 30gg da ROSS 1000)', 'legale', true, 5),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Registrazione ISTAT iniziale', 'Conferma prima registrazione flussi ISTAT', 'legale', true, 6),
-- P2 - Setup Operativo
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Foto professionali', 'Shooting fotografico professionale dell''immobile', 'marketing', true, 1),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'House manual', 'Welcome book / House manual per gli ospiti', 'operativo', true, 2),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Istruzioni raccolta differenziata', 'Istruzioni per la raccolta differenziata del comune', 'operativo', false, 3),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Contratto pulizie', 'Contratto con partner per servizio pulizie (se applicabile)', 'contratti', false, 4),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Contratto manutenzione', 'Contratto con partner per manutenzione (se applicabile)', 'contratti', false, 5),
-- P3 - Go-Live
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Checklist go-live completata', 'Checklist di verifica completamento setup pre-attivazione', 'operativo', true, 1),
-- P4 - Operativa
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P4', 'Report mensile proprietario', 'Report mensile con riepilogo prenotazioni e incassi', 'operativo', false, 1);

-- ============================================
-- TEMPLATE TASK LEAD
-- ============================================
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
-- L0 - Nuovo Lead
('00000000-0000-0000-0000-000000000001', 'lead', 'L0', 'Registrare dati lead', 'Inserire nome, email, telefono, fonte contatto', 'setup', 1, 1, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L0', 'Fissare appuntamento', 'Contattare il lead per fissare discovery call o sopralluogo', 'comunicazioni', 2, 2, true),
-- L1 - Qualificazione
('00000000-0000-0000-0000-000000000001', 'lead', 'L1', 'Effettuare discovery call', 'Primo incontro per verificare fit reciproco e comprendere esigenze', 'comunicazioni', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L1', 'Valutare proprietà (se sopralluogo)', 'Effettuare sopralluogo per valutare la proprietà', 'verifica', 2, 5, true),
-- L2 - Presentazione
('00000000-0000-0000-0000-000000000001', 'lead', 'L2', 'Preparare proposta commerciale', 'Redigere proposta con servizi, prezzi e commissioni', 'documenti', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L2', 'Inviare proposta e privacy', 'Inviare proposta commerciale e modulo privacy GDPR', 'comunicazioni', 2, 1, true),
-- L3 - Negoziazione
('00000000-0000-0000-0000-000000000001', 'lead', 'L3', 'Follow-up proposta', 'Contattare il lead per discutere la proposta', 'comunicazioni', 1, 2, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L3', 'Negoziare termini', 'Adattare proposta in base alle richieste del cliente', 'comunicazioni', 2, 5, true),
-- L4 - Chiusura
('00000000-0000-0000-0000-000000000001', 'lead', 'L4', 'Raccogliere dati fiscali', 'Richiedere CF, IBAN, P.IVA (se società)', 'documenti', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L4', 'Far firmare privacy', 'Ottenere firma sul modulo privacy GDPR', 'documenti', 2, 3, true),
('00000000-0000-0000-0000-000000000001', 'lead', 'L4', 'Convertire a cliente', 'Convertire il lead in cliente nel sistema', 'setup', 3, 1, true);

-- ============================================
-- TEMPLATE TASK PROPRIETA LEAD
-- ============================================
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
-- PL0 - Nuova Proprietà Lead
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL0', 'Registrare info proprietà', 'Inserire indirizzo, tipologia, info preliminari', 'setup', 1, 1, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL0', 'Schedulare sopralluogo', 'Fissare data e ora per il sopralluogo', 'comunicazioni', 2, 3, true),
-- PL1 - Sopralluogo
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Effettuare sopralluogo', 'Visita fisica della proprietà', 'verifica', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Scattare foto sopralluogo', 'Documentare fotograficamente lo stato dell''immobile', 'verifica', 2, 0, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Verificare dotazioni e stato', 'Controllare arredi, elettrodomestici, stato manutenzione', 'verifica', 3, 0, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL1', 'Identificare investimenti necessari', 'Elencare eventuali interventi da effettuare', 'verifica', 4, 2, true),
-- PL2 - Analisi
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Analisi fattibilità', 'Valutare fattibilità della gestione', 'verifica', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Stima revenue potenziale', 'Calcolare ricavi annui stimati', 'verifica', 2, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL2', 'Analisi competitività zona', 'Studiare concorrenza e posizionamento', 'verifica', 3, 3, true),
-- PL3 - Preventivo
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL3', 'Preparare preventivo dettagliato', 'Redigere proposta con servizi e pricing specifici per proprietà', 'documenti', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL3', 'Inviare preventivo', 'Inviare proposta al cliente', 'comunicazioni', 2, 1, true),
-- PL4 - Chiusura
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL4', 'Confermare o scartare proprietà', 'Definire esito della valutazione', 'verifica', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta_lead', 'PL4', 'Convertire a proprietà cliente', 'Se confermata, creare proprietà cliente in P0', 'setup', 2, 1, true);

-- ============================================
-- TEMPLATE TASK CLIENTE
-- ============================================
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
-- C0 - Onboarding Cliente
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Richiedere documento identità', 'Richiedere copia CI o passaporto in corso di validità', 'documenti', 1, 3, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Richiedere codice fiscale', 'Richiedere copia tessera sanitaria o CF', 'documenti', 2, 3, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Richiedere visura camerale', 'Richiedere visura camerale aggiornata (solo società)', 'documenti', 3, 3, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Far firmare privacy GDPR', 'Ottenere firma informativa privacy', 'documenti', 4, 3, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Richiedere IBAN', 'Richiedere coordinate bancarie per pagamenti', 'documenti', 5, 3, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Setup cartella cliente', 'Creare cartella su Drive/sistema documentale', 'setup', 6, 1, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C0', 'Creare scheda cliente', 'Completare anagrafica cliente nel gestionale', 'setup', 7, 1, true),
-- C1 - Setup Servizi
('00000000-0000-0000-0000-000000000001', 'cliente', 'C1', 'Preparare contratto gestione', 'Redigere contratto di gestione personalizzato', 'documenti', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C1', 'Far firmare contratto', 'Ottenere firma contratto di gestione', 'documenti', 2, 5, true),
('00000000-0000-0000-0000-000000000001', 'cliente', 'C1', 'Richiedere procura (se necessaria)', 'Preparare e far firmare procura per pratiche', 'documenti', 3, 5, true);

-- ============================================
-- TEMPLATE TASK PROPRIETA
-- ============================================
INSERT INTO template_task (tenant_id, tipo_entita, fase, titolo, descrizione, categoria, ordine, giorni_deadline, attivo) VALUES
-- P0 - Onboarding Proprietà
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere visura catastale', 'Richiedere visura catastale aggiornata', 'documenti', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere planimetria catastale', 'Richiedere planimetria con numero civico', 'documenti', 2, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere APE', 'Richiedere Attestato Prestazione Energetica', 'documenti', 3, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere atto proprietà', 'Richiedere copia rogito o atto di proprietà', 'documenti', 4, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere certificato agibilità', 'Richiedere certificato agibilità (se disponibile)', 'documenti', 5, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere conformità elettrica', 'Richiedere dichiarazione conformità impianto (se disponibile)', 'documenti', 6, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere libretto caldaia', 'Richiedere libretto caldaia (se presente impianto)', 'documenti', 7, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Richiedere regolamento condominiale', 'Richiedere regolamento (se in condominio)', 'documenti', 8, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Inserire dati catastali', 'Completare foglio, mappale, subalterno, categoria', 'setup', 9, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Censire locali', 'Inserire elenco locali con mq e posti letto', 'setup', 10, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P0', 'Inserire dati operativi', 'Completare WiFi, codici accesso, regole casa', 'setup', 11, 3, true),
-- P1 - Setup Legale
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Preparare SCIA', 'Compilare modulo SCIA per locazione turistica', 'pratiche', 1, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Protocollare SCIA al SUAP', 'Inviare SCIA al SUAP del comune', 'pratiche', 2, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Attendere abilitazione ROSS 1000', 'Attendere abilitazione dalla Provincia', 'pratiche', 3, 15, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Richiedere CIR', 'Richiedere Codice Identificativo Regionale', 'pratiche', 4, 10, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Richiedere CIN', 'Richiedere CIN entro 30 giorni da ROSS 1000', 'pratiche', 5, 30, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Attivare Alloggiati Web', 'Configurare accesso portale Alloggiati', 'pratiche', 6, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Effettuare registrazione ISTAT iniziale', 'Prima registrazione flussi ISTAT', 'pratiche', 7, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Inserire credenziali Alloggiati', 'Salvare username/password Alloggiati nella scheda', 'setup', 8, 1, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Inserire credenziali ROSS 1000', 'Salvare username/password ROSS nella scheda', 'setup', 9, 1, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Inserire CIR nella scheda', 'Aggiornare codice CIR nella scheda proprietà', 'setup', 10, 1, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P1', 'Inserire CIN nella scheda', 'Aggiornare codice CIN nella scheda proprietà', 'setup', 11, 1, true),
-- P2 - Setup Operativo
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Organizzare shooting fotografico', 'Coordinare servizio foto professionali', 'setup', 1, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Creare annunci OTA', 'Pubblicare annunci su Airbnb, Booking, etc.', 'setup', 2, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Configurare channel manager', 'Setup proprietà sul channel manager', 'setup', 3, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Configurare pricing', 'Impostare tariffe e stagionalità', 'setup', 4, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Creare house manual', 'Redigere welcome book per ospiti', 'documenti', 5, 7, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Preparare istruzioni rifiuti', 'Creare documento raccolta differenziata', 'documenti', 6, 3, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Assegnare partner pulizie', 'Definire partner per servizio pulizie', 'setup', 7, 5, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P2', 'Assegnare partner manutenzione', 'Definire partner per manutenzione', 'setup', 8, 5, true),
-- P3 - Go-Live
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Verificare checklist go-live', 'Controllare completamento di tutti gli step', 'verifica', 1, 2, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Attivare annunci', 'Rendere visibili gli annunci sulle OTA', 'setup', 2, 1, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Test prenotazione', 'Effettuare test di prenotazione', 'verifica', 3, 2, true),
('00000000-0000-0000-0000-000000000001', 'proprieta', 'P3', 'Comunicare go-live al proprietario', 'Informare il cliente dell''attivazione', 'comunicazioni', 4, 1, true);

-- ============================================
-- FINE SEED DATA
-- ============================================
