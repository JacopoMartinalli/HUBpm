import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { TemplateContext } from '@/lib/services/template-resolver'
import { resolveVariable, resolveBlockData } from '@/lib/services/template-resolver'
import { getDefaultIntestazione, getDefaultPiePagina } from '@/lib/default-header-footer'

// Registra font (opzionale, usa font di sistema)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
    { src: 'Helvetica-BoldOblique', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

// Stili PDF di base (dinamici vengono creati in createDynamicStyles)
const baseStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
  },
  content: {
    flex: 1,
  },
  // Tipografia base
  h1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  h2: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  h3: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 8,
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecoration: 'underline',
  },
  // Liste
  list: {
    marginBottom: 8,
    paddingLeft: 15,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  listBullet: {
    width: 15,
  },
  listContent: {
    flex: 1,
  },
  // Tabelle
  table: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCell: {
    padding: 6,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  tableCellHeader: {
    fontWeight: 'bold',
  },
  // HR
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginVertical: 12,
  },
  // Blocco citazione
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#d1d5db',
    paddingLeft: 10,
    marginLeft: 10,
    marginBottom: 8,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  // Variabili non risolte
  variablePlaceholder: {
    backgroundColor: '#fef3c7',
    padding: 2,
  },
  // Testo con colore primario (per header)
  textPrimary: {
    // colore applicato dinamicamente
  },
  // Testo con colore secondario
  textSecondary: {
    // colore applicato dinamicamente
  },
  // Totali
  totalsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 8,
    marginTop: 8,
  },
})

// Configurazione stili dinamici basati su azienda
interface StyleConfig {
  colorePrimario: string
  coloreSecondario: string
  fontTitoli: string
  fontCorpo: string
}

function getStyleConfig(context: TemplateContext): StyleConfig {
  return {
    colorePrimario: context.azienda?.colore_primario || '#1a1a1a',
    coloreSecondario: context.azienda?.colore_secondario || '#666666',
    fontTitoli: context.azienda?.font_titoli || 'Helvetica',
    fontCorpo: context.azienda?.font_corpo || 'Helvetica',
  }
}

// Tipi TipTap
interface TipTapNode {
  type: string
  content?: TipTapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

interface PdfDocumentProps {
  content: Record<string, unknown>
  context: TemplateContext
  showHeaderFooter?: boolean
}

// Renderizza testo con marks (bold, italic, etc.)
function renderTextWithMarks(
  text: string,
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
): React.ReactNode {
  if (!marks || marks.length === 0) {
    return <Text>{text}</Text>
  }

  const style: {
    fontWeight?: 'bold'
    fontStyle?: 'italic'
    textDecoration?: 'underline'
  } = {}
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        style.fontWeight = 'bold'
        break
      case 'italic':
        style.fontStyle = 'italic'
        break
      case 'underline':
        style.textDecoration = 'underline'
        break
    }
  }

  return <Text style={style}>{text}</Text>
}

