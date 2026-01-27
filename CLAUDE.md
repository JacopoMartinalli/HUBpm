# HUBpm - Property Management Hub

## Panoramica Progetto
Sistema gestionale per Property Manager specializzato in affitti brevi. Gestisce l'intero ciclo di vita: da Lead potenziale fino a Proprietà operativa con prenotazioni.

## Stack Tecnologico
- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase Cloud (PostgreSQL, RLS) — NON Docker locale
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

## Comandi Essenziali
```bash
npm run dev          # Avvia dev server (localhost:3000)
npm run build        # Build produzione
# DB è su Supabase Cloud — le migrazioni vanno applicate manualmente via SQL Editor o npx supabase db push
```

## Configurazione
File `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
NEXT_PUBLIC_DEFAULT_TENANT_ID=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

---

## Struttura Progetto

```
src/
├── app/                    # Pages (App Router)
│   ├── lead/              # Gestione Lead (kanban + tabella)
│   ├── clienti/           # Clienti convertiti
│   ├── partner/           # Fornitori (pulizie, manutenzione...)
│   ├── proprieta/         # Proprietà attive in gestione
│   ├── proprieta-lead/    # Proprietà in fase di valutazione
│   ├── servizi/           # Catalogo servizi e pacchetti
│   ├── prenotazioni/      # Calendario prenotazioni
│   ├── task/              # Task da completare
│   └── property-manager/  # Dati aziendali PM
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── shared/            # Componenti riutilizzabili
│   ├── erogazione/        # Gestione erogazione servizi
│   └── proposte/          # Proposte commerciali
├── lib/
│   ├── hooks/             # Custom hooks (useContatti, useProprieta...)
│   ├── services/          # Logiche business (fase-service)
│   └── supabase.ts        # Client Supabase
├── constants/index.ts     # TUTTE le costanti (fasi, stati, tipi)
└── types/database.ts      # TypeScript types per DB
```

---

## Schema Database Principale

### Tabella `contatti` (Lead, Clienti, Partner)
```sql
- id, tenant_id, tipo ('lead'|'cliente'|'partner')
- nome, cognome, email, telefono
- tipo_persona ('persona_fisica'|'persona_giuridica')
- codice_fiscale, partita_iva, indirizzo, citta, cap, provincia
-- Campi Lead:
- fase_lead ('L0'|'L1'|'L2'|'L3')
- esito_lead ('in_corso'|'vinto'|'perso')
- fonte_lead, valore_stimato, motivo_perso, motivo_perso_codice
-- Campi Cliente:
- fase_cliente ('C0'|'C1'|'C2'|'C3')
- data_conversione, data_inizio_contratto, data_fine_contratto
-- Campi Partner:
- tipo_partner, azienda, specializzazioni, tariffa_default
```

### Tabella `proprieta_lead` (Proprietà in valutazione)
```sql
- id, tenant_id, contatto_id (FK)
- nome, indirizzo, citta, tipologia
- fase ('PL0'|'PL1'|'PL2'|'PL3')
- esito ('in_corso'|'confermato'|'scartato')
- data_sopralluogo, revenue_stimato_annuo, commissione_proposta
```

### Tabella `proprieta` (Proprietà in gestione)
```sql
- id, tenant_id, contatto_id (FK), proprieta_lead_id (FK opzionale)
- nome, indirizzo, citta, tipologia
- fase ('P0'|'P1'|'P2'|'P3'|'P4'|'P5')
- commissione_percentuale
-- Dati catastali: foglio, mappale, subalterno, categoria_catastale
-- Codici STR: cir, cin, scia_protocollo, alloggiati_web_attivo
-- Strutturali: max_ospiti, camere, bagni, mq
-- Operativi: wifi_ssid, wifi_password, codice_portone, checkin_orario
```

### Tabella `catalogo_servizi`
```sql
- id, tenant_id, categoria_id (FK)
- nome, descrizione, tipo ('one_shot'|'ricorrente')
- prezzo_base, prezzo_tipo ('fisso'|'percentuale'|'da_quotare')
- vendibile_singolarmente, attivo
```

### Tabella `pacchetti_servizi`
```sql
- id, tenant_id, categoria_id
- nome, descrizione, prezzo_base
- tipo_esito ('one_shot'|'ricorrente')
```

### Tabella `proposte_commerciali`
```sql
- id, tenant_id, proprieta_id, contatto_id
- numero (auto: PROP-2025-0001), titolo, stato
- stato ('bozza'|'inviata'|'accettata'|'rifiutata'|'scaduta')
- subtotale, sconto_percentuale, sconto_fisso, totale
```

### Altre Tabelle
- `prenotazioni` - Prenotazioni con stato, canale, importi
- `task` - Task con template, scadenza, priorità
- `documenti` - Documenti con stato (mancante/richiesto/ricevuto/verificato)
- `locali` - Stanze/ambienti della proprietà
- `asset` - Inventario oggetti/elettrodomestici
- `partner_proprieta` - Assegnazione partner a proprietà

---

## Flussi di Business

### 1. Pipeline Lead (L0 → L3 → Cliente)
```
L0: Nuovo Lead      → Prima chiamata, registra fonte
L1: Contattato      → Aggiunge proprietà lead, raccoglie dati
L2: In Valutazione  → Pianifica/effettua sopralluogo
L3: Qualificato     → Prepara per conversione, converti a cliente
```

### 2. Pipeline Proprietà Lead (PL0 → PL3)
```
PL0: Registrata    → Dati base inseriti
PL1: Info Raccolte → Foto, planimetrie, caratteristiche
PL2: Sopralluogo   → Visita effettuata
PL3: Valutata      → Stima revenue, pronta per proposta
```

### 3. Pipeline Cliente (C0 → C2)
```
C0: Onboarding → Raccolta documenti, setup
C1: Servizi    → Erogazione servizi acquistati
C2: Attivo     → Cliente operativo
C3: Cessato    → Rapporto concluso
```

### 4. Pipeline Proprietà (P0 → P4)
```
P0: Onboarding     → Raccolta documenti proprietà
P1: Setup Legale   → SCIA, CIR, CIN, Alloggiati
P2: Setup Operativo→ Foto, annunci, channel manager
P3: Go-Live        → Attivazione annunci, test
P4: Operativa      → Gestione quotidiana attiva
P5: Cessata        → Non più gestita
```

### 5. Conversione Lead → Cliente
- Il lead viene convertito con `useConvertLeadToCliente()`
- Le proprietà_lead con esito "confermato" diventano proprietà
- Il cliente parte da fase C0 (Onboarding)

---

## Hooks Principali

```typescript
// Contatti
useLeads()                    // Lista lead
useClienti()                  // Lista clienti
usePartner()                  // Lista partner
useContatto(id)               // Singolo contatto
useCreateContatto()           // Crea nuovo
useUpdateContatto()           // Aggiorna
useConvertLeadToCliente()     // Converte lead
useMarkLeadAsLost()           // Segna perso

