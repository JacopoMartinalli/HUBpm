import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'
import type { Documento, Task } from '@/types/database'

// ============================================
// TIPI
// ============================================

export type TipoEntita = 'lead' | 'proprieta_lead' | 'cliente' | 'proprieta'

export interface VerificaFaseResult {
  puoAvanzare: boolean
  documentiMancanti: Documento[]
  documentiObbligatoriMancanti: Documento[]
  taskNonCompletati: Task[]
  messaggioErrore?: string
}

export interface CambioFaseResult {
  success: boolean
  nuovaFase: string
  taskGenerati: number
  documentiGenerati: number
  errore?: string
}

// ============================================
// COSTANTI FASI
// ============================================

// L0: Nuovo Lead, L1: Contattato, L2: In Valutazione, L3: Qualificato
const FASI_LEAD = ['L0', 'L1', 'L2', 'L3']
// PL0: Registrata, PL1: Info Raccolte, PL2: Sopralluogo, PL3: Valutata
const FASI_PROPRIETA_LEAD = ['PL0', 'PL1', 'PL2', 'PL3']
const FASI_CLIENTE = ['C0', 'C1', 'C2', 'C3']
const FASI_PROPRIETA = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5']

// Fasi che richiedono documenti obbligatori completati per avanzare (hard block)
const FASI_CON_BLOCCO_DOCUMENTI: Record<TipoEntita, string[]> = {
  lead: [], // Lead non ha blocchi documenti
  proprieta_lead: [], // Proprieta lead non ha blocchi documenti
  cliente: ['C0'], // C0 richiede documenti obbligatori per passare a C1
  proprieta: [], // P0 -> P1 libero, P1 -> P2 gestito da accettazione proposta
}

// Blocchi speciali per lead e proprieta_lead
interface BloccoSpeciale {
  tipo: 'soft' | 'hard'
  condizione: string
  messaggio: string
}

const BLOCCHI_SPECIALI: Record<TipoEntita, Record<string, BloccoSpeciale>> = {
  lead: {
    // L0 -> L1: Prima chiamata completata (soft block - puoi forzare)
    'L0': { tipo: 'soft', condizione: 'prima_chiamata', messaggio: 'Prima chiamata non ancora completata' },
    // L1 -> L2: Almeno 1 proprieta lead aggiunta (hard block)
    'L1': { tipo: 'hard', condizione: 'proprieta_lead', messaggio: 'Aggiungi almeno una proprietà lead per procedere' },
    // L2 -> L3: Almeno 1 proprieta in PL3 (Valutata) (hard block)
    'L2': { tipo: 'hard', condizione: 'proprieta_valutata', messaggio: 'Almeno una proprietà deve essere in fase Valutata (PL3)' },
  },
  proprieta_lead: {},
  cliente: {},
  proprieta: {},
}

// ============================================
// FUNZIONI DI VERIFICA
// ============================================

export interface VerificaFaseResultExtended extends VerificaFaseResult {
  tipoBlocco?: 'soft' | 'hard'
}

/**
 * Verifica se un'entità può avanzare alla fase successiva
 */
export async function verificaAvanzamentoFase(
  tipoEntita: TipoEntita,
  faseCorrente: string,
  entityId: string,
  contattoId?: string
): Promise<VerificaFaseResultExtended> {
  const result: VerificaFaseResultExtended = {
    puoAvanzare: true,
    documentiMancanti: [],
    documentiObbligatoriMancanti: [],
    taskNonCompletati: [],
  }

  // Verifica documenti obbligatori solo per fasi con blocco
  if (FASI_CON_BLOCCO_DOCUMENTI[tipoEntita].includes(faseCorrente)) {
    const documentiResult = await verificaDocumentiObbligatori(
      tipoEntita,
      faseCorrente,
      tipoEntita === 'cliente' ? entityId : undefined,
      tipoEntita === 'proprieta' ? entityId : undefined
    )

    result.documentiMancanti = documentiResult.documentiMancanti
    result.documentiObbligatoriMancanti = documentiResult.documentiObbligatoriMancanti

    if (documentiResult.documentiObbligatoriMancanti.length > 0) {
      result.puoAvanzare = false
      result.tipoBlocco = 'hard'
      result.messaggioErrore = `Documenti obbligatori mancanti: ${documentiResult.documentiObbligatoriMancanti.map(d => d.nome).join(', ')}`
      return result
    }
  }

  // Verifica blocchi speciali per lead
  const bloccoSpeciale = BLOCCHI_SPECIALI[tipoEntita]?.[faseCorrente]
  if (bloccoSpeciale) {
    const verificaBlocco = await verificaBloccoSpeciale(
      tipoEntita,
      faseCorrente,
      bloccoSpeciale,
      entityId
    )

    if (!verificaBlocco.superato) {
      result.puoAvanzare = false
      result.tipoBlocco = bloccoSpeciale.tipo
      result.messaggioErrore = bloccoSpeciale.messaggio
    }
  }

  return result
}