// Renderizza un nodo TipTap → componente PDF
function RenderPdfNode({
  node,
  context,
  styleConfig,
  isHeaderFooter = false,
}: {
  node: TipTapNode
  context: TemplateContext
  styleConfig: StyleConfig
  isHeaderFooter?: boolean
}): React.ReactElement | null {
  switch (node.type) {
    case 'doc':
      return (
        <View>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
          ))}
        </View>
      )

    case 'paragraph': {
      const textAlign = node.attrs?.textAlign as string
      const alignStyle = textAlign === 'center' ? baseStyles.textCenter : textAlign === 'right' ? baseStyles.textRight : {}

      if (!node.content || node.content.length === 0) {
        return <View style={{ height: 10 }} />
      }

      // In header/footer usa colore secondario per paragrafi
      const colorStyle = isHeaderFooter ? { color: styleConfig.coloreSecondario } : {}

      return (
        <Text style={[baseStyles.paragraph, alignStyle, colorStyle]}>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
          ))}
        </Text>
      )
    }

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const textAlign = node.attrs?.textAlign as string
      const alignStyle = textAlign === 'center' ? baseStyles.textCenter : textAlign === 'right' ? baseStyles.textRight : {}
      const headingStyle = level === 1 ? baseStyles.h1 : level === 2 ? baseStyles.h2 : baseStyles.h3

      // In header/footer usa colore primario per titoli
      const colorStyle = isHeaderFooter ? { color: styleConfig.colorePrimario } : {}

      return (
        <Text style={[headingStyle, alignStyle, colorStyle]}>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
          ))}
        </Text>
      )
    }

    case 'text':
      return <>{renderTextWithMarks(node.text || '', node.marks)}</>

    case 'bulletList':
      return (
        <View style={baseStyles.list}>
          {node.content?.map((child, i) => (
            <View key={i} style={baseStyles.listItem}>
              <Text style={baseStyles.listBullet}>•</Text>
              <View style={baseStyles.listContent}>
                <RenderPdfNode node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
              </View>
            </View>
          ))}
        </View>
      )

    case 'orderedList':
      return (
        <View style={baseStyles.list}>
          {node.content?.map((child, i) => (
            <View key={i} style={baseStyles.listItem}>
              <Text style={baseStyles.listBullet}>{i + 1}.</Text>
              <View style={baseStyles.listContent}>
                <RenderPdfNode node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
              </View>
            </View>
          ))}
        </View>
      )

    case 'listItem':
      return (
        <Text>
          {node.content?.map((child, i) => {
            if (child.type === 'paragraph') {
              return child.content?.map((c, j) => (
                <RenderPdfNode key={`${i}-${j}`} node={c} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
              ))
            }
            return <RenderPdfNode key={i} node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
          })}
        </Text>
      )

    case 'blockquote':
      return (
        <View style={baseStyles.blockquote}>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
          ))}
        </View>
      )

    case 'horizontalRule':
      return <View style={[baseStyles.hr, isHeaderFooter ? { borderBottomColor: styleConfig.colorePrimario } : {}]} />

    case 'hardBreak':
      return <Text>{'\n'}</Text>

    // Variabili dinamiche
    case 'variableMention': {
      const varId = node.attrs?.id as string
      const label = node.attrs?.label as string
      const resolved = resolveVariable(varId, context)

      if (resolved) {
        // In header/footer, eredita il colore dal contesto
        return <Text>{resolved}</Text>
      }
      // Placeholder se non risolto
      return <Text style={baseStyles.variablePlaceholder}>[{label}]</Text>
    }

    // Blocchi dinamici
    case 'dynamicBlock': {
      const blockType = node.attrs?.blockType as string
      const config = (node.attrs?.config as Record<string, unknown>) || {}
      const data = resolveBlockData(blockType, context)

      switch (blockType) {
        case 'header': {
          // Header azienda (normalmente già nel documento header, ma se nel contenuto)
          const nome = (data.nome as string) || ''
          const indirizzo = (data.indirizzo as string) || ''
          const email = (data.email as string) || ''
          const telefono = (data.telefono as string) || ''
          const piva = (data.piva as string) || ''

          return (
            <View style={{ marginBottom: 16 }}>
              <Text style={[baseStyles.h2, { color: styleConfig.colorePrimario }]}>{nome}</Text>
              {config.showAddress !== false && indirizzo && (
                <Text style={{ color: styleConfig.coloreSecondario }}>{indirizzo}</Text>
              )}
              {config.showContacts !== false && (email || telefono) && (
                <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
                  {[email, telefono].filter(Boolean).join(' • ')}
                </Text>
              )}
              {config.showPiva !== false && piva && (
                <Text style={{ fontSize: 9, color: '#6b7280' }}>P.IVA {piva}</Text>
              )}
            </View>
          )
        }

        case 'cliente': {
          const nome = (data.nome as string) || ''
          const indirizzo = (data.indirizzo as string) || ''
          const email = (data.email as string) || ''
          const telefono = (data.telefono as string) || ''
          const cf = (data.cf as string) || ''
          const piva = (data.piva as string) || ''

          return (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>Destinatario:</Text>
              <Text style={baseStyles.bold}>{nome}</Text>
              {config.showAddress !== false && indirizzo && (
                <Text style={{ color: '#4b5563' }}>{indirizzo}</Text>
              )}
              {config.showContacts !== false && (email || telefono) && (
                <Text style={{ fontSize: 9, color: '#6b7280' }}>
                  {[email, telefono].filter(Boolean).join(' • ')}
                </Text>
              )}
              {config.showCf !== false && cf && (
                <Text style={{ fontSize: 9, color: '#6b7280' }}>C.F. {cf}</Text>
              )}
              {config.showPiva !== false && piva && (
                <Text style={{ fontSize: 9, color: '#6b7280' }}>P.IVA {piva}</Text>
              )}
            </View>
          )
        }

        case 'proprieta': {
          const nome = (data.nome as string) || ''
          const indirizzo = (data.indirizzo as string) || ''
          const mq = (data.mq as string) || ''
          const camere = (data.camere as string) || ''
          const bagni = (data.bagni as string) || ''
          const maxOspiti = (data.maxOspiti as string) || ''
          const cir = (data.cir as string) || ''
          const cin = (data.cin as string) || ''

          return (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>Proprietà:</Text>
              <Text style={baseStyles.bold}>{nome}</Text>
              {config.showAddress !== false && indirizzo && (
                <Text style={{ color: '#4b5563' }}>{indirizzo}</Text>
              )}
              {config.showDetails !== false && (mq || camere || bagni || maxOspiti) && (
                <Text style={{ fontSize: 9, color: '#6b7280' }}>
                  {[
                    mq ? `${mq} mq` : null,
                    camere ? `${camere} camere` : null,
                    bagni ? `${bagni} bagni` : null,
                    maxOspiti ? `Max ${maxOspiti} ospiti` : null,
                  ].filter(Boolean).join(' • ')}
                </Text>
              )}
              {config.showCodes !== false && (cir || cin) && (
                <Text style={{ fontSize: 9, color: '#6b7280' }}>
                  {[cir ? `CIR: ${cir}` : null, cin ? `CIN: ${cin}` : null].filter(Boolean).join(' • ')}
                </Text>
              )}
            </View>
          )
        }

        case 'serviziTabella': {
          const items = (data.items as Array<{
            nome: string
            descrizione?: string | null
            quantita: number
            prezzo_unitario: number
            prezzo_totale: number
            sconto_percentuale?: number
            note?: string | null
          }>) || []

          if (items.length === 0) {
            return <Text style={{ color: '#9ca3af', marginBottom: 8 }}>[Nessun servizio]</Text>
          }

          // Raggruppa items per sezione
          const serviziAvviamento = items.filter(
            item => !item.nome.toLowerCase().includes('lancio ota') &&
                   !item.nome.toLowerCase().includes('gestione online') &&
                   !item.nome.toLowerCase().includes('gestione completa') &&
                   item.prezzo_totale > 0
          )
          const lancioOTA = items.find(item => item.nome.toLowerCase().includes('lancio ota'))
          const gestione = items.find(
            item => item.nome.toLowerCase().includes('gestione online') ||
                   item.nome.toLowerCase().includes('gestione completa')
          )

          // Calcola prezzo listino originale
          const calcolaListino = (item: typeof items[0]) => {
            if (item.sconto_percentuale && item.sconto_percentuale > 0) {
              return Math.round(item.prezzo_totale / (1 - item.sconto_percentuale / 100))
            }
            return item.prezzo_totale
          }

          return (
            <View style={{ marginVertical: 12 }}>
              {/* Servizi Avviamento */}
              {serviziAvviamento.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>
                    Servizi Avviamento
                  </Text>
                  <View style={baseStyles.table}>
                    {/* Header */}
                    <View style={[baseStyles.tableRow, baseStyles.tableRowHeader]}>
                      <View style={[baseStyles.tableCell, baseStyles.tableCellHeader, { flex: 3 }]}>
                        <Text>Servizio</Text>
                      </View>
                      <View style={[baseStyles.tableCell, baseStyles.tableCellHeader, { flex: 1 }]}>
                        <Text>Listino</Text>
                      </View>
                      <View style={[baseStyles.tableCell, baseStyles.tableCellHeader, baseStyles.tableCellLast, { flex: 1 }]}>
                        <Text>Prezzo</Text>
                      </View>
                    </View>
                    {/* Rows */}
                    {serviziAvviamento.map((item, i) => {
                      const listino = calcolaListino(item)
                      const hasSconto = item.sconto_percentuale && item.sconto_percentuale > 0
                      return (
                        <View key={i} style={baseStyles.tableRow}>
                          <View style={[baseStyles.tableCell, { flex: 3 }]}>
                            <Text style={baseStyles.bold}>{item.nome}</Text>
                            {item.descrizione && (
                              <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
                                {item.descrizione}
                              </Text>
                            )}
                          </View>
                          <View style={[baseStyles.tableCell, { flex: 1 }]}>
                            <Text style={hasSconto ? { textDecoration: 'line-through', color: '#9ca3af' } : {}}>
                              {formatCurrency(listino)}
                            </Text>
                          </View>
                          <View style={[baseStyles.tableCell, baseStyles.tableCellLast, { flex: 1 }]}>
                            <Text style={[baseStyles.bold, hasSconto ? { color: '#16a34a' } : {}]}>
                              {formatCurrency(item.prezzo_totale)}
                              {hasSconto && ` (-${item.sconto_percentuale}%)`}
                            </Text>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* Pacchetto Lancio OTA */}
              {lancioOTA && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>
                    Pacchetto Lancio OTA
                  </Text>
                  <View style={{ padding: 12, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={baseStyles.bold}>{lancioOTA.nome}</Text>
                        {lancioOTA.descrizione && (
                          <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>{lancioOTA.descrizione}</Text>
                        )}
                        <Text style={{ fontSize: 8, color: '#15803d', marginTop: 4 }}>
                          Include: Annuncio Booking.com (€250) + Annuncio Airbnb (€250)
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ textDecoration: 'line-through', color: '#9ca3af' }}>€500</Text>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#16a34a' }}>
                          {formatCurrency(lancioOTA.prezzo_totale)}
                        </Text>
                        <Text style={{ fontSize: 8, color: '#16a34a' }}>-60%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Gestione */}
              {gestione && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>
                    Gestione
                  </Text>
                  <View style={{ padding: 12, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={baseStyles.bold}>{gestione.nome}</Text>
                        {gestione.descrizione && (
                          <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>{gestione.descrizione}</Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb' }}>30%</Text>
                        <Text style={{ fontSize: 8, color: '#6b7280' }}>sul fatturato</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )
        }

        case 'totali': {
          const subtotale = data.subtotale as string
          const sconto = data.sconto as string
          const totale = data.totale as string

          return (
            <View style={baseStyles.totalsBox}>
              {subtotale && (
                <View style={baseStyles.totalRow}>
                  <Text>Subtotale:</Text>
                  <Text>{subtotale}</Text>
                </View>
              )}
              {sconto && sconto !== '€ 0,00' && (
                <View style={baseStyles.totalRow}>
                  <Text>Sconto:</Text>
                  <Text>-{sconto}</Text>
                </View>
              )}
              <View style={baseStyles.totalRowFinal}>
                <Text style={baseStyles.bold}>TOTALE:</Text>
                <Text style={baseStyles.bold}>{totale || '—'}</Text>
              </View>
            </View>
          )
        }

        case 'validita': {
          const days = (config.days as number) || 30
          return (
            <Text style={{ marginVertical: 12, color: '#4b5563', fontStyle: 'italic' }}>
              Questa proposta è valida per {days} giorni dalla data di emissione.
            </Text>
          )
        }

        case 'termini':
          return (
            <View style={{ marginVertical: 12 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Termini e Condizioni:</Text>
              <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 4 }}>
                • I prezzi sono da intendersi IVA esclusa salvo ove diversamente specificato
              </Text>
              <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 4 }}>
                • Il pagamento deve essere effettuato entro 30 giorni dalla fatturazione
              </Text>
              <Text style={{ fontSize: 9, color: '#4b5563' }}>
                • Per i servizi ricorrenti la commissione viene calcolata sul fatturato lordo
              </Text>
            </View>
          )

        case 'firme': {
          const leftLabel = (config.leftLabel as string) || 'Il Fornitore'
          const rightLabel = (config.rightLabel as string) || 'Il Cliente'
          return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, marginBottom: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 120, height: 50, borderBottomWidth: 1, borderBottomColor: '#9ca3af' }} />
                <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>{leftLabel}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 120, height: 50, borderBottomWidth: 1, borderBottomColor: '#9ca3af' }} />
                <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>{rightLabel}</Text>
              </View>
            </View>
          )
        }

        case 'note': {
          const noteStyles: Record<string, { bg: string; border: string }> = {
            warning: { bg: '#fefce8', border: '#facc15' },
            info: { bg: '#eff6ff', border: '#3b82f6' },
            success: { bg: '#f0fdf4', border: '#22c55e' },
            error: { bg: '#fef2f2', border: '#ef4444' },
          }
          const style = (config.style as string) || 'info'
          const colors = noteStyles[style] || noteStyles.info
          return (
            <View style={{ marginVertical: 12, padding: 12, backgroundColor: colors.bg, borderLeftWidth: 4, borderLeftColor: colors.border }}>
              <Text style={{ color: '#374151' }}>Nota importante da compilare...</Text>
            </View>
          )
        }

        case 'separatore':
          return <View style={baseStyles.hr} />

        default:
          return null
      }
    }

    default:
      // Fallback per nodi sconosciuti con contenuto
      if (node.content) {
        return (
          <View>
            {node.content.map((child, i) => (
              <RenderPdfNode key={i} node={child} context={context} styleConfig={styleConfig} isHeaderFooter={isHeaderFooter} />
            ))}
          </View>
        )
      }
      return null
  }
}

