import type { PropertyManager, Contatto, Proprieta } from '@/types/database'
import { TIPOLOGIE_PROPRIETA } from '@/constants'
import { formatCurrency, formatPercent } from '@/lib/utils'

export interface PropostaItem {
  nome: string
  descrizione?: string | null
  quantita: number
  prezzo_unitario: number
  prezzo_totale: number
}

export interface TemplateContext {
  azienda?: PropertyManager | null
  cliente?: Contatto | null
  proprieta?: Proprieta | null
  proposta?: {
    numero?: string
    data?: string
    totale?: number
    subtotale?: number
    sconto?: number
    items?: PropostaItem[]
  } | null
  documento?: {
    numero?: string
    data?: string
    scadenza?: string
  } | null
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('it-IT')
  } catch {
    return dateStr
  }
}

/**
 * Risolve una variabile template con i dati reali dal contesto.
 * Ritorna il valore reale se disponibile, altrimenti null (usa esempio di fallback).
 */
export function resolveVariable(variableId: string, ctx: TemplateContext): string | null {
  const now = new Date()

  switch (variableId) {
    // Date
    case 'oggi':
      return now.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    case 'oggi_breve':
      return now.toLocaleDateString('it-IT')
    case 'anno':
      return String(now.getFullYear())

    // Documento
    case 'documento.numero':
      return ctx.documento?.numero || null
    case 'documento.data':
      return ctx.documento?.data ? formatDate(ctx.documento.data) : null
    case 'documento.scadenza':
      return ctx.documento?.scadenza ? formatDate(ctx.documento.scadenza) : null

    // Proposta
    case 'proposta.numero':
      return ctx.proposta?.numero || null
    case 'proposta.data':
      return ctx.proposta?.data ? formatDate(ctx.proposta.data) : null
    case 'proposta.totale':
      return ctx.proposta?.totale != null ? formatCurrency(ctx.proposta.totale) : null
    case 'proposta.subtotale':
      return ctx.proposta?.subtotale != null ? formatCurrency(ctx.proposta.subtotale) : null
    case 'proposta.sconto':
      return ctx.proposta?.sconto != null ? formatCurrency(ctx.proposta.sconto) : null

    // Azienda
    case 'azienda.nome':
      return ctx.azienda?.nome_commerciale || ctx.azienda?.ragione_sociale || null
    case 'azienda.indirizzo':
      if (!ctx.azienda?.indirizzo) return null
      return [ctx.azienda.indirizzo, ctx.azienda.cap, ctx.azienda.citta, ctx.azienda.provincia ? `(${ctx.azienda.provincia})` : null].filter(Boolean).join(', ')
    case 'azienda.email':
      return ctx.azienda?.email || null
    case 'azienda.telefono':
      return ctx.azienda?.telefono || ctx.azienda?.cellulare || null
    case 'azienda.piva':
      return ctx.azienda?.partita_iva || null
    case 'azienda.pec':
      return ctx.azienda?.pec || null

    // Cliente
    case 'cliente.nome_completo':
      if (!ctx.cliente) return null
      return `${ctx.cliente.nome || ''} ${ctx.cliente.cognome || ''}`.trim() || null
    case 'cliente.nome':
      return ctx.cliente?.nome || null
    case 'cliente.cognome':
      return ctx.cliente?.cognome || null
    case 'cliente.email':
      return ctx.cliente?.email || null
    case 'cliente.telefono':
      return ctx.cliente?.telefono || null
    case 'cliente.indirizzo':
      if (!ctx.cliente?.indirizzo) return null
      return [ctx.cliente.indirizzo, ctx.cliente.cap, ctx.cliente.citta, ctx.cliente.provincia ? `(${ctx.cliente.provincia})` : null].filter(Boolean).join(', ')
    case 'cliente.cf':
      return ctx.cliente?.codice_fiscale || null
    case 'cliente.piva':
      return ctx.cliente?.partita_iva || null

    // Proprietà
    case 'proprieta.nome':
      return ctx.proprieta?.nome || null
    case 'proprieta.indirizzo':
      if (!ctx.proprieta?.indirizzo) return null
      return [ctx.proprieta.indirizzo, ctx.proprieta.citta].filter(Boolean).join(', ')
    case 'proprieta.tipologia':
      if (!ctx.proprieta?.tipologia) return null
      return TIPOLOGIE_PROPRIETA.find(t => t.id === ctx.proprieta!.tipologia)?.label || ctx.proprieta.tipologia
    case 'proprieta.mq':
      return ctx.proprieta?.mq != null ? String(ctx.proprieta.mq) : null
    case 'proprieta.camere':
      return ctx.proprieta?.camere != null ? String(ctx.proprieta.camere) : null
    case 'proprieta.bagni':
      return ctx.proprieta?.bagni != null ? String(ctx.proprieta.bagni) : null
    case 'proprieta.max_ospiti':
      return ctx.proprieta?.max_ospiti != null ? String(ctx.proprieta.max_ospiti) : null
    case 'proprieta.cir':
      return ctx.proprieta?.cir || null
    case 'proprieta.cin':
      return ctx.proprieta?.cin || null
    case 'proprieta.commissione':
      return ctx.proprieta?.commissione_percentuale != null ? formatPercent(ctx.proprieta.commissione_percentuale) : null

    default:
      return null
  }
}

