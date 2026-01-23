// ============================================
// ENUMS E TIPI BASE
// ============================================

export type TipoContatto = 'lead' | 'cliente' | 'partner'
export type TipoPersona = 'persona_fisica' | 'persona_giuridica'

// Fasi Lead (L0: Primo Contatto, L1: Qualifica in Corso, L2: Lead Qualificato, L3: Pronto Conversione)
export type FaseLead = 'L0' | 'L1' | 'L2' | 'L3'
export type EsitoLead = 'in_corso' | 'vinto' | 'perso'

// Fasi Proprietà Lead
export type FaseProprietaLead = 'PL0' | 'PL1' | 'PL2' | 'PL3' | 'PL4'
export type EsitoProprietaLead = 'in_corso' | 'confermato' | 'scartato'

// Fasi Cliente
export type FaseCliente = 'C0' | 'C1' | 'C2' | 'C3'

// Fasi Proprietà
export type FaseProprieta = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

// Partner
export type TipoPartner =
  | 'pulizie' | 'manutenzione' | 'elettricista' | 'idraulico'
  | 'fotografo' | 'commercialista' | 'avvocato' | 'notaio' | 'altro'

// Proprietà
export type TipologiaProprieta =
  | 'appartamento' | 'villa' | 'chalet' | 'mansarda'
  | 'monolocale' | 'bilocale' | 'trilocale' | 'casa_vacanze' | 'altro'

// Locali
export type TipoLocale =
  | 'camera_matrimoniale' | 'camera_singola' | 'camera_doppia'
  | 'soggiorno' | 'cucina' | 'bagno' | 'ripostiglio'
  | 'balcone' | 'terrazzo' | 'giardino'
  | 'garage' | 'posto_auto' | 'cantina' | 'altro'

// Asset
export type CategoriaAsset =
  | 'elettrodomestico' | 'arredo' | 'biancheria'
  | 'stoviglie' | 'elettronica' | 'decorazione' | 'altro'

export type StatoAsset = 'nuovo' | 'buono' | 'usato' | 'da_sostituire' | 'dismesso'

// Documenti
export type CategoriaDocumento =
  | 'identita' | 'fiscale' | 'proprieta' | 'certificazioni'
  | 'contratti' | 'procure' | 'legale' | 'operativo' | 'marketing'

export type StatoDocumento = 'mancante' | 'richiesto' | 'ricevuto' | 'verificato' | 'scaduto'

// Task
export type StatoTask = 'da_fare' | 'in_corso' | 'completato' | 'bloccato' | 'annullato'
export type PrioritaTask = 'bassa' | 'media' | 'alta' | 'urgente'
export type CategoriaTask = 'documenti' | 'pratiche' | 'comunicazioni' | 'setup' | 'verifica' | 'altro'

// Servizi
export type TipoServizio = 'one_shot' | 'ricorrente'
export type TipoPrezzo = 'fisso' | 'percentuale' | 'da_quotare'
export type StatoServizioVenduto = 'da_iniziare' | 'in_corso' | 'completato' | 'annullato'

// Prenotazioni
export type StatoPrenotazione = 'richiesta' | 'confermata' | 'checkin' | 'checkout' | 'cancellata' | 'no_show'
export type CanalePrenota = 'airbnb' | 'booking' | 'vrbo' | 'direct' | 'altro'

// Tariffa
export type TipoTariffa = 'oraria' | 'a_chiamata' | 'mensile' | 'per_intervento'

// ============================================
// ENTITÀ DATABASE
// ============================================

export interface Contatto {
  id: string
  tenant_id: string
  tipo: TipoContatto
  tipo_persona: TipoPersona | null
  nome: string
  cognome: string
  email: string | null
  telefono: string | null
  codice_fiscale: string | null
  partita_iva: string | null
  indirizzo: string | null
  citta: string | null
  cap: string | null
  provincia: string | null
  // Lead
  fase_lead: FaseLead | null
  esito_lead: EsitoLead | null
  fonte_lead: string | null
  valore_stimato: number | null
  motivo_perso: string | null
  // Cliente
  fase_cliente: FaseCliente | null
  data_conversione: string | null
  data_inizio_contratto: string | null
  data_fine_contratto: string | null
  // Partner
  tipo_partner: TipoPartner | null
  azienda: string | null
  specializzazioni: string | null
  tariffa_default: number | null
  tariffa_tipo: TipoTariffa | null
  // Common
  note: string | null
  created_at: string
  updated_at: string
}

export interface ProprietaLead {
  id: string
  tenant_id: string
  contatto_id: string
  nome: string
  indirizzo: string
  citta: string
  cap: string | null
  provincia: string | null
  tipologia: TipologiaProprieta | null
  fase: FaseProprietaLead
  esito: EsitoProprietaLead | null
  motivo_scartato: string | null
  data_sopralluogo: string | null
  revenue_stimato_annuo: number | null
  investimento_richiesto: number | null
  note_sopralluogo: string | null
  commissione_proposta: number | null
  servizi_proposti: string | null
  data_proposta: string | null
  note: string | null
  created_at: string
  updated_at: string
  // Relazioni (join)
  contatto?: Contatto
}

