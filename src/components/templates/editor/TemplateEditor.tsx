'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Plus,
  Type,
} from 'lucide-react'
import { DynamicBlock } from '@/lib/editor/extensions/dynamic-block'
import { VariableMention } from '@/lib/editor/extensions/variable-mention'
import { BLOCCHI_TEMPLATE } from '@/constants'
import { BlockInsertMenu } from './BlockInsertMenu'
import { VariableInsertMenu } from './VariableInsertMenu'

interface TemplateEditorProps {
  content?: Record<string, unknown>
  onChange?: (content: Record<string, unknown>) => void
  placeholder?: string
}

export function TemplateEditor({
  content,
  onChange,
  placeholder = 'Inizia a scrivere il tuo template... Usa @ per inserire variabili',
}: TemplateEditorProps) {
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      DynamicBlock,
      VariableMention,
    ],
    content: content || {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON())
      }
    },
    editorProps: {
      attributes: {
        class: 'template-editor-content prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  })

  const handleInsertBlock = useCallback(
    (blockType: string) => {
      if (!editor) return
      editor.chain().focus().insertDynamicBlock(blockType, {}).run()
      setShowBlockMenu(false)
    },
    [editor]
  )

  const openBlockMenu = useCallback(() => {
    if (!editor) return

    // Get cursor position for menu placement
    const { view } = editor
    const { from } = view.state.selection
    const coords = view.coordsAtPos(from)

    setBlockMenuPosition({
      x: coords.left,
      y: coords.bottom + 8,
    })
    setShowBlockMenu(true)
  }, [editor])

  if (!editor) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="template-editor border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <EditorToolbar editor={editor} onInsertBlock={openBlockMenu} />

      {/* Content */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* Block Insert Menu */}
      {showBlockMenu && (
        <BlockInsertMenu
          position={blockMenuPosition}
          onSelect={handleInsertBlock}
          onClose={() => setShowBlockMenu(false)}
        />
      )}
    </div>
  )
}

// ============================================
// TOOLBAR
// ============================================

interface EditorToolbarProps {
  editor: Editor
  onInsertBlock: () => void
}

function EditorToolbar({ editor, onInsertBlock }: EditorToolbarProps) {
  return (
    <div className="border-b bg-gray-50 p-2 flex flex-wrap items-center gap-1">
      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 mr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annulla"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Ripeti"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text formatting */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Grassetto"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Corsivo"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Sottolineato"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Barrato"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Headings */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          title="Paragrafo"
        >
          <Type className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Titolo 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Titolo 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Titolo 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Allinea a sinistra"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Centra"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Allinea a destra"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Giustifica"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Elenco puntato"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Elenco numerato"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Insert Block */}
      <ToolbarButton
        onClick={onInsertBlock}
        title="Inserisci blocco dinamico"
        className="bg-blue-500 text-white hover:bg-blue-600"
      >
        <Plus className="w-4 h-4" />
        <span className="ml-1 text-sm">Blocco</span>
      </ToolbarButton>

      {/* Insert Variable */}
      <VariableInsertMenu editor={editor} />
    </div>
  )
}

// ============================================
// TOOLBAR BUTTON
// ============================================

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  className?: string
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
  className = '',
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded transition-colors flex items-center
        ${active ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