// Proprietà
useProprieta()                // Lista proprietà attive
useProprietaLead()            // Lista proprietà lead
useProprietaByContatto(id)    // Proprietà di un cliente

// Servizi
useCategorie()                // Categorie servizi
useServizi()                  // Catalogo servizi
usePacchetti()                // Pacchetti servizi
useProposte(proprietaId)      // Proposte per proprietà

// Erogazione
useErogazionePacchetti(proprietaId)
useErogazioneServizi(proprietaId)
```

---

## Costanti Importanti (src/constants/index.ts)

```typescript
FASI_LEAD          // L0, L1, L2, L3
FASI_PROPRIETA_LEAD// PL0, PL1, PL2, PL3
FASI_CLIENTE       // C0, C1, C2, C3
FASI_PROPRIETA     // P0, P1, P2, P3, P4, P5

ESITI_LEAD         // in_corso, vinto, perso
MOTIVI_LEAD_PERSO  // prezzo, competitor, non_risponde, tempistiche, proprieta_non_idonea, cambio_idea, altro

TIPOLOGIE_PROPRIETA// appartamento, villa, chalet, mansarda...
TIPI_PARTNER       // pulizie, manutenzione, elettricista, idraulico...
FONTI_LEAD         // campagna_meta, instagram, sito_web, passaparola...

STATI_TASK         // da_fare, in_corso, completato, bloccato, annullato
CATEGORIE_TASK     // documenti, pratiche, comunicazioni, setup, verifica
```

---

## Servizi e Pacchetti Pre-configurati

### Categorie
1. **Consulenza** - Sopralluogo, Analisi Mercato, Business Plan
2. **Avvio Legale** - SCIA, CIR/CIN, Alloggiati, ISTAT
3. **Avviamento Operativo** - Annunci OTA, Strategia Prezzi, Messa a norma
4. **Contenuti & Digital** - Shooting foto, Drone, Welcome Book
5. **Gestione** - Check-in/out, Pulizie, Schedazione, Reportistica

### Pacchetti
1. **Avvio Legale** (€250) - Tutte le pratiche burocratiche
2. **Messa a Norma** (€130) - Targhetta + Estintore + Rilevatore gas
3. **Foto Completo** (€300) - Shooting + Drone
4. **Lancio OTA** (€700) - Booking + Airbnb + Strategia prezzi + Welcome book

---

## Note di Sviluppo

### Tenant ID
Il sistema è multi-tenant. Usa sempre `DEFAULT_TENANT_ID` da `src/lib/supabase.ts`.
Valore attuale: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`

### Task Automatici
Quando si cambia fase di un lead/proprietà, i task vengono generati automaticamente
tramite `generaTaskPerFase()` in `src/lib/services/fase-service.ts`.

### Proposte Commerciali
- Numero auto-generato: PROP-ANNO-XXXX
- Stati: bozza → inviata → accettata/rifiutata/scaduta
- Totali ricalcolati automaticamente via trigger SQL

### Row Level Security (RLS)
Attivo su tutte le tabelle. In development: policy "Allow all" permissiva.
Da configurare con auth reale per produzione.
