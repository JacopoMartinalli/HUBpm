import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DynamicBlockView } from '@/components/templates/editor/DynamicBlockView'

export interface DynamicBlockAttributes {
  blockType: string
  config: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dynamicBlock: {
      /**
       * Inserisce un blocco dinamico
       */
      insertDynamicBlock: (blockType: string, config?: Record<string, unknown>) => ReturnType
      /**
       * Aggiorna la configurazione di un blocco
       */
      updateDynamicBlockConfig: (config: Record<string, unknown>) => ReturnType
    }
  }
}

export const DynamicBlock = Node.create({
  name: 'dynamicBlock',
  group: 'block',
  atom: true, // Non può essere editato direttamente
  draggable: true, // Può essere trascinato

  addAttributes() {
    return {
      blockType: {
        default: 'header',
        parseHTML: element => element.getAttribute('data-block-type'),
        renderHTML: attributes => ({
          'data-block-type': attributes.blockType,
        }),
      },
      config: {
        default: {},
        parseHTML: element => {
          const config = element.getAttribute('data-config')
          return config ? JSON.parse(config) : {}
        },
        renderHTML: attributes => ({
          'data-config': JSON.stringify(attributes.config),
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-dynamic-block]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-dynamic-block': '' },
        HTMLAttributes
      ),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DynamicBlockView)
  },

  addCommands() {
    return {
      insertDynamicBlock:
        (blockType, config = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { blockType, config },
          })
        },
      updateDynamicBlockConfig:
        (config) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { config })
        },
    }
  },
})
