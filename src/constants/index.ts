// ============================================
// FASI E PIPELINE
// ============================================

export const FASI_LEAD = [
  { id: 'L0', label: 'Nuovo Lead', description: 'Lead appena entrato nel sistema', color: 'bg-gray-100', textColor: 'text-gray-700' },
  { id: 'L1', label: 'Contattato', description: 'Prima chiamata effettuata, interesse verificato', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'L2', label: 'In Valutazione', description: 'Raccolta info, sopralluogo in corso', color: 'bg-indigo-100', textColor: 'text-indigo-700' },
  { id: 'L3', label: 'Qualificato', description: 'Pronto per conversione a cliente', color: 'bg-green-100', textColor: 'text-green-700' },
] as const

export const FASI_PROPRIETA_LEAD = [
  { id: 'PL0', label: 'Registrata', description: 'Dati base proprietà inseriti', color: 'bg-gray-100', textColor: 'text-gray-700' },
  { id: 'PL1', label: 'Info Raccolte', description: 'Foto, planimetrie, caratteristiche complete', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'PL2', label: 'Sopralluogo', description: 'Visita effettuata, valutazione tecnica', color: 'bg-indigo-100', textColor: 'text-indigo-700' },
  { id: 'PL3', label: 'Valutata', description: 'Analisi completata, pronta per proposta', color: 'bg-green-100', textColor: 'text-green-700' },
] as const

export const FASI_CLIENTE = [
  { id: 'C0', label: 'Onboarding', description: 'Raccolta documenti, setup sistemi', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'C1', label: 'Servizi', description: 'Erogazione servizi acquistati', color: 'bg-indigo-100', textColor: 'text-indigo-700' },
  { id: 'C2', label: 'Attivo', description: 'Cliente operativo', color: 'bg-green-100', textColor: 'text-green-700' },
  { id: 'C3', label: 'Cessato', description: 'Rapporto concluso', color: 'bg-gray-100', textColor: 'text-gray-700' },
] as const

export const FASI_PROPRIETA = [
  { id: 'P0', label: 'Onboarding', description: 'Raccolta documenti proprietà', color: 'bg-gray-100', textColor: 'text-gray-700' },
  { id: 'P1', label: 'Setup Legale', description: 'SCIA, CIR, CIN, Alloggiati', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'P2', label: 'Setup Operativo', description: 'Foto, annunci, channel manager', color: 'bg-indigo-100', textColor: 'text-indigo-700' },
  { id: 'P3', label: 'Go-Live', description: 'Attivazione annunci, test', color: 'bg-purple-100', textColor: 'text-purple-700' },
  { id: 'P4', label: 'Operativa', description: 'Gestione quotidiana attiva', color: 'bg-green-100', textColor: 'text-green-700' },
  { id: 'P5', label: 'Cessata', description: 'Proprietà non più gestita', color: 'bg-gray-100', textColor: 'text-gray-500' },
] as const

// ============================================
// ESITI
// ============================================

export const ESITI_LEAD = [
  { id: 'in_corso', label: 'In Corso', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'vinto', label: 'Vinto', color: 'bg-green-100 text-green-800' },
  { id: 'perso', label: 'Perso', color: 'bg-red-100 text-red-800' },
] as const

// ============================================
// MOTIVI LEAD PERSO
// ============================================

export const MOTIVI_LEAD_PERSO = [
  { id: 'prezzo', label: 'Prezzo troppo alto', description: 'Non rientra nel budget del cliente' },
  { id: 'competitor', label: 'Scelto competitor', description: 'Ha preferito altra agenzia/servizio' },
  { id: 'non_risponde', label: 'Non risponde', description: 'Contatto perso, non raggiungibile' },
  { id: 'tempistiche', label: 'Tempistiche', description: 'Non pronto ora, rimandato a data da destinarsi' },
  { id: 'proprieta_non_idonea', label: 'Proprietà non idonea', description: 'Non gestiamo questo tipo di proprietà' },
  { id: 'cambio_idea', label: 'Cambio idea', description: 'Non vuole più affittare/vendere' },
  { id: 'altro', label: 'Altro', description: 'Motivo specificato nelle note' },
] as const

export const ESITI_PROPRIETA_LEAD = [
  { id: 'in_corso', label: 'In Corso', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'confermato', label: 'Confermato', color: 'bg-green-100 text-green-800' },
  { id: 'scartato', label: 'Scartato', color: 'bg-red-100 text-red-800' },
] as const

