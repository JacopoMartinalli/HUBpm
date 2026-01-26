'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, AtSign } from 'lucide-react'
import { VARIABILI_TEMPLATE } from '@/constants'
import type { Editor } from '@tiptap/react'

interface VariableInsertMenuProps {
  editor: Editor
}

export function VariableInsertMenu({ editor }: VariableInsertMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Filtra variabili
  const filteredVariables = VARIABILI_TEMPLATE.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.categoria.toLowerCase().includes(search.toLowerCase())
  )

  // Raggruppa per categoria
  const groupedVariables = filteredVariables.reduce((acc, variable) => {
    if (!acc[variable.categoria]) {
      acc[variable.categoria] = []
    }
    acc[variable.categoria].push(variable)
    return acc
  }, {} as Record<string, typeof VARIABILI_TEMPLATE[number][]>)

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleInsertVariable = (variable: typeof VARIABILI_TEMPLATE[number]) => {
    editor
      .chain()
      .focus()
      .insertVariable({
        id: variable.id,
        label: variable.label,
        categoria: variable.categoria,
      })
      .run()

    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded transition-colors flex items-center ${
          isOpen ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-200 text-gray-700'
        }`}
        title="Inserisci variabile"
      >
        <AtSign className="w-4 h-4" />
        <span className="ml-1 text-sm">Variabile</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">Inserisci Variabile</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca variabile..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>

          {/* Variables list */}
          <div className="max-h-72 overflow-y-auto py-2">
            {Object.keys(groupedVariables).length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Nessuna variabile trovata
              </div>
            ) : (
              Object.entries(groupedVariables).map(([categoria, variables]) => (
                <div key={categoria}>
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    {categoria}
                  </div>
                  {variables.map((variable) => (
                    <button
                      key={variable.id}
                      onClick={() => handleInsertVariable(variable)}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors hover:bg-purple-50"
                    >
                      <span className="text-purple-500">@</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900">{variable.label}</div>
                        <div className="text-xs text-gray-500 truncate">{variable.id}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
            Clicca su una variabile per inserirla nel documento
          </div>
        </div>
      )}
    </div>
  )
}
