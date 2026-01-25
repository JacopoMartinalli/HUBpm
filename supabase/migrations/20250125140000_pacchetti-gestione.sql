-- ============================================
-- MIGRAZIONE: Pacchetti Gestione Completa e Online
-- Data: 2025-01-25
-- Descrizione: Aggiunge pacchetti gestione e rinomina esistenti
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  -- ID Categoria Gestione
  cat_gestione UUID;
  cat_avviamento_op UUID;

  -- ID Servizi Gestione
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
  pkg_gestione_completa UUID;
  pkg_gestione_online UUID;

BEGIN

-- ============================================
-- 1. RINOMINA PACCHETTI ESISTENTI
-- ============================================

-- Rinomina "Pacchetto Messa a Norma" -> "Kit Messa a Norma"
UPDATE pacchetti_servizi
SET nome = 'Kit Messa a Norma',
    descrizione = 'Kit completo per rendere la proprietà conforme alle normative: targhetta CIN, estintore, rilevatore gas.'
WHERE tenant_id = v_tenant_id AND nome = 'Pacchetto Messa a Norma';

-- Rinomina "Pacchetto Lancio OTA" -> "Pacchetto Lancio Online"
UPDATE pacchetti_servizi
SET nome = 'Pacchetto Lancio Online',
    descrizione = 'Creazione annunci su Booking e Airbnb con strategia prezzi iniziale e welcome book per partire subito.'
WHERE tenant_id = v_tenant_id AND nome = 'Pacchetto Lancio OTA';

-- Elimina "Pacchetto Foto Completo" (non richiesto)
DELETE FROM pacchetti_servizi_items
WHERE pacchetto_id IN (
  SELECT id FROM pacchetti_servizi
  WHERE tenant_id = v_tenant_id AND nome = 'Pacchetto Foto Completo'
);
DELETE FROM pacchetti_servizi
WHERE tenant_id = v_tenant_id AND nome = 'Pacchetto Foto Completo';

-- ============================================
-- 2. RECUPERA ID CATEGORIA E SERVIZI
-- ============================================

SELECT id INTO cat_gestione FROM categorie_servizi WHERE tenant_id = v_tenant_id AND nome = 'Gestione';
SELECT id INTO cat_avviamento_op FROM categorie_servizi WHERE tenant_id = v_tenant_id AND nome = 'Avviamento Operativo';

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
-- 3. CREA PACCHETTO GESTIONE COMPLETA
-- ============================================

INSERT INTO pacchetti_servizi (id, tenant_id, nome, descrizione, categoria_id, prezzo_base, tipo_esito, attivo, ordine, note_interne)
VALUES (
  gen_random_uuid(),
  v_tenant_id,
  'Gestione Completa',
  'Gestione full-service della proprietà: check-in/out, pulizie, comunicazioni, adempimenti, manutenzione e tassa di soggiorno. Pensiamo a tutto noi.',
  cat_gestione,
  0,  -- Prezzo basato su commissione percentuale
  'gestione',
  true,
  10,
  'Commissione: 20% sul fatturato. Include TUTTI i servizi di gestione.'
)
RETURNING id INTO pkg_gestione_completa;

-- Servizi inclusi in Gestione Completa (TUTTI i 12 servizi)
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
-- 4. CREA PACCHETTO GESTIONE ONLINE
-- ============================================

INSERT INTO pacchetti_servizi (id, tenant_id, nome, descrizione, categoria_id, prezzo_base, tipo_esito, attivo, ordine, note_interne)
VALUES (
  gen_random_uuid(),
  v_tenant_id,
  'Gestione Online',
  'Gestione da remoto della proprietà: calendario, prezzi, comunicazioni, adempimenti burocratici e reportistica. Il proprietario gestisce check-in e pulizie.',
  cat_gestione,
  0,  -- Prezzo basato su commissione percentuale
  'gestione',
  true,
  11,
  'Commissione: 10% sul fatturato. Esclude check-in fisico, pulizie e tassa soggiorno.'
)
RETURNING id INTO pkg_gestione_online;

-- Servizi inclusi in Gestione Online (servizi da remoto)
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

-- ============================================
-- 5. AGGIORNA ORDINE PACCHETTI
-- ============================================

-- Riordina tutti i pacchetti
UPDATE pacchetti_servizi SET ordine = 1 WHERE tenant_id = v_tenant_id AND nome = 'Pacchetto Avvio Legale';
UPDATE pacchetti_servizi SET ordine = 2 WHERE tenant_id = v_tenant_id AND nome = 'Kit Messa a Norma';
UPDATE pacchetti_servizi SET ordine = 3 WHERE tenant_id = v_tenant_id AND nome = 'Pacchetto Lancio Online';
UPDATE pacchetti_servizi SET ordine = 4 WHERE tenant_id = v_tenant_id AND nome = 'Gestione Online';
UPDATE pacchetti_servizi SET ordine = 5 WHERE tenant_id = v_tenant_id AND nome = 'Gestione Completa';

-- ============================================
-- LOG FINALE
-- ============================================
RAISE NOTICE 'Migrazione completata!';
RAISE NOTICE 'Pacchetti rinominati: Kit Messa a Norma, Pacchetto Lancio Online';
RAISE NOTICE 'Pacchetti eliminati: Pacchetto Foto Completo';
RAISE NOTICE 'Pacchetti creati: Gestione Completa (12 servizi), Gestione Online (9 servizi)';

END $$;