// ============================================
// CONTATTI
// ============================================

export const TIPI_PERSONA = [
  { id: 'persona_fisica', label: 'Persona Fisica' },
  { id: 'persona_giuridica', label: 'Società' },
] as const

export const TIPI_PARTNER = [
  { id: 'pulizie', label: 'Team Pulizie', icon: '🧹' },
  { id: 'manutenzione', label: 'Manutentore', icon: '🔧' },
  { id: 'elettricista', label: 'Elettricista', icon: '⚡' },
  { id: 'idraulico', label: 'Idraulico', icon: '🚿' },
  { id: 'fotografo', label: 'Fotografo', icon: '📷' },
  { id: 'commercialista', label: 'Commercialista', icon: '📊' },
  { id: 'avvocato', label: 'Avvocato', icon: '⚖️' },
  { id: 'notaio', label: 'Notaio', icon: '📜' },
  { id: 'altro', label: 'Altro', icon: '👤' },
] as const

export const FONTI_LEAD = [
  { id: 'campagna_meta', label: 'Campagna Meta (Instagram/Facebook)' },
  { id: 'instagram', label: 'Instagram (organico)' },
  { id: 'facebook', label: 'Facebook (organico)' },
  { id: 'sito_web', label: 'Sito Web' },
  { id: 'volantino', label: 'Volantino' },
  { id: 'chiamata_diretta', label: 'Chiamata Diretta' },
  { id: 'passaparola', label: 'Passaparola' },
  { id: 'google', label: 'Google' },
  { id: 'partner', label: 'Partner/Referral' },
  { id: 'altro', label: 'Altro' },
] as const

export const TIPI_TARIFFA = [
  { id: 'oraria', label: 'Oraria' },
  { id: 'a_chiamata', label: 'A Chiamata' },
  { id: 'mensile', label: 'Mensile' },
  { id: 'per_intervento', label: 'Per Intervento' },
] as const

// ============================================
// PROPRIETÀ
// ============================================

export const TIPOLOGIE_PROPRIETA = [
  { id: 'appartamento', label: 'Appartamento' },
  { id: 'villa', label: 'Villa' },
  { id: 'chalet', label: 'Chalet' },
  { id: 'mansarda', label: 'Mansarda' },
  { id: 'monolocale', label: 'Monolocale' },
  { id: 'bilocale', label: 'Bilocale' },
  { id: 'trilocale', label: 'Trilocale' },
  { id: 'casa_vacanze', label: 'Casa Vacanze' },
  { id: 'altro', label: 'Altro' },
] as const

export const TIPI_LOCALE = [
  { id: 'camera_matrimoniale', label: 'Camera Matrimoniale', icon: '🛏️' },
  { id: 'camera_singola', label: 'Camera Singola', icon: '🛏️' },
  { id: 'camera_doppia', label: 'Camera Doppia', icon: '🛏️' },
  { id: 'soggiorno', label: 'Soggiorno', icon: '🛋️' },
  { id: 'cucina', label: 'Cucina', icon: '🍳' },
  { id: 'bagno', label: 'Bagno', icon: '🚿' },
  { id: 'ripostiglio', label: 'Ripostiglio', icon: '🚪' },
  { id: 'balcone', label: 'Balcone', icon: '🌅' },
  { id: 'terrazzo', label: 'Terrazzo', icon: '🌅' },
  { id: 'giardino', label: 'Giardino', icon: '🌳' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'posto_auto', label: 'Posto Auto', icon: '🅿️' },
  { id: 'cantina', label: 'Cantina', icon: '📦' },
  { id: 'altro', label: 'Altro', icon: '📍' },
] as const

// ============================================
// ASSET
// ============================================

export const CATEGORIE_ASSET = [
  { id: 'elettrodomestico', label: 'Elettrodomestico', icon: '🔌' },
  { id: 'arredo', label: 'Arredo', icon: '🪑' },
  { id: 'biancheria', label: 'Biancheria', icon: '🛏️' },
  { id: 'stoviglie', label: 'Stoviglie', icon: '🍽️' },
  { id: 'elettronica', label: 'Elettronica', icon: '📺' },
  { id: 'decorazione', label: 'Decorazione', icon: '🖼️' },
  { id: 'altro', label: 'Altro', icon: '📦' },
] as const

