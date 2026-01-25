-- ============================================
-- MIGRAZIONE: Fix Tenant ID per tutti i dati catalogo
-- Data: 2025-01-25
-- Descrizione: Ricrea categorie, servizi e pacchetti con il tenant_id corretto
-- ============================================

DO $$
DECLARE
  -- TENANT CORRETTO (quello usato dall'app)
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';

  -- Vecchio tenant da eliminare
  v_old_tenant_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  -- ID Categorie
  cat_consulenza UUID;
  cat_avvio_legale UUID;
  cat_avviamento_op UUID;
  cat_contenuti UUID;
  cat_gestione UUID;

  -- ID Servizi (per i pacchetti)
  srv_pratiche_avvio UUID;
  srv_cir_cin UUID;
  srv_alloggiati UUID;
  srv_istat UUID;
  srv_tassa_soggiorno_config UUID;
  srv_shooting UUID;
  srv_riprese_drone UUID;
  srv_welcome_book UUID;
  srv_annuncio_booking UUID;
  srv_annuncio_airbnb UUID;
  srv_strategia_prezzi UUID;
  srv_targhetta UUID;
  srv_estintore UUID;
  srv_rilevatore_gas UUID;

  -- Servizi Gestione
  srv_checkin_checkout UUID;
  srv_sostituto_imposta UUID;
  srv_coordinamento_pulizie UUID;
  srv_calendario_prezzi UUID;
  srv_schedazione_questura UUID;
  srv_comunicazione_istat UUID;
  srv_gestione_recensioni UUID;
  srv_comunicazione_ospiti UUID;
  srv_coordinamento_manutenzione UUID;
  srv_reportistica UUID;
  srv_tassa_soggiorno UUID;
  srv_richieste_speciali UUID;
  srv_inventario UUID;

  -- ID Pacchetti
  pkg_avvio_legale UUID;
  pkg_messa_norma UUID;
  pkg_lancio_online UUID;
  pkg_gestione_completa UUID;
  pkg_gestione_online UUID;

BEGIN

-- ============================================
-- 0. ELIMINA DATI DEL VECCHIO TENANT
-- ============================================
DELETE FROM pacchetti_servizi_items WHERE tenant_id = v_old_tenant_id;
DELETE FROM pacchetti_dipendenze WHERE tenant_id = v_old_tenant_id;
DELETE FROM pacchetti_servizi WHERE tenant_id = v_old_tenant_id;
DELETE FROM catalogo_servizi WHERE tenant_id = v_old_tenant_id;
DELETE FROM categorie_servizi WHERE tenant_id = v_old_tenant_id;

-- ============================================
-- 1. ELIMINA E RICREA CATEGORIE PER IL TENANT CORRETTO
-- ============================================
DELETE FROM pacchetti_servizi_items WHERE tenant_id = v_tenant_id;
DELETE FROM pacchetti_dipendenze WHERE tenant_id = v_tenant_id;
DELETE FROM pacchetti_servizi WHERE tenant_id = v_tenant_id;
DELETE FROM catalogo_servizi WHERE tenant_id = v_tenant_id;
DELETE FROM categorie_servizi WHERE tenant_id = v_tenant_id;

INSERT INTO categorie_servizi (id, tenant_id, nome, descrizione, colore, icona, ordine, predefinita, attiva)
VALUES
  (gen_random_uuid(), v_tenant_id, 'Consulenza', 'Analisi, valutazioni e consulenze pre-avvio', '#8b5cf6', 'message-circle', 1, true, true),
  (gen_random_uuid(), v_tenant_id, 'Avvio Legale', 'Pratiche SCIA, CIR, CIN, adempimenti burocratici', '#3b82f6', 'file-text', 2, true, true),
  (gen_random_uuid(), v_tenant_id, 'Avviamento Operativo', 'Setup annunci, messa a norma, configurazioni iniziali', '#22c55e', 'rocket', 3, true, true),
  (gen_random_uuid(), v_tenant_id, 'Contenuti & Digital', 'Foto, video, sito web, branding', '#f59e0b', 'camera', 4, true, true),
  (gen_random_uuid(), v_tenant_id, 'Gestione', 'Servizi ricorrenti di gestione operativa', '#06b6d4', 'settings', 5, true, true);

-- Recupera gli ID delle categorie
SELECT id INTO cat_consulenza FROM categorie_servizi WHERE tenant_id = v_tenant_id AND nome = 'Consulenza';
SELECT id INTO cat_avvio_legale FROM categorie_servizi WHERE tenant_id = v_tenant_id AND nome = 'Avvio Legale';
SELECT id INTO cat_avviamento_op FROM categorie_servizi WHERE tenant_id = v_tenant_id AND nome = 'Avviamento Operativo';
SELECT id INTO cat_contenuti FROM categorie_servizi WHERE tenant_id = v_tenant_id AND nome = 'Contenuti & Digital';
SELECT id INTO cat_gestione FROM categorie_servizi WHERE tenant_id = v_tenant_id AND nome = 'Gestione';

-- ============================================
-- 2. CREA SERVIZI - CATEGORIA CONSULENZA
-- ============================================

INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_ore, durata_stimata_giorni, note_interne, attivo, ordine, vendibile_singolarmente)
VALUES
  (v_tenant_id, 'Sopralluogo', 'Visita immobile e valutazione verbale del potenziale.', 'one_shot', 50, 'fisso', cat_consulenza, 1, NULL, 'Prezzo: €50 + €1/km. Scontato se il cliente acquista altri servizi.', true, 1, true),
  (v_tenant_id, 'Analisi di Mercato', 'Valutazione del potenziale dell''immobile con studio della zona, analisi competitor e stima del potenziale redditizio. Consegna report PDF entro 5 giorni lavorativi.', 'one_shot', 250, 'fisso', cat_consulenza, NULL, 5, 'Servizio erogabile da remoto. Definire contenuti dettagliati del report.', true, 2, true),
  (v_tenant_id, 'Consulenza Pre-Apertura', 'Consulenza conoscitiva per chi vuole avviare un''attività di affitti brevi. Include checklist documenti necessari, requisiti, costi stimati, timeline operativa e proposta commerciale personalizzata.', 'one_shot', 150, 'fisso', cat_consulenza, 1, NULL, 'Possibile erogazione da remoto (videocall).', true, 3, true),
  (v_tenant_id, 'Business Plan per Finanziamenti', 'Documento professionale per richiesta finanziamento bancario. Include analisi costi, piano ristrutturazione, proiezioni ricavi e calcolo ROI.', 'one_shot', NULL, 'da_quotare', cat_consulenza, NULL, NULL, 'Prezzo da definire in base alla complessità del progetto.', true, 4, true),
  (v_tenant_id, 'Consulenza Assicurativa', 'Orientamento sulle polizze assicurative: coperture delle piattaforme (Airbnb, Booking) e polizze dedicate consigliate.', 'one_shot', 0, 'fisso', cat_consulenza, NULL, NULL, 'INCLUSO: Solo per clienti in Gestione Completa. Non vendibile separatamente.', true, 5, false);