/**
 * Verifica i blocchi speciali per lead e proprieta_lead
 */
async function verificaBloccoSpeciale(
  tipoEntita: TipoEntita,
  fase: string,
  blocco: BloccoSpeciale,
  entityId: string
): Promise<{ superato: boolean }> {
  switch (blocco.condizione) {
    case 'prima_chiamata': {
      // Verifica se il task "Prima chiamata" o simile è completato
      const { data: tasks } = await supabase
        .from('task')
        .select('stato')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('contatto_id', entityId)
        .or('titolo.ilike.%prima chiamata%,titolo.ilike.%primo contatto%,titolo.ilike.%qualifica%')
        .eq('stato', 'completato')

      return { superato: (tasks?.length || 0) > 0 }
    }

    case 'proprieta_lead': {
      // Verifica se esiste almeno 1 proprieta_lead per questo lead
      const { data: proprieta } = await supabase
        .from('proprieta_lead')
        .select('id')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('contatto_id', entityId)
        .eq('esito', 'in_corso')
        .limit(1)

      return { superato: (proprieta?.length || 0) > 0 }
    }

    case 'proprieta_valutata': {
      // Verifica se almeno 1 proprieta è in fase PL3 (Valutata)
      const { data: proprieta } = await supabase
        .from('proprieta_lead')
        .select('fase')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('contatto_id', entityId)
        .eq('esito', 'in_corso')
        .eq('fase', 'PL3')
        .limit(1)

      return { superato: (proprieta?.length || 0) > 0 }
    }

    default:
      return { superato: true }
  }
}

/**
 * Verifica i documenti obbligatori per una fase
 */
async function verificaDocumentiObbligatori(
  tipoEntita: TipoEntita,
  fase: string,
  contattoId?: string,
  proprietaId?: string
): Promise<{ documentiMancanti: Documento[]; documentiObbligatoriMancanti: Documento[] }> {
  // Mappa tipo entità per template documenti
  const tipoEntitaTemplate = tipoEntita === 'lead' || tipoEntita === 'cliente' ? 'cliente' : 'proprieta'

  // Ottieni documenti esistenti
  let query = supabase
    .from('documenti')
    .select('*')
    .eq('tenant_id', DEFAULT_TENANT_ID)

  if (contattoId) {
    query = query.eq('contatto_id', contattoId)
  }
  if (proprietaId) {
    query = query.eq('proprieta_id', proprietaId)
  }

  const { data: documenti, error } = await query

  if (error) throw error

  // Filtra documenti non completati (mancante o richiesto)
  const documentiMancanti = (documenti || []).filter(
    (d) => d.stato === 'mancante' || d.stato === 'richiesto'
  )

  // Filtra solo quelli obbligatori
  const documentiObbligatoriMancanti = documentiMancanti.filter((d) => d.obbligatorio)

  return {
    documentiMancanti,
    documentiObbligatoriMancanti,
  }
}

// ============================================
// FUNZIONI DI CAMBIO FASE
// ============================================

/**
 * Esegue il cambio fase con generazione automatica di task e documenti
 */