export interface Proprieta {
  id: string
  tenant_id: string
  contatto_id: string
  proprieta_lead_id: string | null
  nome: string
  indirizzo: string
  citta: string
  cap: string | null
  provincia: string | null
  tipologia: TipologiaProprieta
  fase: FaseProprieta
  commissione_percentuale: number
  // Catastali
  foglio: string | null
  mappale: string | null
  subalterno: string | null
  categoria_catastale: string | null
  rendita_catastale: number | null
  // Codici STR
  cir: string | null
  cin: string | null
  scia_protocollo: string | null
  scia_data: string | null
  alloggiati_web_attivo: boolean
  ross1000_attivo: boolean
  // Strutturali
  max_ospiti: number | null
  camere: number | null
  bagni: number | null
  mq: number | null
  piano: string | null
  // Costi
  costo_pulizie: number | null
  tassa_soggiorno_persona: number | null
  // Channel Manager
  channel_manager: string | null
  id_channel_manager: string | null
  // Operativi
  wifi_ssid: string | null
  wifi_password: string | null
  codice_portone: string | null
  codice_appartamento: string | null
  istruzioni_accesso: string | null
  checkin_orario: string | null
  checkout_orario: string | null
  regole_casa: string | null
  smaltimento_rifiuti: string | null
  parcheggio: string | null
  note: string | null
  created_at: string
  updated_at: string
  // Relazioni
  contatto?: Contatto
  locali?: Locale[]
  asset?: Asset[]
}

export interface Locale {
  id: string
  tenant_id: string
  proprieta_id: string
  tipo: TipoLocale
  nome: string
  mq: number | null
  posti_letto: number | null
  dotazioni: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  tenant_id: string
  proprieta_id: string
  locale_id: string | null
  nome: string
  categoria: CategoriaAsset
  quantita: number
  attributi: Record<string, unknown>
  foto_url: string | null
  scontrino_url: string | null
  manuale_url: string | null
  data_acquisto: string | null
  costo: number | null
  fornitore: string | null
  garanzia_scadenza: string | null
  stato: StatoAsset
  note: string | null
  created_at: string
  updated_at: string
  // Relazioni
  locale?: Locale
}

export interface PartnerProprieta {
  id: string
  tenant_id: string
  partner_id: string
  proprieta_id: string
  ruolo: string
  priorita: number
  attivo: boolean
  tariffa: number | null
  tariffa_tipo: TipoTariffa | null
  contratto_url: string | null
  contratto_scadenza: string | null
  note: string | null
  created_at: string
  updated_at: string
  // Relazioni
  partner?: Contatto
  proprieta?: Proprieta
}

export interface TemplateDocumento {
  id: string
  tenant_id: string
  tipo_entita: 'cliente' | 'proprieta'
  fase: string
  nome: string
  descrizione: string | null
  categoria: CategoriaDocumento
  obbligatorio: boolean
  ordine: number
  created_at: string
}