export const STATI_ASSET = [
  { id: 'nuovo', label: 'Nuovo', color: 'bg-green-100 text-green-800' },
  { id: 'buono', label: 'Buono', color: 'bg-blue-100 text-blue-800' },
  { id: 'usato', label: 'Usato', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'da_sostituire', label: 'Da Sostituire', color: 'bg-orange-100 text-orange-800' },
  { id: 'dismesso', label: 'Dismesso', color: 'bg-gray-100 text-gray-800' },
] as const

// ============================================
// DOCUMENTI
// ============================================

export const CATEGORIE_DOCUMENTO = [
  { id: 'identita', label: 'Identità', icon: '🪪' },
  { id: 'fiscale', label: 'Fiscale', icon: '📊' },
  { id: 'proprieta', label: 'Proprietà', icon: '🏠' },
  { id: 'certificazioni', label: 'Certificazioni', icon: '✅' },
  { id: 'contratti', label: 'Contratti', icon: '📝' },
  { id: 'procure', label: 'Procure', icon: '🔐' },
  { id: 'legale', label: 'Legale', icon: '⚖️' },
  { id: 'operativo', label: 'Operativo', icon: '⚙️' },
  { id: 'marketing', label: 'Marketing', icon: '📸' },
] as const

export const STATI_DOCUMENTO = [
  { id: 'mancante', label: 'Mancante', color: 'bg-gray-100 text-gray-500' },
  { id: 'richiesto', label: 'Richiesto', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'ricevuto', label: 'Ricevuto', color: 'bg-blue-100 text-blue-700' },
  { id: 'verificato', label: 'Verificato', color: 'bg-green-100 text-green-700' },
  { id: 'scaduto', label: 'Scaduto', color: 'bg-red-100 text-red-700' },
] as const

// ============================================
// TASK
// ============================================

export const STATI_TASK = [
  { id: 'da_fare', label: 'Da Fare', color: 'bg-gray-100 text-gray-700' },
  { id: 'in_corso', label: 'In Corso', color: 'bg-blue-100 text-blue-700' },
  { id: 'completato', label: 'Completato', color: 'bg-green-100 text-green-700' },
  { id: 'bloccato', label: 'Bloccato', color: 'bg-red-100 text-red-700' },
  { id: 'annullato', label: 'Annullato', color: 'bg-gray-100 text-gray-500' },
] as const