export async function eseguiCambioFase(
  tipoEntita: TipoEntita,
  faseCorrente: string,
  nuovaFase: string,
  entityId: string,
  contattoId?: string,
  forzaCambio: boolean = false
): Promise<CambioFaseResult> {
  // Verifica se può avanzare (solo se non forzato e sta avanzando)
  const fasi = getFasiPerEntita(tipoEntita)
  const indiceCorrente = fasi.indexOf(faseCorrente)
  const indiceNuovo = fasi.indexOf(nuovaFase)
  const staAvanzando = indiceNuovo > indiceCorrente

  if (staAvanzando) {
    const verifica = await verificaAvanzamentoFase(tipoEntita, faseCorrente, entityId, contattoId)

    // Se non puo avanzare
    if (!verifica.puoAvanzare) {
      // Se e un hard block, non si puo forzare
      if (verifica.tipoBlocco === 'hard') {
        return {
          success: false,
          nuovaFase: faseCorrente,
          taskGenerati: 0,
          documentiGenerati: 0,
          errore: verifica.messaggioErrore,
        }
      }
      // Se e un soft block e non si vuole forzare, blocca
      if (verifica.tipoBlocco === 'soft' && !forzaCambio) {
        return {
          success: false,
          nuovaFase: faseCorrente,
          taskGenerati: 0,
          documentiGenerati: 0,
          errore: verifica.messaggioErrore,
        }
      }
      // Se e un soft block e si vuole forzare, procedi
    }
  }

  // Genera task per la nuova fase
  const taskGenerati = await generaTaskPerFase(tipoEntita, nuovaFase, entityId, contattoId)

  // Genera documenti per la nuova fase (solo per cliente e proprietà)
  let documentiGenerati = 0
  if (tipoEntita === 'cliente' || tipoEntita === 'proprieta') {
    documentiGenerati = await generaDocumentiPerFase(
      tipoEntita,
      nuovaFase,
      tipoEntita === 'cliente' ? entityId : undefined,
      tipoEntita === 'proprieta' ? entityId : undefined
    )
  }

  return {
    success: true,
    nuovaFase,
    taskGenerati,
    documentiGenerati,
  }
}

/**
 * Genera task da template per una fase
 * IMPORTANTE: Verifica se i task esistono già per evitare duplicati
 */
