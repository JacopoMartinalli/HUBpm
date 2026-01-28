-- Aggiunge campi intestazione e piè di pagina globali per documenti
ALTER TABLE property_manager ADD COLUMN IF NOT EXISTS intestazione_json jsonb;
ALTER TABLE property_manager ADD COLUMN IF NOT EXISTS pie_pagina_json jsonb;