-- ============================================
-- 3. CREA SERVIZI - CATEGORIA AVVIO LEGALE
-- ============================================

INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_ore, durata_stimata_giorni, note_interne, attivo, ordine, vendibile_singolarmente)
VALUES
  (v_tenant_id, 'Pratiche Avvio Attività', 'Consulenza tipologia (CAV/locazione turistica/B&B) + pratica SCIA/CIA via SUAP. Elaborazione 3 giorni lavorativi.', 'one_shot', 0, 'fisso', cat_avvio_legale, NULL, 3, 'PACCHETTO: Vendibile solo come parte del pacchetto Avvio Legale (€250).', true, 1, false),
  (v_tenant_id, 'Attivazione CIR e CIN', 'Richiesta codici identificativi regionali (CIR) e nazionali (CIN).', 'one_shot', 0, 'fisso', cat_avvio_legale, NULL, NULL, 'PACCHETTO: Vendibile solo come parte del pacchetto Avvio Legale (€250).', true, 2, false),
  (v_tenant_id, 'Attivazione Alloggiati Web', 'Configurazione accesso portale Questura per schedine ospiti.', 'one_shot', 0, 'fisso', cat_avvio_legale, NULL, NULL, 'PACCHETTO: Vendibile solo come parte del pacchetto Avvio Legale (€250).', true, 3, false),
  (v_tenant_id, 'Configurazione ISTAT', 'Attivazione e configurazione portale statistiche turistiche regionali.', 'one_shot', 0, 'fisso', cat_avvio_legale, NULL, NULL, 'PACCHETTO: Vendibile solo come parte del pacchetto Avvio Legale (€250).', true, 4, false),
  (v_tenant_id, 'Configurazione Tassa Soggiorno', 'Registrazione e configurazione portale comunale per imposta di soggiorno.', 'one_shot', 0, 'fisso', cat_avvio_legale, NULL, NULL, 'PACCHETTO: Vendibile solo come parte del pacchetto Avvio Legale (€250).', true, 5, false);

