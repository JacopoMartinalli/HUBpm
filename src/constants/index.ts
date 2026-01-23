// ============================================
// FASI E PIPELINE
// ============================================

export const FASI_LEAD = [
  { id: 'L0', label: 'Primo Contatto', description: 'Registrazione dati e primo contatto', color: 'bg-gray-100', textColor: 'text-gray-700' },
  { id: 'L1', label: 'Qualifica in Corso', description: 'Incontro e valutazione interesse', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'L2', label: 'Lead Qualificato', description: 'In attesa qualifica proprieta', color: 'bg-indigo-100', textColor: 'text-indigo-700' },
  { id: 'L3', label: 'Pronto Conversione', description: 'Almeno 1 proprieta qualificata', color: 'bg-green-100', textColor: 'text-green-700' },
] as const

export const FASI_PROPRIETA_LEAD = [
  { id: 'PL0', label: 'Registrata', description: 'Dati base inseriti', color: 'bg-gray-100', textColor: 'text-gray-700' },
  { id: 'PL1', label: 'Raccolta Info', description: 'Foto e info struttura', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'PL2', label: 'Valutazione', description: 'Analisi potenziale e sopralluogo', color: 'bg-indigo-100', textColor: 'text-indigo-700' },
  { id: 'PL3', label: 'Proposta', description: 'Preparazione e presentazione proposta', color: 'bg-purple-100', textColor: 'text-purple-700' },
  { id: 'PL4', label: 'Qualificata', description: 'Proposta accettata', color: 'bg-green-100', textColor: 'text-green-700' },
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