export interface Documento {
  id: string
  tenant_id: string
  template_id: string | null
  contatto_id: string | null
  proprieta_id: string | null
  nome: string
  descrizione: string | null
  categoria: CategoriaDocumento
  stato: StatoDocumento
  obbligatorio: boolean
  file_url: string | null
  file_name: string | null
  file_size: number | null
  data_scadenza: string | null
  data_caricamento: string | null
  data_verifica: string | null
  verificato_da: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface CatalogoServizio {
  id: string
  tenant_id: string
  nome: string
  descrizione: string | null
  tipo: TipoServizio
  prezzo_base: number | null
  prezzo_tipo: TipoPrezzo | null
  fase_applicabile: string | null
  attivo: boolean
  ordine: number
  created_at: string
}

export interface ServizioVenduto {
  id: string
  tenant_id: string
  servizio_id: string
  contatto_id: string
  proprieta_id: string | null
  prezzo: number
  prezzo_tipo: TipoPrezzo
  stato: StatoServizioVenduto
  data_vendita: string
  data_inizio: string | null
  data_completamento: string | null
  note: string | null
  created_at: string
  updated_at: string
  // Relazioni
  servizio?: CatalogoServizio
  contatto?: Contatto
  proprieta?: Proprieta
}

export interface TemplateTask {
  id: string
  tenant_id: string
  tipo_entita: 'lead' | 'proprieta_lead' | 'cliente' | 'proprieta'
  fase: string
  titolo: string
  descrizione: string | null
  categoria: CategoriaTask | null
  ordine: number
  giorni_deadline: number | null
  prerequisito_id: string | null
  attivo: boolean
  created_at: string
}

export interface Task {
  id: string
  tenant_id: string
  template_id: string | null
  contatto_id: string | null
  proprieta_id: string | null
  proprieta_lead_id: string | null
  titolo: string
  descrizione: string | null
  categoria: CategoriaTask | null
  stato: StatoTask
  priorita: PrioritaTask
  data_scadenza: string | null
  data_inizio: string | null
  data_completamento: string | null
  completato_da: string | null
  note: string | null
  created_at: string
  updated_at: string
  // Relazioni
  contatto?: Contatto
  proprieta?: Proprieta
  proprieta_lead?: ProprietaLead
}

export interface Prenotazione {
  id: string
  tenant_id: string
  proprieta_id: string
  external_id: string | null
  canale: string | null
  codice_prenotazione: string | null
  checkin: string
  checkout: string
  notti: number
  ospite_nome: string | null
  ospite_cognome: string | null
  ospite_email: string | null
  ospite_telefono: string | null
  ospite_nazione: string | null
  num_ospiti: number | null
  num_adulti: number | null
  num_bambini: number | null
  importo_lordo: number | null
  commissione_ota: number | null
  importo_netto: number | null
  costo_pulizie: number | null
  tassa_soggiorno_totale: number | null
  stato: StatoPrenotazione
  pagato_proprietario: boolean
  data_pagamento_proprietario: string | null
  metodo_pagamento_proprietario: string | null
  note: string | null
  created_at: string
  updated_at: string
  // Relazioni
  proprieta?: Proprieta
}

// View con calcoli
export interface PrenotazioneDettaglio extends Prenotazione {
  proprieta_nome: string
  commissione_percentuale: number
  cliente_nome: string
  cliente_cognome: string
  commissione_pm: number
  spettanza_proprietario: number
}

// ============================================
// TIPI PER INSERT/UPDATE
// ============================================

export type ContattoInsert = Omit<Contatto, 'id' | 'created_at' | 'updated_at'>
export type ContattoUpdate = Partial<ContattoInsert>

export type ProprietaLeadInsert = Omit<ProprietaLead, 'id' | 'created_at' | 'updated_at' | 'contatto'>
export type ProprietaLeadUpdate = Partial<ProprietaLeadInsert>

export type ProprietaInsert = Omit<Proprieta, 'id' | 'created_at' | 'updated_at' | 'contatto' | 'locali' | 'asset'>
export type ProprietaUpdate = Partial<ProprietaInsert>

export type LocaleInsert = Omit<Locale, 'id' | 'created_at' | 'updated_at'>
export type LocaleUpdate = Partial<LocaleInsert>

export type AssetInsert = Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'locale'>
export type AssetUpdate = Partial<AssetInsert>

export type PartnerProprietaInsert = Omit<PartnerProprieta, 'id' | 'created_at' | 'updated_at' | 'partner' | 'proprieta'>
export type PartnerProprietaUpdate = Partial<PartnerProprietaInsert>

export type DocumentoInsert = Omit<Documento, 'id' | 'created_at' | 'updated_at'>
export type DocumentoUpdate = Partial<DocumentoInsert>

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'contatto' | 'proprieta' | 'proprieta_lead'>
export type TaskUpdate = Partial<TaskInsert>

export type PrenotazioneInsert = Omit<Prenotazione, 'id' | 'created_at' | 'updated_at' | 'notti' | 'proprieta'>
export type PrenotazioneUpdate = Partial<PrenotazioneInsert>

export type ServizioVendutoInsert = Omit<ServizioVenduto, 'id' | 'created_at' | 'updated_at' | 'servizio' | 'contatto' | 'proprieta'>
export type ServizioVendutoUpdate = Partial<ServizioVendutoInsert>

export type CatalogoServizioInsert = Omit<CatalogoServizio, 'id' | 'created_at'>
export type CatalogoServizioUpdate = Partial<CatalogoServizioInsert>

// ============================================
// PROPERTY MANAGER (Dati Aziendali PM)
// ============================================

export interface PropertyManager {
  id: string
  tenant_id: string
  // Dati Aziendali
  ragione_sociale: string
  nome_commerciale: string | null
  partita_iva: string | null
  codice_fiscale: string | null
  codice_sdi: string | null
  pec: string | null
  // Indirizzo
  indirizzo: string | null
  citta: string | null
  cap: string | null
  provincia: string | null
  // Contatti
  email: string | null
  telefono: string | null
  cellulare: string | null
  sito_web: string | null
  // Social
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  // Referente
  referente_nome: string | null
  referente_cognome: string | null
  referente_ruolo: string | null
  referente_email: string | null
  referente_telefono: string | null
  // Dati Bancari
  banca: string | null
  iban: string | null
  swift: string | null
  intestatario_conto: string | null
  // Logo e branding
  logo_url: string | null
  colore_primario: string | null
  // Note
  note: string | null
  created_at: string
  updated_at: string
}

export type PropertyManagerInsert = Omit<PropertyManager, 'id' | 'created_at' | 'updated_at'>
export type PropertyManagerUpdate = Partial<PropertyManagerInsert>
