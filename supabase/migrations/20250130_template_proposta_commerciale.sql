-- Template Proposta Commerciale Standard
-- Tenant ID default per development
INSERT INTO document_templates (
  tenant_id,
  nome,
  descrizione,
  categoria,
  contenuto,
  variabili_utilizzate,
  attivo,
  predefinito,
  versione,
  formato_pagina,
  orientamento,
  margini
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Proposta Commerciale Standard',
  'Template standard per email/proposta commerciale con presentazione servizi',
  'proposta',
  '{
    "type": "doc",
    "content": [
      {
        "type": "dynamicBlock",
        "attrs": {
          "blockType": "header",
          "config": {
            "showLogo": true,
            "showAddress": true,
            "showContacts": true,
            "showPiva": true
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
          "blockType": "cliente",
          "config": {
            "showAddress": true,
            "showContacts": true,
            "showCf": false,
            "showPiva": false
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
          { "type": "text", "text": "Proposta Commerciale" }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Gentile " },
          { "type": "text", "marks": [{"type": "bold"}], "text": "@cliente.nome" },
          { "type": "text", "text": "," }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "a seguito del nostro incontro, siamo lieti di presentarle la nostra proposta per la gestione della sua proprietà " },
          { "type": "text", "marks": [{"type": "bold"}], "text": "@proprieta.nome" },
          { "type": "text", "text": "." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Di seguito i servizi che abbiamo selezionato per lei:" }
        ]
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
            "showIva": false
          }
        }
      },
      {
        "type": "paragraph",
        "content": []
      },
      {
        "type": "heading",
        "attrs": { "level": 3 },
        "content": [
          { "type": "text", "text": "Il nostro servizio di gestione" }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Oltre ai servizi sopra indicati, offriamo un servizio di gestione completa della proprietà che include:" }
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
                "content": [{ "type": "text", "text": "Gestione prenotazioni e comunicazioni con gli ospiti" }]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Check-in e check-out professionali" }]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Coordinamento pulizie e manutenzioni" }]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Reportistica mensile dettagliata" }]
              }
            ]
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "La commissione per il servizio di gestione viene calcolata sul fatturato e verrà dettagliata nel contratto." }
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
        "type": "paragraph",
        "content": []
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Rimaniamo a disposizione per qualsiasi chiarimento." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Cordiali saluti," }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "marks": [{"type": "bold"}], "text": "@azienda.nome" }
        ]
      }
    ]
  }',
  ARRAY['cliente.nome', 'cliente.cognome', 'proprieta.nome', 'azienda.nome'],
  true,
  true,
  1,
  'A4',
  'portrait',
  '{"top": 20, "right": 20, "bottom": 20, "left": 20}'
)
ON CONFLICT DO NOTHING;
