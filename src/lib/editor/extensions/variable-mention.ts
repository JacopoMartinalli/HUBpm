'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VariableMentionView } from '@/components/templates/editor/VariableMentionView'

export interface VariableMentionAttributes {
  id: string
  label: string
  categoria: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variableMention: {
      /**
       * Inserisce una variabile
       */
      insertVariable: (attributes: VariableMentionAttributes) => ReturnType
    }
  }
}

export const VariableMention = Node.create({
  name: 'variableMention',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-id'),
        renderHTML: attributes => ({
          'data-variable-id': attributes.id,
        }),
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-label'),
        renderHTML: attributes => ({
          'data-variable-label': attributes.label,
        }),
      },
      categoria: {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-categoria'),
        renderHTML: attributes => ({
          'data-variable-categoria': attributes.categoria,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-mention]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-variable-mention': '' },
        HTMLAttributes
      ),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableMentionView)
  },

  addCommands() {
    return {
      insertVariable:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },

  // Keyboard shortcut to insert @ and show suggestion
  addKeyboardShortcuts() {
    return {
      '@': () => {
        // Il suggerimento delle variabili verrà gestito dal componente React
        return false
      },
    }
  },
})