/**
 * Risolve i dati per un blocco dinamico con dati reali dal contesto.
 */
export function resolveBlockData(blockType: string, ctx: TemplateContext): Record<string, unknown> {
  switch (blockType) {
    case 'header':
      return {
        nome: ctx.azienda?.nome_commerciale || ctx.azienda?.ragione_sociale || '',
        indirizzo: ctx.azienda?.indirizzo ? [ctx.azienda.indirizzo, ctx.azienda.cap, ctx.azienda.citta].filter(Boolean).join(', ') : '',
        email: ctx.azienda?.email || '',
        telefono: ctx.azienda?.telefono || ctx.azienda?.cellulare || '',
        piva: ctx.azienda?.partita_iva || '',
        pec: ctx.azienda?.pec || '',
        logoUrl: ctx.azienda?.logo_url || '',
      }
    case 'cliente':
      return {
        nome: ctx.cliente ? `${ctx.cliente.nome || ''} ${ctx.cliente.cognome || ''}`.trim() : '',
        indirizzo: ctx.cliente?.indirizzo ? [ctx.cliente.indirizzo, ctx.cliente.cap, ctx.cliente.citta, ctx.cliente.provincia ? `(${ctx.cliente.provincia})` : null].filter(Boolean).join(', ') : '',
        email: ctx.cliente?.email || '',
        telefono: ctx.cliente?.telefono || '',
        cf: ctx.cliente?.codice_fiscale || '',
        piva: ctx.cliente?.partita_iva || '',
      }
    case 'proprieta':
      return {
        nome: ctx.proprieta?.nome || '',
        indirizzo: ctx.proprieta?.indirizzo ? [ctx.proprieta.indirizzo, ctx.proprieta.citta].filter(Boolean).join(', ') : '',
        tipologia: ctx.proprieta?.tipologia ? TIPOLOGIE_PROPRIETA.find(t => t.id === ctx.proprieta!.tipologia)?.label || '' : '',
        mq: ctx.proprieta?.mq || '',
        camere: ctx.proprieta?.camere || '',
        bagni: ctx.proprieta?.bagni || '',
        maxOspiti: ctx.proprieta?.max_ospiti || '',
        cir: ctx.proprieta?.cir || '',
        cin: ctx.proprieta?.cin || '',
      }
    case 'totali':
      return {
        subtotale: ctx.proposta?.subtotale != null ? formatCurrency(ctx.proposta.subtotale) : '',
        sconto: ctx.proposta?.sconto != null ? formatCurrency(ctx.proposta.sconto) : '',
        totale: ctx.proposta?.totale != null ? formatCurrency(ctx.proposta.totale) : '',
      }
    case 'serviziTabella':
      return {
        items: ctx.proposta?.items || [],
        hasItems: (ctx.proposta?.items?.length || 0) > 0,
      }
    default:
      return {}
  }
}
