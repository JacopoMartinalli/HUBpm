-- ============================================
-- SCRIPT: Popolare dati proprietà Patrizia Rovedatti
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================

-- 1. Prima trova l'ID della proprietà (cerca per nome cliente o proprietà)
-- Esegui questa query per trovare la proprietà corretta:
/*
SELECT
  p.id as proprieta_id,
  p.nome as proprieta_nome,
  p.indirizzo,
  c.nome || ' ' || c.cognome as cliente
FROM proprieta p
JOIN contatti c ON p.contatto_id = c.id
WHERE c.cognome ILIKE '%rovedatti%'
   OR p.nome ILIKE '%rovedatti%'
   OR p.nome ILIKE '%patrizia%';
*/

-- 2. Una volta trovato l'ID, sostituisci 'YOUR_PROPRIETA_ID' con l'ID reale
-- e 'YOUR_TENANT_ID' con il tenant_id

DO $$
DECLARE
  v_proprieta_id UUID;
  v_tenant_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- DEFAULT_TENANT_ID
  v_locale_cantina UUID;
  v_locale_piano1_cucina UUID;
  v_locale_piano1_sala UUID;
  v_locale_piano1_bagno UUID;
  v_locale_piano2_camera1 UUID;
  v_locale_piano2_camera2 UUID;
  v_locale_piano2_bagno UUID;
  v_locale_cortiletto UUID;
