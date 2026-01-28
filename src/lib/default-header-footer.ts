// Default intestazione e piè di pagina per documenti PDF A4
// Usano variableMention per risolvere automaticamente i dati aziendali

function v(id: string, label: string, categoria: string) {
  return { type: 'variableMention', attrs: { id, label, categoria } }
}

export function getDefaultIntestazione(): Record<string, unknown> {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2, textAlign: 'center' },
        content: [v('azienda.nome', 'Nome azienda', 'Azienda')],
      },
      {
        type: 'paragraph',
        attrs: { textAlign: 'center' },
        content: [
          v('azienda.indirizzo', 'Indirizzo azienda', 'Azienda'),
        ],
      },
      {
        type: 'paragraph',
        attrs: { textAlign: 'center' },
        content: [
          v('azienda.telefono', 'Telefono azienda', 'Azienda'),
          { type: 'text', text: '  |  ' },
          v('azienda.email', 'Email azienda', 'Azienda'),
        ],
      },
      { type: 'horizontalRule' },
    ],
  }
}

export function getDefaultPiePagina(): Record<string, unknown> {
  return {
    type: 'doc',
    content: [
      { type: 'horizontalRule' },
      {
        type: 'paragraph',
        attrs: { textAlign: 'center' },
        content: [
          {
            type: 'variableMention',
            attrs: { id: 'azienda.nome', label: 'Nome azienda', categoria: 'Azienda' },
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: { textAlign: 'center' },
        content: [
          v('azienda.indirizzo', 'Indirizzo azienda', 'Azienda'),
        ],
      },
      {
        type: 'paragraph',
        attrs: { textAlign: 'center' },
        content: [
          v('azienda.telefono', 'Telefono azienda', 'Azienda'),
          { type: 'text', text: '  |  ' },
          v('azienda.email', 'Email azienda', 'Azienda'),
          { type: 'text', text: '  |  P.IVA ' },
          v('azienda.piva', 'P.IVA azienda', 'Azienda'),
        ],
      },
    ],
  }
}