-- ============================================
-- 4. CREA SERVIZI - CATEGORIA AVVIAMENTO OPERATIVO
-- ============================================

INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_ore, durata_stimata_giorni, note_interne, attivo, ordine, vendibile_singolarmente)
VALUES
  (v_tenant_id, 'Targhetta Espositiva Obbligatoria', 'Produzione e consegna targhetta con CIN, inclusi distanziali per installazione.', 'one_shot', 30, 'fisso', cat_avviamento_op, NULL, NULL, 'Vendibile singolarmente o come parte del Kit Messa a Norma.', true, 1, true),
  (v_tenant_id, 'Rifornimento Estintore', 'Fornitura estintore obbligatorio per legge.', 'one_shot', 60, 'fisso', cat_avviamento_op, NULL, NULL, 'Da verificare normativa su quantità richieste e frequenza sostituzione.', true, 2, true),
  (v_tenant_id, 'Gestione Manutenzione Estintore', 'Coordinamento manutenzione semestrale estintore con tecnico abilitato.', 'ricorrente', 0, 'fisso', cat_avviamento_op, NULL, NULL, 'INCLUSO: Solo clienti Gestione Completa. Costo manutenzione a carico proprietario.', true, 3, false),
  (v_tenant_id, 'Rifornimento Rilevatore Gas', 'Fornitura rilevatore GPL/Metano/Monossido obbligatorio per legge.', 'one_shot', 50, 'fisso', cat_avviamento_op, NULL, NULL, 'Parte del Kit Messa a Norma. Verificare prezzo esatto.', true, 4, true),
  (v_tenant_id, 'Creazione Annuncio Booking', 'Creazione e configurazione completa annuncio su Booking.com.', 'one_shot', 250, 'fisso', cat_avviamento_op, NULL, NULL, NULL, true, 5, true),
  (v_tenant_id, 'Creazione Annuncio Airbnb', 'Creazione e configurazione completa annuncio su Airbnb.', 'one_shot', 250, 'fisso', cat_avviamento_op, NULL, NULL, NULL, true, 6, true),
  (v_tenant_id, 'Creazione Annuncio OTA Addizionali', 'Creazione e configurazione annuncio su altre piattaforme (Vrbo, Expedia, Google Vacation Rentals, etc.).', 'one_shot', 250, 'fisso', cat_avviamento_op, NULL, NULL, 'Prezzo per singola piattaforma.', true, 7, true),
  (v_tenant_id, 'Sincronizzazione Calendari iCal', 'Configurazione sincronizzazione calendari tra piattaforme per evitare overbooking.', 'one_shot', 0, 'fisso', cat_avviamento_op, NULL, NULL, 'GRATUITO: Per chi acquista creazione annunci su 2+ piattaforme.', true, 8, true),
  (v_tenant_id, 'Strategia Prezzi', 'Configurazione iniziale della strategia prezzi sugli annunci.', 'one_shot', 150, 'fisso', cat_avviamento_op, NULL, NULL, 'GRATUITO per clienti in Gestione. Altrimenti €150.', true, 9, true),
  (v_tenant_id, 'Inventario e Lista Dotazioni', 'Censimento completo dotazioni e inventario dell''immobile.', 'one_shot', 0, 'fisso', cat_avviamento_op, NULL, NULL, 'INCLUSO: Solo nel pacchetto Gestione Online.', true, 10, false);

