-- Migration: Template Preventivo predefinito
-- Descrizione: Crea il template predefinito per i preventivi

INSERT INTO document_templates (
  tenant_id,
  nome,
  descrizione,
  categoria,
  contenuto,
  contenuto_html,
  variabili_utilizzate,
  formato_pagina,
  orientamento,
  margini,
  attivo,
  predefinito,
  versione
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Preventivo Standard',
  'Template predefinito per preventivi servizi one-shot',
  'preventivo',
  '{
    "type": "doc",
    "content": [
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "cliente",
          "config": {
            "showAddress": true,
            "showContacts": true,
            "showCf": true,
            "showPiva": true
          }
        }
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [
          { "type": "text", "text": "Preventivo n. " },
          {
            "type": "variableMention",
            "attrs": { "id": "documento.numero", "label": "Numero documento" }
          },
          { "type": "text", "text": " del " },
          {
            "type": "variableMention",
            "attrs": { "id": "oggi", "label": "Data di oggi" }
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Oggetto: Servizi per la proprietà " },
          {
            "type": "variableMention",
            "attrs": { "id": "proprieta.nome", "label": "Nome proprietà" }
          },
          { "type": "text", "text": " - " },
          {
            "type": "variableMention",
            "attrs": { "id": "proprieta.indirizzo", "label": "Indirizzo proprietà" }
          }
        ]
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Gentile " },
          {
            "type": "variableMention",
            "attrs": { "id": "cliente.nome_completo", "label": "Nome cliente" }
          },
          { "type": "text", "text": "," }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "con la presente Le sottoponiamo il preventivo per i servizi di avviamento della Sua proprietà." }
        ]
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "serviziTabella",
          "config": {
            "showDescription": true,
            "showQuantity": true
          }
        }
      },
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "totali",
          "config": {
            "showSubtotale": true,
            "showIva": true,
            "showAcconto": false
          }
        }
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "note",
          "config": {
            "style": "info"
          }
        }
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "marks": [{ "type": "italic" }], "text": "Nota: La gestione operativa della proprietà e relativi compensi saranno regolati da contratto di mandato separato." }
        ]
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "validita",
          "config": {
            "days": 30
          }
        }
      },
      {
        "type": "heading",
        "attrs": { "level": 3 },
        "content": [
          { "type": "text", "text": "Modalita di pagamento" }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Il pagamento dovra essere effettuato tramite bonifico bancario alle seguenti coordinate:" }
        ]
      },
      {
        "type": "bulletList",
        "content": [
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Intestatario: " },
                  {
                    "type": "variableMention",
                    "attrs": { "id": "azienda.nome", "label": "Nome azienda" }
                  }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "IBAN: " },
                  { "type": "text", "text": "[IBAN da inserire]" }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Causale: " },
                  { "type": "text", "text": "Preventivo " },
                  {
                    "type": "variableMention",
                    "attrs": { "id": "documento.numero", "label": "Numero documento" }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "termini",
          "config": {}
        }
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Per accettazione del presente preventivo, si prega di restituire copia firmata." }
        ]
      },
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "firme",
          "config": {
            "showDate": true,
            "leftLabel": "Il Fornitore",
            "rightLabel": "Il Cliente (per accettazione)"
          }
        }
      }
    ]
  }'::jsonb,
  NULL,
  ARRAY['documento.numero', 'oggi', 'proprieta.nome', 'proprieta.indirizzo', 'cliente.nome_completo', 'azienda.nome'],
  'A4',
  'portrait',
  '{"top": 20, "right": 20, "bottom": 20, "left": 20}'::jsonb,
  true,
  true,
  1
)
ON CONFLICT DO NOTHING;