// Helper per formattare valuta
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

// Componente principale documento PDF
export function PdfDocument({
  content,
  context,
  showHeaderFooter = true,
}: PdfDocumentProps): React.ReactElement {
  // Configurazione stili dinamici
  const styleConfig = getStyleConfig(context)

  // Header/footer da azienda o default
  const headerContent = showHeaderFooter
    ? (context.azienda?.intestazione_json as Record<string, unknown>) || getDefaultIntestazione()
    : null
  const footerContent = showHeaderFooter
    ? (context.azienda?.pie_pagina_json as Record<string, unknown>) || getDefaultPiePagina()
    : null

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        {headerContent && (
          <View style={baseStyles.header} fixed>
            <RenderPdfNode
              node={headerContent as unknown as TipTapNode}
              context={context}
              styleConfig={styleConfig}
              isHeaderFooter={true}
            />
          </View>
        )}

        {/* Content */}
        <View style={baseStyles.content}>
          <RenderPdfNode
            node={content as unknown as TipTapNode}
            context={context}
            styleConfig={styleConfig}
            isHeaderFooter={false}
          />
        </View>

        {/* Footer */}
        {footerContent && (
          <View style={baseStyles.footer} fixed>
            <RenderPdfNode
              node={footerContent as unknown as TipTapNode}
              context={context}
              styleConfig={styleConfig}
              isHeaderFooter={true}
            />
          </View>
        )}
      </Page>
    </Document>
  )
}

export default PdfDocument