-- ============================================
-- 5. CREA SERVIZI - CATEGORIA CONTENUTI & DIGITAL
-- ============================================

INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_ore, durata_stimata_giorni, note_interne, attivo, ordine, vendibile_singolarmente)
VALUES
  (v_tenant_id, 'Shooting Fotografico Base', 'Coordinamento con fotografo, shooting immobile, editing base e selezione foto per annunci. Circa 40-60 foto.', 'one_shot', 200, 'fisso', cat_contenuti, NULL, NULL, NULL, true, 1, true),
  (v_tenant_id, 'Riprese Drone', 'Riprese aeree con drone dell''immobile e zona circostante.', 'one_shot', 100, 'fisso', cat_contenuti, NULL, NULL, 'ADD-ON: Aggiuntivo allo Shooting Fotografico. Non vendibile singolarmente.', true, 2, false),
  (v_tenant_id, 'Video Tour Casa', 'Video tour professionale dell''immobile.', 'one_shot', NULL, 'da_quotare', cat_contenuti, NULL, NULL, 'IN STANDBY: Servizio da definire.', false, 3, true),
  (v_tenant_id, 'Tour 3D', 'Tour virtuale 3D dell''immobile.', 'one_shot', NULL, 'da_quotare', cat_contenuti, NULL, NULL, 'IN STANDBY: Servizio da definire.', false, 4, true),
  (v_tenant_id, 'Welcome Book', 'Creazione welcome book cartaceo con regole casa e guida per gli ospiti.', 'one_shot', 50, 'fisso', cat_contenuti, NULL, NULL, NULL, true, 5, true),
  (v_tenant_id, 'Sito Web Dedicato', 'Creazione sito web dedicato per la proprietà.', 'one_shot', NULL, 'da_quotare', cat_contenuti, NULL, NULL, 'MODULARE: Servizio da strutturare con sotto-elementi e opzioni.', true, 6, true),
  (v_tenant_id, 'Servizi Branding', 'Servizi di branding per la proprietà (logo, identità visiva, materiali).', 'one_shot', NULL, 'da_quotare', cat_contenuti, NULL, NULL, 'MODULARE: Servizio da strutturare con sotto-elementi e opzioni.', true, 7, true);

-- ============================================
-- 6. CREA SERVIZI - CATEGORIA GESTIONE
-- ============================================

INSERT INTO catalogo_servizi (tenant_id, nome, descrizione, tipo, prezzo_base, prezzo_tipo, categoria_id, durata_stimata_ore, durata_stimata_giorni, note_interne, attivo, ordine, vendibile_singolarmente)
VALUES
  (v_tenant_id, 'Gestione Check-in Check-out', 'Gestione arrivi e partenze ospiti.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione.', true, 1, false),
  (v_tenant_id, 'Sostituto d''Imposta', 'Gestione ritenuta d''acconto e rilascio CU annuale.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione.', true, 2, false),
  (v_tenant_id, 'Coordinamento Pulizie', 'Coordinamento servizio pulizie con partner esterni tra un soggiorno e l''altro.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione. Costo pulizie a carico proprietario/ospite.', true, 3, false),
  (v_tenant_id, 'Gestione Calendario Prezzi', 'Aggiornamento e ottimizzazione prezzi sugli annunci.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione Online e Completa.', true, 4, false),
  (v_tenant_id, 'Schedazione Ospiti Questura', 'Registrazione ospiti su portale Alloggiati Web entro 24h dall''arrivo.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione.', true, 5, false),
  (v_tenant_id, 'Comunicazione ISTAT', 'Invio dati statistici flussi turistici al portale regionale.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione.', true, 6, false),
  (v_tenant_id, 'Gestione Recensioni', 'Monitoraggio e risposta alle recensioni ospiti su tutte le piattaforme.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione.', true, 7, false),
  (v_tenant_id, 'Comunicazione Ospiti', 'Gestione comunicazioni con ospiti pre, durante e post soggiorno.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione.', true, 8, false),
  (v_tenant_id, 'Coordinamento Manutenzione', 'Segnalazione problemi e coordinamento interventi tecnici.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione. Costo interventi a carico proprietario.', true, 9, false),
  (v_tenant_id, 'Reportistica Mensile', 'Report mensile con dati performance della proprietà.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione. Contenuti report da definire.', true, 10, false),
  (v_tenant_id, 'Riscossione e Versamento Tassa Soggiorno', 'Riscossione tassa di soggiorno dagli ospiti e versamento periodico al comune.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nel pacchetto Gestione Completa.', true, 11, false),
  (v_tenant_id, 'Gestione Richieste Speciali e Reclami', 'Gestione richieste speciali (early check-in, late check-out, esigenze particolari) e reclami ospiti.', 'ricorrente', 0, 'fisso', cat_gestione, NULL, NULL, 'INCLUSO: Solo nei pacchetti Gestione.', true, 12, false);