export async function generaTaskPerFase(
  tipoEntita: TipoEntita,
  fase: string,
  entityId: string,
  contattoId?: string
): Promise<number> {
  // Ottieni template per questa fase
  const { data: templates, error: templateError } = await supabase
    .from('template_task')
    .select('*')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('tipo_entita', tipoEntita)
    .eq('fase', fase)
    .eq('attivo', true)

  if (templateError) throw templateError
  if (!templates || templates.length === 0) return 0

  // Verifica se esistono già task per questa entità e fase
  let checkQuery = supabase
    .from('task')
    .select('template_id')
    .eq('tenant_id', DEFAULT_TENANT_ID)

  // Filtra per entità corretta
  if (tipoEntita === 'lead' || tipoEntita === 'cliente') {
    checkQuery = checkQuery.eq('contatto_id', entityId)
  } else if (tipoEntita === 'proprieta') {
    checkQuery = checkQuery.eq('proprieta_id', entityId)
  } else if (tipoEntita === 'proprieta_lead') {
    checkQuery = checkQuery.eq('proprieta_lead_id', entityId)
  }

  const { data: existingTasks } = await checkQuery
  const existingTemplateIds = new Set((existingTasks || []).map((t) => t.template_id))

  // Filtra template che non hanno già task
  const templatesNuovi = templates.filter((t) => !existingTemplateIds.has(t.id))

  if (templatesNuovi.length === 0) return 0

  const baseDate = new Date()

  // Prepara i task da inserire (solo quelli nuovi)
  const taskToInsert = templatesNuovi.map((template) => {
    const dataScadenza = template.giorni_deadline
      ? new Date(baseDate.getTime() + template.giorni_deadline * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      : null

    return {
      tenant_id: DEFAULT_TENANT_ID,
      template_id: template.id,
      contatto_id: tipoEntita === 'lead' || tipoEntita === 'cliente' ? entityId : contattoId || null,
      proprieta_id: tipoEntita === 'proprieta' ? entityId : null,
      proprieta_lead_id: tipoEntita === 'proprieta_lead' ? entityId : null,
      titolo: template.titolo,
      descrizione: template.descrizione,
      categoria: template.categoria,
      stato: 'da_fare' as const,
      priorita: 'media' as const,
      data_scadenza: dataScadenza,
    }
  })

  const { data, error } = await supabase.from('task').insert(taskToInsert).select()

  if (error) throw error
  return data?.length || 0
}

/**
 * Genera documenti da template per una fase
 */
async function generaDocumentiPerFase(
  tipoEntita: 'cliente' | 'proprieta',
  fase: string,
  contattoId?: string,
  proprietaId?: string
): Promise<number> {
  // Ottieni template per questa fase
  const { data: templates, error: templateError } = await supabase
    .from('template_documenti')
    .select('*')
    .eq('tenant_id', DEFAULT_TENANT_ID)
    .eq('tipo_entita', tipoEntita)
    .eq('fase', fase)

  if (templateError) throw templateError
  if (!templates || templates.length === 0) return 0

  // Verifica se esistono già documenti per questa fase
  let checkQuery = supabase
    .from('documenti')
    .select('template_id')
    .eq('tenant_id', DEFAULT_TENANT_ID)

  if (contattoId) {
    checkQuery = checkQuery.eq('contatto_id', contattoId)
  }
  if (proprietaId) {
    checkQuery = checkQuery.eq('proprieta_id', proprietaId)
  }

  const { data: existingDocs } = await checkQuery
  const existingTemplateIds = new Set((existingDocs || []).map((d) => d.template_id))

  // Filtra template che non hanno già documenti
  const templatesNuovi = templates.filter((t) => !existingTemplateIds.has(t.id))

  if (templatesNuovi.length === 0) return 0

  // Prepara i documenti da inserire
  const documentiToInsert = templatesNuovi.map((template) => ({
    tenant_id: DEFAULT_TENANT_ID,
    template_id: template.id,
    contatto_id: contattoId || null,
    proprieta_id: proprietaId || null,
    nome: template.nome,
    descrizione: template.descrizione,
    categoria: template.categoria,
    obbligatorio: template.obbligatorio,
    stato: 'mancante' as const,
  }))

  const { data, error } = await supabase.from('documenti').insert(documentiToInsert).select()

  if (error) throw error
  return data?.length || 0
}

// ============================================
// UTILITÀ
// ============================================

function getFasiPerEntita(tipoEntita: TipoEntita): string[] {
  switch (tipoEntita) {
    case 'lead':
      return FASI_LEAD
    case 'proprieta_lead':
      return FASI_PROPRIETA_LEAD
    case 'cliente':
      return FASI_CLIENTE
    case 'proprieta':
      return FASI_PROPRIETA
    default:
      return []
  }
}

/**
 * Ottiene la fase successiva
 */
export function getFaseSuccessiva(tipoEntita: TipoEntita, faseCorrente: string): string | null {
  const fasi = getFasiPerEntita(tipoEntita)
  const indiceCorrente = fasi.indexOf(faseCorrente)

  if (indiceCorrente === -1 || indiceCorrente >= fasi.length - 1) {
    return null
  }

  return fasi[indiceCorrente + 1]
}

/**
 * Ottiene la fase precedente
 */
export function getFasePrecedente(tipoEntita: TipoEntita, faseCorrente: string): string | null {
  const fasi = getFasiPerEntita(tipoEntita)
  const indiceCorrente = fasi.indexOf(faseCorrente)

  if (indiceCorrente <= 0) {
    return null
  }

  return fasi[indiceCorrente - 1]
}

/**
 * Verifica se una fase è l'ultima
 */
export function isUltimaFase(tipoEntita: TipoEntita, fase: string): boolean {
  const fasi = getFasiPerEntita(tipoEntita)
  return fasi.indexOf(fase) === fasi.length - 1
}

/**
 * Ottiene il progresso della fase come percentuale
 */
export function getProgressoFase(tipoEntita: TipoEntita, fase: string): number {
  const fasi = getFasiPerEntita(tipoEntita)
  const indice = fasi.indexOf(fase)

  if (indice === -1) return 0

  return Math.round(((indice + 1) / fasi.length) * 100)
}
