-- ============================================
-- MIGRAZIONE: Fix Tenant ID Categorie
-- ============================================
-- Corregge il tenant_id delle categorie predefinite
-- e reinserisce i dati di esempio se mancanti
-- ============================================

-- Aggiorna tenant_id delle categorie esistenti
UPDATE categorie_servizi
SET tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Inserisci categorie se mancanti con tenant_id corretto
INSERT INTO categorie_servizi (tenant_id, nome, descrizione, colore, icona, ordine, predefinita) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Setup Iniziale', 'Servizi per l''avvio della gestione di una nuova proprietà', '#22c55e', 'rocket', 1, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gestione Operativa', 'Servizi ricorrenti per la gestione quotidiana', '#3b82f6', 'settings', 2, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marketing', 'Servizi di promozione e visibilità', '#f59e0b', 'megaphone', 3, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pratiche Burocratiche', 'Gestione documenti, permessi e adempimenti', '#8b5cf6', 'file-text', 4, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manutenzione', 'Interventi di manutenzione ordinaria e straordinaria', '#ef4444', 'wrench', 5, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Extra', 'Servizi aggiuntivi e personalizzati', '#6b7280', 'plus-circle', 6, true)
ON CONFLICT DO NOTHING;