-- ============================================
-- 7. RECUPERA ID SERVIZI PER I PACCHETTI
-- ============================================

SELECT id INTO srv_pratiche_avvio FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Pratiche Avvio Attività';
SELECT id INTO srv_cir_cin FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Attivazione CIR e CIN';
SELECT id INTO srv_alloggiati FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Attivazione Alloggiati Web';
SELECT id INTO srv_istat FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Configurazione ISTAT';
SELECT id INTO srv_tassa_soggiorno_config FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Configurazione Tassa Soggiorno';
SELECT id INTO srv_shooting FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Shooting Fotografico Base';
SELECT id INTO srv_riprese_drone FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Riprese Drone';
SELECT id INTO srv_welcome_book FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Welcome Book';
SELECT id INTO srv_annuncio_booking FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Creazione Annuncio Booking';
SELECT id INTO srv_annuncio_airbnb FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Creazione Annuncio Airbnb';
SELECT id INTO srv_strategia_prezzi FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Strategia Prezzi';
SELECT id INTO srv_targhetta FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Targhetta Espositiva Obbligatoria';
SELECT id INTO srv_estintore FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Rifornimento Estintore';
SELECT id INTO srv_rilevatore_gas FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Rifornimento Rilevatore Gas';

-- Servizi Gestione
SELECT id INTO srv_checkin_checkout FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Gestione Check-in Check-out';
SELECT id INTO srv_sostituto_imposta FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Sostituto d''Imposta';
SELECT id INTO srv_coordinamento_pulizie FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Coordinamento Pulizie';
SELECT id INTO srv_calendario_prezzi FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Gestione Calendario Prezzi';
SELECT id INTO srv_schedazione_questura FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Schedazione Ospiti Questura';
SELECT id INTO srv_comunicazione_istat FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Comunicazione ISTAT';
SELECT id INTO srv_gestione_recensioni FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Gestione Recensioni';
SELECT id INTO srv_comunicazione_ospiti FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Comunicazione Ospiti';
SELECT id INTO srv_coordinamento_manutenzione FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Coordinamento Manutenzione';
SELECT id INTO srv_reportistica FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Reportistica Mensile';
SELECT id INTO srv_tassa_soggiorno FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Riscossione e Versamento Tassa Soggiorno';
SELECT id INTO srv_richieste_speciali FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Gestione Richieste Speciali e Reclami';
SELECT id INTO srv_inventario FROM catalogo_servizi WHERE tenant_id = v_tenant_id AND nome = 'Inventario e Lista Dotazioni';

-- ============================================
-- 8. CREA PACCHETTI
-- ============================================