BEGIN
  -- Trova la proprietà (modifica questa query se necessario)
  SELECT id INTO v_proprieta_id
  FROM proprieta p
  WHERE p.tenant_id = v_tenant_id
  ORDER BY created_at DESC
  LIMIT 1; -- Prende l'ultima proprietà creata, modifica se necessario

  IF v_proprieta_id IS NULL THEN
    RAISE NOTICE 'Proprietà non trovata! Verifica i criteri di ricerca.';
    RETURN;
  END IF;

  RAISE NOTICE 'Aggiornando proprietà: %', v_proprieta_id;

  -- ============================================
  -- AGGIORNA DATI OPERATIVI PROPRIETÀ
  -- ============================================
  UPDATE proprieta SET
    -- Smaltimento Rifiuti
    smaltimento_rifiuti = E'RACCOLTA DIFFERENZIATA:\n\n• UMIDO (marrone): Lunedì e Giovedì\n• CARTA (bianco): Mercoledì\n• PLASTICA (giallo): Sabato\n• VETRO (verde): ogni 2 settimane\n• INDIFFERENZIATA (grigio): Venerdì\n\nI bidoni sono nel cortiletto esterno. Esporre la sera prima della raccolta.',

    -- Parcheggio
    parcheggio = E'Auto in cortile retrostante. Spazio per 2 auto.\nNB: Entrare piano per non rovinare il prato.',

    -- Check-in/Check-out
    checkin_orario = '15:00',
    checkout_orario = '10:00',

    -- Regole Casa
    regole_casa = E'REGOLE DELLA CASA:\n\n1. NO FUMO all''interno dell''appartamento\n2. NO FESTE o eventi rumorosi\n3. Rispettare il silenzio dopo le 22:00\n4. Non lasciare cibo fuori (attira insetti)\n5. Chiudere sempre cancello e portone\n6. Spegnere luci e condizionatori quando si esce\n7. Separare correttamente i rifiuti\n\nGRAZIE per la collaborazione!',

    -- Info Utili e Contatti (nelle note)
    note = E'CONTATTI UTILI E LUOGHI DI INTERESSE:\n\n📍 FATTORIA LATTE SANO\nVia delle Capannelle, a 5 min in auto\nFormaggi, latte fresco, uova\n\n🛒 MINIMARKET/ALIMENTARI\n"Da Mario" - Via Roma 15\nAperto 8-13 e 16-20\n\n🍕 PIZZERIA\n"La Margherita" - Piazza Centrale\nTel: 06-1234567\nOttima pizza, consegna a domicilio\n\n🔥 BOMBOLE GAS\nRivenditore: Ditta Rossi\nTel: 06-9876543\nConsegna a domicilio su appuntamento\n\n🏥 FARMACIA\nFarmacia Comunale - Via Garibaldi 8\nTel: 06-5555555\n\n👨‍⚕️ GUARDIA MEDICA\nTel: 06-3333333'

  WHERE id = v_proprieta_id;

  -- ============================================
  -- CREA LOCALI
  -- ============================================

  -- Elimina locali esistenti (opzionale - commenta se vuoi mantenere i precedenti)
  -- DELETE FROM locali WHERE proprieta_id = v_proprieta_id;

  -- CANTINA
  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'cantina',
    'Cantina',
    E'• Lavatrice\n• Stendino\n• Detersivi e prodotti pulizia\n• Aspirapolvere\n• Scopa e paletta\n• Secchio e mocio',
    'Piano seminterrato - accesso dalle scale interne'
  ) RETURNING id INTO v_locale_cantina;

  -- PIANO 1 - CUCINA/SOGGIORNO
  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'cucina',
    'Cucina - Piano 1',
    E'ELETTRODOMESTICI:\n• Frigorifero con freezer\n• Piano cottura 4 fuochi\n• Forno elettrico\n• Microonde\n• Macchina caffè Nespresso\n• Tostapane\n• Bollitore\n\nSTOVIGLIE E UTENSILI:\n• Set piatti (6 piani, 6 fondi, 6 dessert)\n• Bicchieri (6 acqua, 6 vino)\n• Posate complete (6 persone)\n• Pentole varie misure\n• Padelle antiaderenti\n• Taglieri\n• Set coltelli\n• Utensili da cucina (mestoli, spatole, etc.)',
    'Cucina abitabile con tavolo per 4 persone'
  ) RETURNING id INTO v_locale_piano1_cucina;

  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'soggiorno',
    'Sala/Soggiorno - Piano 1',
    E'• Divano 3 posti\n• TV 43" Smart TV\n• Tavolo da pranzo 6 posti\n• Sedie (6)\n• Mobile TV\n• Libreria\n• Condizionatore\n• Tende oscuranti',
    'Ampio soggiorno comunicante con cucina'
  ) RETURNING id INTO v_locale_piano1_sala;

  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, posti_letto, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'bagno',
    'Bagno - Piano 1',
    0,
    E'• WC\n• Lavabo\n• Specchio\n• Porta asciugamani\n• Asciugacapelli\n• Set asciugamani ospiti',
    'Bagno di servizio'
  ) RETURNING id INTO v_locale_piano1_bagno;

  -- PIANO 2 - CAMERE E BAGNO
  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, posti_letto, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'camera_matrimoniale',
    'Camera Matrimoniale - Piano 2',
    2,
    E'• Letto matrimoniale 160x200\n• Armadio 4 ante\n• Comodini (2)\n• Lampade da comodino\n• Cassettiera\n• Specchio\n• Condizionatore\n• Biancheria letto completa',
    'Camera principale con vista giardino'
  ) RETURNING id INTO v_locale_piano2_camera1;

  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, posti_letto, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'camera_doppia',
    'Camera Doppia - Piano 2',
    2,
    E'• 2 Letti singoli 90x200\n• Armadio 2 ante\n• Comodini (2)\n• Scrivania\n• Sedia\n• Condizionatore\n• Biancheria letto completa',
    'Camera con 2 letti singoli'
  ) RETURNING id INTO v_locale_piano2_camera2;

  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, posti_letto, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'bagno',
    'Bagno Principale - Piano 2',
    0,
    E'• Doccia grande\n• WC\n• Bidet\n• Lavabo doppio\n• Specchio illuminato\n• Asciugacapelli\n• Set asciugamani\n• Tappetino bagno',
    'Bagno principale con doccia spaziosa'
  ) RETURNING id INTO v_locale_piano2_bagno;

  -- CORTILETTO ESTERNO
  INSERT INTO locali (tenant_id, proprieta_id, tipo, nome, dotazioni, note)
  VALUES (
    v_tenant_id,
    v_proprieta_id,
    'giardino',
    'Cortiletto Esterno',
    E'• Tavolo da esterno\n• Sedie da giardino (4)\n• Ombrellone\n• Barbecue (solo carbone)\n• Bidoni raccolta differenziata\n• Parcheggio auto (2 posti)',
    'Area esterna privata con parcheggio'
  ) RETURNING id INTO v_locale_cortiletto;

  -- ============================================
  -- CREA ASSET PRINCIPALI
  -- ============================================

  -- Elettrodomestici Cantina
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_cantina, 'Lavatrice', 'elettrodomestico', 1, 'buono', 'Programmi: cotone, delicati, lana, rapido'),
    (v_tenant_id, v_proprieta_id, v_locale_cantina, 'Aspirapolvere', 'elettrodomestico', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_cantina, 'Stendino', 'arredo', 1, 'buono', NULL);

  -- Elettrodomestici Cucina
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Frigorifero con freezer', 'elettrodomestico', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Forno elettrico', 'elettrodomestico', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Microonde', 'elettrodomestico', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Macchina caffè Nespresso', 'elettrodomestico', 1, 'buono', 'Capsule non incluse'),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Tostapane', 'elettrodomestico', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Bollitore elettrico', 'elettrodomestico', 1, 'buono', NULL);

  -- Stoviglie Cucina
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Set piatti (piani)', 'stoviglie', 6, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Set piatti (fondi)', 'stoviglie', 6, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Set piatti (dessert)', 'stoviglie', 6, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Bicchieri acqua', 'stoviglie', 6, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Bicchieri vino', 'stoviglie', 6, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Set posate completo', 'stoviglie', 6, 'buono', 'Forchette, coltelli, cucchiai, cucchiaini'),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Pentole varie misure', 'stoviglie', 4, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_cucina, 'Padelle antiaderenti', 'stoviglie', 2, 'buono', NULL);

  -- Arredo Soggiorno
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_piano1_sala, 'Divano 3 posti', 'arredo', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_sala, 'Smart TV 43 pollici', 'elettronica', 1, 'buono', 'Netflix, Prime Video preinstallati'),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_sala, 'Tavolo da pranzo', 'arredo', 1, 'buono', '6 posti'),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_sala, 'Sedie da pranzo', 'arredo', 6, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano1_sala, 'Condizionatore', 'elettrodomestico', 1, 'buono', 'Telecomando incluso');

  -- Camera Matrimoniale
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera1, 'Letto matrimoniale', 'arredo', 1, 'buono', '160x200 con rete a doghe'),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera1, 'Armadio 4 ante', 'arredo', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera1, 'Comodini', 'arredo', 2, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera1, 'Lampade comodino', 'decorazione', 2, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera1, 'Condizionatore', 'elettrodomestico', 1, 'buono', NULL);

  -- Camera Doppia
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera2, 'Letto singolo', 'arredo', 2, 'buono', '90x200'),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera2, 'Armadio 2 ante', 'arredo', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera2, 'Comodini', 'arredo', 2, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera2, 'Scrivania', 'arredo', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera2, 'Condizionatore', 'elettrodomestico', 1, 'buono', NULL);

  -- Biancheria
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera1, 'Set lenzuola matrimoniale', 'biancheria', 2, 'buono', 'Cotone 100%'),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_camera2, 'Set lenzuola singole', 'biancheria', 4, 'buono', 'Cotone 100%'),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_bagno, 'Asciugamani grandi', 'biancheria', 8, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_bagno, 'Asciugamani piccoli', 'biancheria', 8, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_bagno, 'Tappetino bagno', 'biancheria', 2, 'buono', NULL);

  -- Bagni
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_piano1_bagno, 'Asciugacapelli', 'elettrodomestico', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_piano2_bagno, 'Asciugacapelli', 'elettrodomestico', 1, 'buono', NULL);

  -- Cortiletto
  INSERT INTO asset (tenant_id, proprieta_id, locale_id, nome, categoria, quantita, stato, note)
  VALUES
    (v_tenant_id, v_proprieta_id, v_locale_cortiletto, 'Tavolo da esterno', 'arredo', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_cortiletto, 'Sedie da giardino', 'arredo', 4, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_cortiletto, 'Ombrellone', 'arredo', 1, 'buono', NULL),
    (v_tenant_id, v_proprieta_id, v_locale_cortiletto, 'Barbecue', 'arredo', 1, 'buono', 'Solo carbone - NO GAS'),
    (v_tenant_id, v_proprieta_id, v_locale_cortiletto, 'Bidoni raccolta differenziata', 'altro', 5, 'buono', 'Umido, Carta, Plastica, Vetro, Indifferenziata');

  RAISE NOTICE 'Dati proprietà aggiornati con successo!';
  RAISE NOTICE 'Locali creati: 8';
  RAISE NOTICE 'Asset creati: 50+';

END $$;

-- ============================================
-- VERIFICA DATI INSERITI
-- ============================================
/*
-- Verifica locali creati
SELECT
  l.nome,
  l.tipo,
  l.posti_letto,
  l.dotazioni
FROM locali l
JOIN proprieta p ON l.proprieta_id = p.id
ORDER BY l.nome;

-- Verifica asset per locale
SELECT
  loc.nome as locale,
  a.nome as asset,
  a.categoria,
  a.quantita,
  a.stato
FROM asset a
JOIN locali loc ON a.locale_id = loc.id
ORDER BY loc.nome, a.categoria, a.nome;

-- Verifica dati operativi proprietà
SELECT
  nome,
  smaltimento_rifiuti,
  parcheggio,
  regole_casa,
  checkin_orario,
  checkout_orario,
  note
FROM proprieta
WHERE id = 'YOUR_PROPRIETA_ID';
*/