export const PRIORITA_TASK = [
  { id: 'bassa', label: 'Bassa', color: 'bg-gray-100 text-gray-600' },
  { id: 'media', label: 'Media', color: 'bg-blue-100 text-blue-600' },
  { id: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  { id: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-600' },
] as const

export const CATEGORIE_TASK = [
  { id: 'documenti', label: 'Documenti', icon: '📄' },
  { id: 'pratiche', label: 'Pratiche', icon: '📋' },
  { id: 'comunicazioni', label: 'Comunicazioni', icon: '💬' },
  { id: 'setup', label: 'Setup', icon: '⚙️' },
  { id: 'verifica', label: 'Verifica', icon: '✅' },
  { id: 'altro', label: 'Altro', icon: '📌' },
] as const

// ============================================
// PRENOTAZIONI
// ============================================

export const STATI_PRENOTAZIONE = [
  { id: 'richiesta', label: 'Richiesta', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'confermata', label: 'Confermata', color: 'bg-green-100 text-green-700' },
  { id: 'checkin', label: 'Check-in', color: 'bg-blue-100 text-blue-700' },
  { id: 'checkout', label: 'Check-out', color: 'bg-purple-100 text-purple-700' },
  { id: 'cancellata', label: 'Cancellata', color: 'bg-red-100 text-red-700' },
  { id: 'no_show', label: 'No Show', color: 'bg-gray-100 text-gray-700' },
] as const

export const CANALI_PRENOTAZIONE = [
  { id: 'airbnb', label: 'Airbnb', color: '#FF5A5F' },
  { id: 'booking', label: 'Booking.com', color: '#003580' },
  { id: 'vrbo', label: 'Vrbo', color: '#3B5998' },
  { id: 'direct', label: 'Diretto', color: '#22C55E' },
  { id: 'altro', label: 'Altro', color: '#6B7280' },
] as const

// ============================================
// SERVIZI
// ============================================

export const TIPI_SERVIZIO = [
  { id: 'one_shot', label: 'Una Tantum' },
  { id: 'ricorrente', label: 'Ricorrente' },
] as const

export const TIPI_PREZZO = [
  { id: 'fisso', label: 'Fisso (€)' },
  { id: 'percentuale', label: 'Percentuale (%)' },
  { id: 'da_quotare', label: 'Da Quotare' },
] as const

export const STATI_SERVIZIO_VENDUTO = [
  { id: 'da_iniziare', label: 'Da Iniziare', color: 'bg-gray-100 text-gray-700' },
  { id: 'in_corso', label: 'In Corso', color: 'bg-blue-100 text-blue-700' },
  { id: 'completato', label: 'Completato', color: 'bg-green-100 text-green-700' },
  { id: 'annullato', label: 'Annullato', color: 'bg-red-100 text-red-700' },
] as const

// ============================================
// PROVINCE ZONA
// ============================================

export const PROVINCE_ZONA = [
  { id: 'SO', label: 'Sondrio' },
  { id: 'LC', label: 'Lecco' },
  { id: 'CO', label: 'Como' },
] as const

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getFaseLabel(fasi: readonly { id: string; label: string }[], id: string): string {
  return fasi.find(f => f.id === id)?.label || id
}

export function getFaseColor(fasi: readonly { id: string; color: string }[], id: string): string {
  return fasi.find(f => f.id === id)?.color || 'bg-gray-100'
}

export function getEsitoLabel(esiti: readonly { id: string; label: string }[], id: string): string {
  return esiti.find(e => e.id === id)?.label || id
}

export function getEsitoColor(esiti: readonly { id: string; color: string }[], id: string): string {
  return esiti.find(e => e.id === id)?.color || 'bg-gray-100 text-gray-700'
}

// ============================================
// DOCUMENT TEMPLATES
// ============================================

export const CATEGORIE_TEMPLATE = [
  { id: 'preventivo', label: 'Preventivo', icon: '💰', description: 'Preventivo servizi con prezzi' },
  { id: 'proposta', label: 'Proposta Commerciale', icon: '📋', description: 'Proposta commerciale completa' },
  { id: 'contratto', label: 'Contratto', icon: '📝', description: 'Contratto di gestione' },
  { id: 'privacy', label: 'Privacy', icon: '🔒', description: 'Informativa privacy GDPR' },
  { id: 'mandato', label: 'Mandato', icon: '🤝', description: 'Mandato di gestione' },
  { id: 'lettera', label: 'Lettera', icon: '✉️', description: 'Lettera generica' },
  { id: 'report', label: 'Report', icon: '📊', description: 'Report periodico' },
] as const

export const STATI_DOCUMENTO_GENERATO = [
  { id: 'generato', label: 'Generato', color: 'bg-gray-100 text-gray-700', icon: '📄' },
  { id: 'inviato', label: 'Inviato', color: 'bg-blue-100 text-blue-700', icon: '📤' },
  { id: 'visto', label: 'Visualizzato', color: 'bg-indigo-100 text-indigo-700', icon: '👁️' },
  { id: 'firmato', label: 'Firmato', color: 'bg-green-100 text-green-700', icon: '✅' },
  { id: 'archiviato', label: 'Archiviato', color: 'bg-purple-100 text-purple-700', icon: '📁' },
  { id: 'scaduto', label: 'Scaduto', color: 'bg-orange-100 text-orange-700', icon: '⏰' },
  { id: 'annullato', label: 'Annullato', color: 'bg-red-100 text-red-700', icon: '❌' },
] as const

export const METODI_FIRMA = [
  { id: 'manuale', label: 'Firma Manuale', description: 'Documento stampato e firmato a mano' },
  { id: 'digitale', label: 'Firma Digitale', description: 'Firma elettronica qualificata' },
  { id: 'otp', label: 'Firma OTP', description: 'Firma con codice OTP' },
] as const

export const FORMATI_PAGINA = [
  { id: 'A4', label: 'A4', width: 210, height: 297, dimensions: '210 x 297 mm' },
  { id: 'A5', label: 'A5', width: 148, height: 210, dimensions: '148 x 210 mm' },
  { id: 'Letter', label: 'Letter', width: 216, height: 279, dimensions: '8.5 x 11 in' },
] as const

export const ORIENTAMENTI_PAGINA = [
  { id: 'portrait', label: 'Verticale', icon: '📄' },
  { id: 'landscape', label: 'Orizzontale', icon: '📃' },
] as const

// ============================================
// BLOCCHI TEMPLATE EDITOR
// ============================================

export const BLOCCHI_TEMPLATE = [
  // Intestazioni
  {
    id: 'header',
    categoria: 'Intestazioni',
    icon: '🏢',
    label: 'Intestazione Azienda',
    description: 'Logo, nome azienda e contatti',
    configurabile: ['showLogo', 'showAddress', 'showContacts', 'showPiva']
  },
  // Dati Automatici
  {
    id: 'cliente',
    categoria: 'Dati Automatici',
    icon: '👤',
    label: 'Dati Cliente',
    description: 'Anagrafica completa del cliente',
    configurabile: ['showAddress', 'showContacts', 'showCf', 'showPiva']
  },
  {
    id: 'proprieta',
    categoria: 'Dati Automatici',
    icon: '🏠',
    label: 'Dati Proprietà',
    description: 'Informazioni sulla proprietà',
    configurabile: ['showAddress', 'showDetails', 'showCodes']
  },
  // Contenuti
  {
    id: 'serviziTabella',
    categoria: 'Contenuti',
    icon: '📊',
    label: 'Tabella Servizi',
    description: 'Lista servizi con prezzi e totali',
    configurabile: ['showDescription', 'showQuantity']
  },
  {
    id: 'totali',
    categoria: 'Contenuti',
    icon: '💰',
    label: 'Riepilogo Totali',
    description: 'Subtotale, IVA e totale',
    configurabile: ['showSubtotale', 'showIva', 'showAcconto']
  },
  // Chiusura
  {
    id: 'validita',
    categoria: 'Chiusura',
    icon: '📅',
    label: 'Validità',
    description: 'Scadenza documento',
    configurabile: ['days']
  },
  {
    id: 'termini',
    categoria: 'Chiusura',
    icon: '📋',
    label: 'Termini e Condizioni',
    description: 'Clausole contrattuali standard',
    configurabile: ['customTerms']
  },
  {
    id: 'firme',
    categoria: 'Chiusura',
    icon: '✍️',
    label: 'Blocco Firme',
    description: 'Spazio per firme fornitore e cliente',
    configurabile: ['showDate', 'leftLabel', 'rightLabel']
  },
  // Utilità
  {
    id: 'note',
    categoria: 'Utilità',
    icon: '⚠️',
    label: 'Box Avviso',
    description: 'Riquadro evidenziato per note importanti',
    configurabile: ['style', 'icon']
  },
  {
    id: 'separatore',
    categoria: 'Utilità',
    icon: '➖',
    label: 'Separatore',
    description: 'Linea di separazione tra sezioni',
    configurabile: ['style']
  },
] as const

// ============================================
// VARIABILI TEMPLATE (per menzioni @)
// ============================================

export const VARIABILI_TEMPLATE = [
  // Date
  { id: 'oggi', label: 'Data di oggi', categoria: 'Date', esempio: '26 gennaio 2026' },
  { id: 'oggi_breve', label: 'Data di oggi (breve)', categoria: 'Date', esempio: '26/01/2026' },
  { id: 'anno', label: 'Anno corrente', categoria: 'Date', esempio: '2026' },

  // Documento
  { id: 'documento.numero', label: 'Numero documento', categoria: 'Documento', esempio: 'DOC-2026-001' },
  { id: 'documento.data', label: 'Data documento', categoria: 'Documento', esempio: '26 gennaio 2026' },
  { id: 'documento.scadenza', label: 'Scadenza documento', categoria: 'Documento', esempio: '25 febbraio 2026' },

  // Preventivo/Proposta
  { id: 'proposta.numero', label: 'Numero proposta', categoria: 'Proposta', esempio: 'PROP-2026-001' },
  { id: 'proposta.data', label: 'Data proposta', categoria: 'Proposta', esempio: '26 gennaio 2026' },
  { id: 'proposta.totale', label: 'Totale proposta', categoria: 'Proposta', esempio: '€ 1.220,00' },
  { id: 'proposta.subtotale', label: 'Subtotale', categoria: 'Proposta', esempio: '€ 1.000,00' },
  { id: 'proposta.sconto', label: 'Sconto applicato', categoria: 'Proposta', esempio: '€ 50,00' },

  // Azienda PM
  { id: 'azienda.nome', label: 'Nome azienda', categoria: 'Azienda', esempio: 'Property Manager Srl' },
  { id: 'azienda.indirizzo', label: 'Indirizzo azienda', categoria: 'Azienda', esempio: 'Via Roma 1, 20100 Milano' },
  { id: 'azienda.email', label: 'Email azienda', categoria: 'Azienda', esempio: 'info@pm.it' },
  { id: 'azienda.telefono', label: 'Telefono azienda', categoria: 'Azienda', esempio: '+39 02 1234567' },
  { id: 'azienda.piva', label: 'P.IVA azienda', categoria: 'Azienda', esempio: '12345678901' },
  { id: 'azienda.pec', label: 'PEC azienda', categoria: 'Azienda', esempio: 'pm@pec.it' },

  // Cliente
  { id: 'cliente.nome_completo', label: 'Nome cliente', categoria: 'Cliente', esempio: 'Mario Rossi' },
  { id: 'cliente.nome', label: 'Nome', categoria: 'Cliente', esempio: 'Mario' },
  { id: 'cliente.cognome', label: 'Cognome', categoria: 'Cliente', esempio: 'Rossi' },
  { id: 'cliente.email', label: 'Email cliente', categoria: 'Cliente', esempio: 'mario@example.com' },
  { id: 'cliente.telefono', label: 'Telefono cliente', categoria: 'Cliente', esempio: '+39 333 1234567' },
  { id: 'cliente.indirizzo', label: 'Indirizzo cliente', categoria: 'Cliente', esempio: 'Via Lago 5, 22017 Menaggio (CO)' },
  { id: 'cliente.cf', label: 'Codice Fiscale', categoria: 'Cliente', esempio: 'RSSMRA80A01F205X' },
  { id: 'cliente.piva', label: 'P.IVA cliente', categoria: 'Cliente', esempio: '12345678901' },

  // Proprietà
  { id: 'proprieta.nome', label: 'Nome proprietà', categoria: 'Proprietà', esempio: 'Villa Belvedere' },
  { id: 'proprieta.indirizzo', label: 'Indirizzo proprietà', categoria: 'Proprietà', esempio: 'Via Lago 5, 22017 Menaggio (CO)' },
  { id: 'proprieta.tipologia', label: 'Tipologia', categoria: 'Proprietà', esempio: 'Villa' },
  { id: 'proprieta.mq', label: 'Metri quadri', categoria: 'Proprietà', esempio: '150' },
  { id: 'proprieta.camere', label: 'Numero camere', categoria: 'Proprietà', esempio: '3' },
  { id: 'proprieta.bagni', label: 'Numero bagni', categoria: 'Proprietà', esempio: '2' },
  { id: 'proprieta.max_ospiti', label: 'Max ospiti', categoria: 'Proprietà', esempio: '6' },
  { id: 'proprieta.cir', label: 'Codice CIR', categoria: 'Proprietà', esempio: '013157-CNI-00123' },
  { id: 'proprieta.cin', label: 'Codice CIN', categoria: 'Proprietà', esempio: 'IT013157A1B2C3D4E5' },
  { id: 'proprieta.commissione', label: 'Commissione %', categoria: 'Proprietà', esempio: '20%' },
] as const

// Helper per ottenere blocchi per categoria
export function getBlocchiPerCategoria() {
  const grouped: Record<string, typeof BLOCCHI_TEMPLATE[number][]> = {}
  BLOCCHI_TEMPLATE.forEach(blocco => {
    if (!grouped[blocco.categoria]) {
      grouped[blocco.categoria] = []
    }
    grouped[blocco.categoria].push(blocco)
  })
  return grouped
}

// Helper per ottenere variabili per categoria
export function getVariabiliPerCategoria() {
  const grouped: Record<string, typeof VARIABILI_TEMPLATE[number][]> = {}
  VARIABILI_TEMPLATE.forEach(variabile => {
    if (!grouped[variabile.categoria]) {
      grouped[variabile.categoria] = []
    }
    grouped[variabile.categoria].push(variabile)
  })
  return grouped
}