-- PACCHETTO 1: Avvio Legale
INSERT INTO pacchetti_servizi (id, tenant_id, nome, descrizione, categoria_id, prezzo_base, tipo_esito, attivo, ordine, note_interne)
VALUES (
  gen_random_uuid(),
  v_tenant_id,
  'Pacchetto Avvio Legale',
  'Tutte le pratiche burocratiche per avviare l''attività di affitti brevi: SCIA/CIA, CIR, CIN, Alloggiati Web, ISTAT, Tassa di Soggiorno.',
  cat_avvio_legale,
  250,
  'one_shot',
  true,
  1,
  'Pacchetto completo €250. Include 5 servizi non vendibili singolarmente.'
)
RETURNING id INTO pkg_avvio_legale;

-- PACCHETTO 2: Kit Messa a Norma
INSERT INTO pacchetti_servizi (id, tenant_id, nome, descrizione, categoria_id, prezzo_base, tipo_esito, attivo, ordine, note_interne)
VALUES (
  gen_random_uuid(),
  v_tenant_id,
  'Kit Messa a Norma',
  'Kit completo per rendere la proprietà conforme alle normative: targhetta CIN, estintore, rilevatore gas.',
  cat_avviamento_op,
  140,
  'one_shot',
  true,
  2,
  'Pacchetto sicurezza completo. Prezzo: €30 targhetta + €60 estintore + €50 rilevatore.'
)
RETURNING id INTO pkg_messa_norma;

-- PACCHETTO 3: Lancio Online
INSERT INTO pacchetti_servizi (id, tenant_id, nome, descrizione, categoria_id, prezzo_base, tipo_esito, attivo, ordine, note_interne)
VALUES (
  gen_random_uuid(),
  v_tenant_id,
  'Pacchetto Lancio Online',
  'Creazione annunci su Booking e Airbnb con strategia prezzi iniziale e welcome book per partire subito.',
  cat_avviamento_op,
  700,
  'one_shot',
  true,
  3,
  'Include: Booking (€250) + Airbnb (€250) + Strategia Prezzi (€150) + Welcome Book (€50).'
)
RETURNING id INTO pkg_lancio_online;

-- PACCHETTO 4: Gestione Online
INSERT INTO pacchetti_servizi (id, tenant_id, nome, descrizione, categoria_id, prezzo_base, tipo_esito, attivo, ordine, note_interne)
VALUES (
  gen_random_uuid(),
  v_tenant_id,
  'Gestione Online',
  'Gestione da remoto della proprietà: calendario, prezzi, comunicazioni, adempimenti burocratici e reportistica. Il proprietario gestisce check-in e pulizie.',
  cat_gestione,
  0,
  'gestione',
  true,
  4,
  'Commissione: 10% sul fatturato. Esclude check-in fisico, pulizie e tassa soggiorno.'
)
RETURNING id INTO pkg_gestione_online;

-- PACCHETTO 5: Gestione Completa
INSERT INTO pacchetti_servizi (id, tenant_id, nome, descrizione, categoria_id, prezzo_base, tipo_esito, attivo, ordine, note_interne)
VALUES (
  gen_random_uuid(),
  v_tenant_id,
  'Gestione Completa',
  'Gestione full-service della proprietà: check-in/out, pulizie, comunicazioni, adempimenti, manutenzione e tassa di soggiorno. Pensiamo a tutto noi.',
  cat_gestione,
  0,
  'gestione',
  true,
  5,
  'Commissione: 20% sul fatturato. Include TUTTI i servizi di gestione.'
)
RETURNING id INTO pkg_gestione_completa;

-- ============================================
-- 9. ASSOCIA SERVIZI AI PACCHETTI
-- ============================================

-- Servizi Pacchetto Avvio Legale (5 servizi)
INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine)
VALUES
  (v_tenant_id, pkg_avvio_legale, srv_pratiche_avvio, 1),
  (v_tenant_id, pkg_avvio_legale, srv_cir_cin, 2),
  (v_tenant_id, pkg_avvio_legale, srv_alloggiati, 3),
  (v_tenant_id, pkg_avvio_legale, srv_istat, 4),
  (v_tenant_id, pkg_avvio_legale, srv_tassa_soggiorno_config, 5);

