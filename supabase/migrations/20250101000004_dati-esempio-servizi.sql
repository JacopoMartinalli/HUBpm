-- ============================================
-- MIGRAZIONE: Dati Esempio Servizi e Task
-- ============================================
-- Popola il catalogo con servizi e template task predefiniti
-- basati sull'architettura HUBpm
-- ============================================

-- Variabili per tenant e categoria
DO $$
DECLARE
  v_tenant_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_cat_pratiche UUID;
  v_cat_marketing UUID;
  v_cat_setup UUID;
  v_cat_gestione UUID;

  -- Servizi
  v_serv_scia UUID;
  v_serv_cir UUID;
  v_serv_cin UUID;
  v_serv_alloggiati UUID;
  v_serv_shooting UUID;
  v_serv_editing UUID;
  v_serv_airbnb UUID;
  v_serv_booking UUID;
  v_serv_channel UUID;
  v_serv_checkin UUID;
  v_serv_accoglienza UUID;

  -- Pacchetti
  v_pack_legale UUID;
  v_pack_foto UUID;
  v_pack_ota UUID;
  v_pack_gestione UUID;

BEGIN
  -- ============================================
  -- OTTIENI ID CATEGORIE ESISTENTI
  -- ============================================

  SELECT id INTO v_cat_pratiche FROM categorie_servizi
    WHERE nome = 'Pratiche Burocratiche' AND tenant_id = v_tenant_id;

  SELECT id INTO v_cat_marketing FROM categorie_servizi
    WHERE nome = 'Marketing' AND tenant_id = v_tenant_id;

  SELECT id INTO v_cat_setup FROM categorie_servizi
    WHERE nome = 'Setup Iniziale' AND tenant_id = v_tenant_id;

  SELECT id INTO v_cat_gestione FROM categorie_servizi
    WHERE nome = 'Gestione Operativa' AND tenant_id = v_tenant_id;

  -- ============================================
  -- SERVIZI: PRATICHE BUROCRATICHE
  -- ============================================

  -- SCIA/SUAP
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Pratica SCIA/SUAP', 'Presentazione SCIA al comune per attività ricettiva', 'one_shot', 150.00, 'fisso', v_cat_pratiche, 15, TRUE, 1)
  RETURNING id INTO v_serv_scia;

  -- Template task per SCIA
  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_scia, 'Raccolta documenti proprietà', 'Visura catastale, planimetria, APE', 'manuale', 1, 3, TRUE),
    (v_tenant_id, v_serv_scia, 'Verifica requisiti urbanistici', 'Controllo destinazione uso e conformità', 'manuale', 2, 5, TRUE),
    (v_tenant_id, v_serv_scia, 'Compilazione modulistica SUAP', 'Preparazione moduli per il comune', 'manuale', 3, 7, TRUE),
    (v_tenant_id, v_serv_scia, 'Invio pratica al comune', 'Trasmissione telematica SUAP', 'manuale', 4, 10, TRUE),
    (v_tenant_id, v_serv_scia, 'Attesa conferma protocollo', 'Ricezione numero protocollo dal comune', 'manuale', 5, 15, TRUE);

  -- CIR Regionale
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Registrazione CIR Regionale', 'Codice Identificativo Regionale per strutture ricettive', 'one_shot', 100.00, 'fisso', v_cat_pratiche, 10, TRUE, 2)
  RETURNING id INTO v_serv_cir;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_cir, 'Registrazione portale regionale', 'Accesso e registrazione al portale della regione', 'manuale', 1, 2, TRUE),
    (v_tenant_id, v_serv_cir, 'Inserimento dati struttura', 'Compilazione scheda struttura ricettiva', 'manuale', 2, 5, TRUE),
    (v_tenant_id, v_serv_cir, 'Upload documenti richiesti', 'Caricamento SCIA, planimetrie, foto', 'manuale', 3, 7, TRUE),
    (v_tenant_id, v_serv_cir, 'Ricezione codice CIR', 'Ottenimento codice identificativo', 'manuale', 4, 10, TRUE);

  -- CIN Nazionale
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Registrazione CIN Nazionale', 'Codice Identificativo Nazionale - BDSR', 'one_shot', 80.00, 'fisso', v_cat_pratiche, 7, TRUE, 3)
  RETURNING id INTO v_serv_cin;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_cin, 'Accesso BDSR', 'Login al portale BDSR ministeriale', 'manuale', 1, 1, TRUE),
    (v_tenant_id, v_serv_cin, 'Inserimento dati catastali', 'Compilazione dati immobile', 'manuale', 2, 3, TRUE),
    (v_tenant_id, v_serv_cin, 'Collegamento CIR', 'Associazione con codice regionale', 'manuale', 3, 5, TRUE),
    (v_tenant_id, v_serv_cin, 'Generazione CIN', 'Ottenimento codice nazionale', 'automatica', 4, 7, TRUE);

  -- Alloggiati Web
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Attivazione Alloggiati Web', 'Configurazione portale PS per comunicazione ospiti', 'one_shot', 70.00, 'fisso', v_cat_pratiche, 5, TRUE, 4)
  RETURNING id INTO v_serv_alloggiati;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_alloggiati, 'Richiesta credenziali Questura', 'Invio richiesta accesso al portale', 'manuale', 1, 2, TRUE),
    (v_tenant_id, v_serv_alloggiati, 'Ricezione credenziali', 'Attesa credenziali dalla Questura', 'manuale', 2, 5, TRUE),
    (v_tenant_id, v_serv_alloggiati, 'Configurazione account', 'Setup struttura su Alloggiati Web', 'manuale', 3, 5, TRUE),
    (v_tenant_id, v_serv_alloggiati, 'Test invio schedine', 'Verifica funzionamento sistema', 'manuale', 4, 5, FALSE);

  -- ============================================
  -- SERVIZI: SET FOTOGRAFICO
  -- ============================================

  -- Shooting
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_ore, attivo, ordine)
  VALUES (v_tenant_id, 'Shooting Fotografico', 'Sessione fotografica professionale della proprietà', 'one_shot', 250.00, 'fisso', v_cat_marketing, 4, TRUE, 1)
  RETURNING id INTO v_serv_shooting;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_shooting, 'Coordinamento con proprietario', 'Accordo data e preparazione immobile', 'manuale', 1, 3, TRUE),
    (v_tenant_id, v_serv_shooting, 'Sopralluogo pre-shooting', 'Verifica condizioni e luci', 'manuale', 2, 5, FALSE),
    (v_tenant_id, v_serv_shooting, 'Sessione fotografica', 'Shooting professionale in loco', 'manuale', 3, 7, TRUE),
    (v_tenant_id, v_serv_shooting, 'Consegna foto grezze', 'Trasferimento file raw al team', 'manuale', 4, 7, TRUE);

  -- Editing
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Editing Fotografico', 'Post-produzione e ottimizzazione immagini', 'one_shot', 150.00, 'fisso', v_cat_marketing, 5, TRUE, 2)
  RETURNING id INTO v_serv_editing;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_editing, 'Selezione foto migliori', 'Scelta delle immagini da editare', 'manuale', 1, 2, TRUE),
    (v_tenant_id, v_serv_editing, 'Correzione colore e luce', 'Post-produzione professionale', 'manuale', 2, 4, TRUE),
    (v_tenant_id, v_serv_editing, 'Ritocco e ottimizzazione', 'Virtual staging se necessario', 'manuale', 3, 5, TRUE),
    (v_tenant_id, v_serv_editing, 'Export formati OTA', 'Esportazione nei formati richiesti', 'manuale', 4, 5, TRUE);

  -- ============================================
  -- SERVIZI: SETUP OTA
  -- ============================================

  -- Airbnb
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Setup Annuncio Airbnb', 'Creazione e ottimizzazione listing Airbnb', 'one_shot', 200.00, 'fisso', v_cat_setup, 3, TRUE, 1)
  RETURNING id INTO v_serv_airbnb;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_airbnb, 'Creazione account host', 'Setup profilo host se non esistente', 'manuale', 1, 1, TRUE),
    (v_tenant_id, v_serv_airbnb, 'Creazione annuncio', 'Inserimento dati base proprietà', 'manuale', 2, 2, TRUE),
    (v_tenant_id, v_serv_airbnb, 'Upload foto', 'Caricamento set fotografico', 'manuale', 3, 2, TRUE),
    (v_tenant_id, v_serv_airbnb, 'Scrittura descrizioni', 'Titolo e descrizione ottimizzati SEO', 'manuale', 4, 3, TRUE),
    (v_tenant_id, v_serv_airbnb, 'Configurazione prezzi', 'Setup pricing e stagionalità', 'manuale', 5, 3, TRUE),
    (v_tenant_id, v_serv_airbnb, 'Inserimento CIR/CIN', 'Codici identificativi obbligatori', 'manuale', 6, 3, TRUE),
    (v_tenant_id, v_serv_airbnb, 'Pubblicazione annuncio', 'Attivazione listing', 'manuale', 7, 3, TRUE);

  -- Booking.com
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Setup Annuncio Booking.com', 'Registrazione e configurazione su Booking.com', 'one_shot', 200.00, 'fisso', v_cat_setup, 5, TRUE, 2)
  RETURNING id INTO v_serv_booking;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_booking, 'Registrazione Extranet', 'Creazione account partner', 'manuale', 1, 2, TRUE),
    (v_tenant_id, v_serv_booking, 'Inserimento dati struttura', 'Compilazione scheda completa', 'manuale', 2, 3, TRUE),
    (v_tenant_id, v_serv_booking, 'Configurazione camere', 'Setup tipologie e capacità', 'manuale', 3, 3, TRUE),
    (v_tenant_id, v_serv_booking, 'Upload foto', 'Caricamento immagini ottimizzate', 'manuale', 4, 4, TRUE),
    (v_tenant_id, v_serv_booking, 'Setup tariffe', 'Configurazione prezzi e policies', 'manuale', 5, 5, TRUE),
    (v_tenant_id, v_serv_booking, 'Verifica proprietà', 'Processo di verifica Booking', 'manuale', 6, 5, TRUE),
    (v_tenant_id, v_serv_booking, 'Attivazione listing', 'Go-live annuncio', 'manuale', 7, 5, TRUE);

  -- Channel Manager
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_giorni, attivo, ordine)
  VALUES (v_tenant_id, 'Configurazione Channel Manager', 'Setup e collegamento canali di vendita', 'one_shot', 200.00, 'fisso', v_cat_setup, 3, TRUE, 3)
  RETURNING id INTO v_serv_channel;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, giorni_deadline, obbligatoria) VALUES
    (v_tenant_id, v_serv_channel, 'Creazione proprietà su CM', 'Setup struttura su channel manager', 'manuale', 1, 1, TRUE),
    (v_tenant_id, v_serv_channel, 'Collegamento Airbnb', 'Connessione API Airbnb', 'manuale', 2, 2, TRUE),
    (v_tenant_id, v_serv_channel, 'Collegamento Booking', 'Connessione XML Booking.com', 'manuale', 3, 2, TRUE),
    (v_tenant_id, v_serv_channel, 'Sincronizzazione calendari', 'Verifica sync disponibilità', 'manuale', 4, 3, TRUE),
    (v_tenant_id, v_serv_channel, 'Test prenotazione', 'Verifica flusso completo', 'manuale', 5, 3, FALSE);

  -- ============================================
  -- SERVIZI: GESTIONE OPERATIVA
  -- ============================================

  -- Check-in/Check-out
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, attivo, ordine)
  VALUES (v_tenant_id, 'Setup Processo Check-in', 'Configurazione procedura accoglienza ospiti', 'one_shot', 100.00, 'fisso', v_cat_gestione, TRUE, 1)
  RETURNING id INTO v_serv_checkin;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, obbligatoria) VALUES
    (v_tenant_id, v_serv_checkin, 'Definizione procedura check-in', 'Self check-in o accoglienza', 'manuale', 1, TRUE),
    (v_tenant_id, v_serv_checkin, 'Setup smart lock', 'Configurazione serratura se presente', 'manuale', 2, FALSE),
    (v_tenant_id, v_serv_checkin, 'Creazione istruzioni ospite', 'Guide di accesso e benvenuto', 'manuale', 3, TRUE),
    (v_tenant_id, v_serv_checkin, 'Configurazione messaggi automatici', 'Template pre-arrivo e post-checkout', 'manuale', 4, TRUE);

  -- Accoglienza
  INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, attivo, ordine)
  VALUES (v_tenant_id, 'Formazione Team Accoglienza', 'Training personale per gestione ospiti', 'one_shot', 150.00, 'fisso', v_cat_gestione, TRUE, 2)
  RETURNING id INTO v_serv_accoglienza;

  INSERT INTO template_task_servizio (tenant_id, servizio_id, titolo, descrizione, tipo, ordine, obbligatoria) VALUES
    (v_tenant_id, v_serv_accoglienza, 'Briefing proprietà', 'Presentazione peculiarità immobile', 'manuale', 1, TRUE),
    (v_tenant_id, v_serv_accoglienza, 'Training procedure operative', 'Formazione su check-in/out e pulizie', 'manuale', 2, TRUE),
    (v_tenant_id, v_serv_accoglienza, 'Consegna kit accoglienza', 'Materiale per ospiti e istruzioni', 'manuale', 3, TRUE);

  -- ============================================
  -- OTTIENI ID PACCHETTI
  -- ============================================

  SELECT id INTO v_pack_legale FROM pacchetti_servizi
    WHERE nome = 'Pratiche Legali' AND tenant_id = v_tenant_id;

  SELECT id INTO v_pack_foto FROM pacchetti_servizi
    WHERE nome = 'Set Fotografico' AND tenant_id = v_tenant_id;

  SELECT id INTO v_pack_ota FROM pacchetti_servizi
    WHERE nome = 'Setup Annunci OTA' AND tenant_id = v_tenant_id;

  SELECT id INTO v_pack_gestione FROM pacchetti_servizi
    WHERE nome = 'Attivazione Gestione' AND tenant_id = v_tenant_id;

  -- ============================================
  -- ASSOCIA SERVIZI AI PACCHETTI
  -- ============================================

  -- Pacchetto Legale: SCIA + CIR + CIN + Alloggiati
  INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine) VALUES
    (v_tenant_id, v_pack_legale, v_serv_scia, 1),
    (v_tenant_id, v_pack_legale, v_serv_cir, 2),
    (v_tenant_id, v_pack_legale, v_serv_cin, 3),
    (v_tenant_id, v_pack_legale, v_serv_alloggiati, 4)
  ON CONFLICT DO NOTHING;

  -- Pacchetto Foto: Shooting + Editing
  INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine) VALUES
    (v_tenant_id, v_pack_foto, v_serv_shooting, 1),
    (v_tenant_id, v_pack_foto, v_serv_editing, 2)
  ON CONFLICT DO NOTHING;

  -- Pacchetto OTA: Airbnb + Booking + Channel Manager
  INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine) VALUES
    (v_tenant_id, v_pack_ota, v_serv_airbnb, 1),
    (v_tenant_id, v_pack_ota, v_serv_booking, 2),
    (v_tenant_id, v_pack_ota, v_serv_channel, 3)
  ON CONFLICT DO NOTHING;

  -- Pacchetto Gestione: Check-in + Accoglienza
  INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine) VALUES
    (v_tenant_id, v_pack_gestione, v_serv_checkin, 1),
    (v_tenant_id, v_pack_gestione, v_serv_accoglienza, 2)
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- DIPENDENZE PACCHETTI
  -- ============================================

  -- Setup OTA dipende da Legale e Foto
  IF v_pack_ota IS NOT NULL AND v_pack_legale IS NOT NULL THEN
    INSERT INTO pacchetti_dipendenze (tenant_id, pacchetto_id, dipende_da_id)
    VALUES (v_tenant_id, v_pack_ota, v_pack_legale)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_pack_ota IS NOT NULL AND v_pack_foto IS NOT NULL THEN
    INSERT INTO pacchetti_dipendenze (tenant_id, pacchetto_id, dipende_da_id)
    VALUES (v_tenant_id, v_pack_ota, v_pack_foto)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Gestione dipende da Setup OTA
  IF v_pack_gestione IS NOT NULL AND v_pack_ota IS NOT NULL THEN
    INSERT INTO pacchetti_dipendenze (tenant_id, pacchetto_id, dipende_da_id)
    VALUES (v_tenant_id, v_pack_gestione, v_pack_ota)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
