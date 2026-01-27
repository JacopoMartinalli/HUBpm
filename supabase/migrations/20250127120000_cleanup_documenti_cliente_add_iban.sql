-- ============================================
-- 1. PULIZIA DOCUMENTI CLIENTE
-- Rimuovi template e documenti non necessari
-- Tieni solo: Codice fiscale, Documento identità, Privacy firmata
-- ============================================

-- Elimina tutti i documenti collegati a template cliente
DELETE FROM documenti
WHERE template_id IN (
  SELECT id FROM template_documenti WHERE tipo_entita = 'cliente'
);

-- Elimina tutti i template cliente
DELETE FROM template_documenti WHERE tipo_entita = 'cliente';

-- Ricrea solo i 3 template necessari
INSERT INTO template_documenti (tenant_id, tipo_entita, fase, nome, descrizione, categoria, obbligatorio, ordine) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cliente', 'C0', 'Codice fiscale', 'Tessera sanitaria o documento con CF', 'fiscale', true, 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cliente', 'C0', 'Documento identita', 'Carta identita o passaporto valido', 'identita', true, 2),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cliente', 'C0', 'Privacy firmata', 'Informativa privacy e consenso trattamento dati firmato', 'contratti', true, 3);

-- ============================================
-- 2. AGGIUNGI IBAN AL CONTATTO
-- ============================================
ALTER TABLE contatti
  ADD COLUMN IF NOT EXISTS iban VARCHAR(34);
