-- ============================================
-- MIGRAZIONE: Elimina tutte le task principali
-- Data: 2025-01-25
-- ============================================

-- Elimina tutte le task dalla tabella principale
DELETE FROM task;

-- Elimina tutti i template task
DELETE FROM template_task;