-- Servizi Kit Messa a Norma (3 servizi)
INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine)
VALUES
  (v_tenant_id, pkg_messa_norma, srv_targhetta, 1),
  (v_tenant_id, pkg_messa_norma, srv_estintore, 2),
  (v_tenant_id, pkg_messa_norma, srv_rilevatore_gas, 3);

-- Servizi Pacchetto Lancio Online (4 servizi)
INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine)
VALUES
  (v_tenant_id, pkg_lancio_online, srv_annuncio_booking, 1),
  (v_tenant_id, pkg_lancio_online, srv_annuncio_airbnb, 2),
  (v_tenant_id, pkg_lancio_online, srv_strategia_prezzi, 3),
  (v_tenant_id, pkg_lancio_online, srv_welcome_book, 4);

-- Servizi Gestione Online (9 servizi - no check-in, no pulizie, no tassa soggiorno)
INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine)
VALUES
  (v_tenant_id, pkg_gestione_online, srv_sostituto_imposta, 1),
  (v_tenant_id, pkg_gestione_online, srv_calendario_prezzi, 2),
  (v_tenant_id, pkg_gestione_online, srv_schedazione_questura, 3),
  (v_tenant_id, pkg_gestione_online, srv_comunicazione_istat, 4),
  (v_tenant_id, pkg_gestione_online, srv_gestione_recensioni, 5),
  (v_tenant_id, pkg_gestione_online, srv_comunicazione_ospiti, 6),
  (v_tenant_id, pkg_gestione_online, srv_reportistica, 7),
  (v_tenant_id, pkg_gestione_online, srv_richieste_speciali, 8),
  (v_tenant_id, pkg_gestione_online, srv_inventario, 9);

-- Servizi Gestione Completa (12 servizi - TUTTI)
INSERT INTO pacchetti_servizi_items (tenant_id, pacchetto_id, servizio_id, ordine)
VALUES
  (v_tenant_id, pkg_gestione_completa, srv_checkin_checkout, 1),
  (v_tenant_id, pkg_gestione_completa, srv_sostituto_imposta, 2),
  (v_tenant_id, pkg_gestione_completa, srv_coordinamento_pulizie, 3),
  (v_tenant_id, pkg_gestione_completa, srv_calendario_prezzi, 4),
  (v_tenant_id, pkg_gestione_completa, srv_schedazione_questura, 5),
  (v_tenant_id, pkg_gestione_completa, srv_comunicazione_istat, 6),
  (v_tenant_id, pkg_gestione_completa, srv_gestione_recensioni, 7),
  (v_tenant_id, pkg_gestione_completa, srv_comunicazione_ospiti, 8),
  (v_tenant_id, pkg_gestione_completa, srv_coordinamento_manutenzione, 9),
  (v_tenant_id, pkg_gestione_completa, srv_reportistica, 10),
  (v_tenant_id, pkg_gestione_completa, srv_tassa_soggiorno, 11),
  (v_tenant_id, pkg_gestione_completa, srv_richieste_speciali, 12);

-- ============================================
-- LOG FINALE
-- ============================================
RAISE NOTICE '===========================================';
RAISE NOTICE 'Migrazione completata con TENANT CORRETTO!';
RAISE NOTICE 'Tenant ID: %', v_tenant_id;
RAISE NOTICE '===========================================';
RAISE NOTICE 'Categorie create: 5';
RAISE NOTICE 'Servizi creati: 39';
RAISE NOTICE 'Pacchetti creati: 5';
RAISE NOTICE '  1. Pacchetto Avvio Legale (€250) - 5 servizi';
RAISE NOTICE '  2. Kit Messa a Norma (€140) - 3 servizi';
RAISE NOTICE '  3. Pacchetto Lancio Online (€700) - 4 servizi';
RAISE NOTICE '  4. Gestione Online (10%%) - 9 servizi';
RAISE NOTICE '  5. Gestione Completa (20%%) - 12 servizi';
RAISE NOTICE '===========================================';

END $$;
