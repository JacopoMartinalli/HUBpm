-- ============================================
-- MIGRAZIONE: Elimina tutte le task esistenti
-- Data: 2025-01-25
-- ============================================

-- Elimina tutte le task di erogazione
DELETE FROM erogazione_task;

-- Elimina tutti i template task
DELETE FROM template_task_servizio;
