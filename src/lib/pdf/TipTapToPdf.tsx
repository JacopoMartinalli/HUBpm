import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
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

// Stili PDF
const getStyles = (primaryColor?: string | null) => StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: '#374151', // text-gray-700
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: primaryColor || '#e5e7eb',
    paddingBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    fontSize: 8,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  // Tipografia
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: primaryColor || '#111827',
  },
  h2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: primaryColor || '#1f2937',
  },
  h3: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: primaryColor || '#374151',
  },
  paragraph: {
    marginBottom: 10,
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
    marginBottom: 10,
    paddingLeft: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listBullet: {
    width: 12,
    color: primaryColor || '#374151',
  },
  listContent: {
    flex: 1,
  },
  // Tabelle
  table: {
    marginBottom: 16,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowHeader: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 2,
    borderBottomColor: primaryColor || '#e5e7eb',
  },
  tableCell: {
    padding: 8,
    flex: 1,
  },
  tableCellHeader: {
    fontWeight: 'bold',
    color: primaryColor || '#111827',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  // HR
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: primaryColor || '#d1d5db',
    marginVertical: 15,
  },
  // Blocco citazione
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: primaryColor || '#d1d5db',
    paddingLeft: 12,
    marginLeft: 0,
    marginBottom: 12,
    fontStyle: 'italic',
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
  },
  // Variabili non risolte
  variablePlaceholder: {
    color: '#b45309',
    backgroundColor: '#fef3c7',
  },
  // Totali
  totalsBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 10,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: primaryColor || '#111827',
    paddingTop: 10,
    marginTop: 6,
    fontSize: 12,
  },
  // Immagini
  image: {
    marginVertical: 15,
    borderRadius: 4,
  },
})

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
  styles,
}: {
  node: TipTapNode
  context: TemplateContext
  styles: any
}): React.ReactElement | null {
  switch (node.type) {
    case 'doc':
      return (
        <View>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styles={styles} />
          ))}
        </View>
      )

    case 'paragraph': {
      const textAlign = node.attrs?.textAlign as string
      const alignStyle = textAlign === 'center' ? styles.textCenter : textAlign === 'right' ? styles.textRight : {}

      if (!node.content || node.content.length === 0) {
        return <View style={{ height: 10 }} />
      }

      return (
        <Text style={[styles.paragraph, alignStyle]}>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styles={styles} />
          ))}
        </Text>
      )
    }

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const textAlign = node.attrs?.textAlign as string
      const alignStyle = textAlign === 'center' ? styles.textCenter : textAlign === 'right' ? styles.textRight : {}
      const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3

      return (
        <Text style={[headingStyle, alignStyle]}>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styles={styles} />
          ))}
        </Text>
      )
    }

    case 'text':
      return <>{renderTextWithMarks(node.text || '', node.marks)}</>

    case 'bulletList':
      return (
        <View style={styles.list}>
          {node.content?.map((child, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <View style={styles.listContent}>
                <RenderPdfNode node={child} context={context} />
              </View>
            </View>
          ))}
        </View>
      )

    case 'orderedList':
      return (
        <View style={styles.list}>
          {node.content?.map((child, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>{i + 1}.</Text>
              <View style={styles.listContent}>
                <RenderPdfNode node={child} context={context} />
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
                <RenderPdfNode key={`${i}-${j}`} node={c} context={context} styles={styles} />
              ))
            }
            return <RenderPdfNode key={i} node={child} context={context} styles={styles} />
          })}
        </Text>
      )

    case 'blockquote':
      return (
        <View style={styles.blockquote}>
          {node.content?.map((child, i) => (
            <RenderPdfNode key={i} node={child} context={context} styles={styles} />
          ))}
        </View>
      )

    case 'horizontalRule':
      return <View style={styles.hr} />

    case 'hardBreak':
      return <Text>{'\n'}</Text>

    case 'image': {
      const src = node.attrs?.src as string
      if (!src) return null
      return <Image src={src} style={styles.image} />
    }

    // Variabili dinamiche
    case 'variableMention': {
      const varId = node.attrs?.id as string
      const label = node.attrs?.label as string
      const resolved = resolveVariable(varId, context)

      if (resolved) {
        return <Text>{resolved}</Text>
      }
      // Placeholder se non risolto
      return <Text style={styles.variablePlaceholder}>[{label}]</Text>
    }

    // Blocchi dinamici
    case 'dynamicBlock': {
      const blockType = node.attrs?.blockType as string
      const data = resolveBlockData(blockType, context)

      switch (blockType) {
        case 'serviziTabella': {
          const items = (data.items as Array<{
            nome: string
            descrizione?: string | null
            quantita: number
            prezzo_unitario: number
            prezzo_totale: number
          }>) || []

          if (items.length === 0) {
            return <Text style={{ color: '#9ca3af', marginBottom: 8 }}>[Nessun servizio]</Text>
          }

          return (
            <View style={styles.table}>
              {/* Header */}
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={[styles.tableCell, styles.tableCellHeader, { flex: 3 }]}>
                  <Text>Servizio</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>
                  <Text>Qtà</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellHeader, { flex: 1.5 }]}>
                  <Text>Prezzo</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellHeader, styles.tableCellLast, { flex: 1.5 }]}>
                  <Text>Totale</Text>
                </View>
              </View>
              {/* Rows */}
              {items.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 3 }]}>
                    <Text style={styles.bold}>{item.nome}</Text>
                    {item.descrizione && (
                      <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
                        {item.descrizione}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.tableCell, { flex: 1 }]}>
                    <Text>{item.quantita}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 1.5 }]}>
                    <Text>{formatCurrency(item.prezzo_unitario)}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellLast, { flex: 1.5 }]}>
                    <Text>{formatCurrency(item.prezzo_totale)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )
        }

        case 'totali': {
          const subtotale = data.subtotale as string
          const sconto = data.sconto as string
          const totale = data.totale as string

          return (
            <View style={styles.totalsBox}>
              {subtotale && (
                <View style={styles.totalRow}>
                  <Text>Subtotale:</Text>
                  <Text>{subtotale}</Text>
                </View>
              )}
              {sconto && sconto !== '€ 0,00' && (
                <View style={styles.totalRow}>
                  <Text>Sconto:</Text>
                  <Text>-{sconto}</Text>
                </View>
              )}
              <View style={styles.totalRowFinal}>
                <Text style={styles.bold}>TOTALE:</Text>
                <Text style={styles.bold}>{totale || '—'}</Text>
              </View>
            </View>
          )
        }

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
              <RenderPdfNode key={i} node={child} context={context} styles={styles} />
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
  const styles = getStyles(context.azienda?.colore_primario)

  // Header/footer da azienda o default
  const headerContent = showHeaderFooter
    ? (context.azienda?.intestazione_json as Record<string, unknown>) || getDefaultIntestazione()
    : null
  const footerContent = showHeaderFooter
    ? (context.azienda?.pie_pagina_json as Record<string, unknown>) || getDefaultPiePagina()
    : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {headerContent && (
          <View style={styles.header} fixed>
            {context.azienda?.logo_url && (
              <Image src={context.azienda.logo_url} style={{ width: 100, marginBottom: 10 }} />
            )}
            <RenderPdfNode
              node={headerContent as unknown as TipTapNode}
              context={context}
              styles={styles}
            />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <RenderPdfNode
            node={content as unknown as TipTapNode}
            context={context}
            styles={styles}
          />
        </View>

        {/* Footer */}
        {footerContent && (
          <View style={styles.footer} fixed>
            <RenderPdfNode
              node={footerContent as unknown as TipTapNode}
              context={context}
              styles={styles}
            />
          </View>
        )}
      </Page>
    </Document>
  )
}

export default PdfDocument
