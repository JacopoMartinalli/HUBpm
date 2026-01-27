'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { BLOCCHI_TEMPLATE } from '@/constants'

interface BlockInsertMenuProps {
  position: { x: number; y: number }
  onSelect: (blockType: string) => void
  onClose: () => void
}

export function BlockInsertMenu({ position, onSelect, onClose }: BlockInsertMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filtra blocchi
  const filteredBlocks = BLOCCHI_TEMPLATE.filter(
    (block) =>
      block.label.toLowerCase().includes(search.toLowerCase()) ||
      block.description.toLowerCase().includes(search.toLowerCase()) ||
      block.categoria.toLowerCase().includes(search.toLowerCase())
  )

  // Raggruppa per categoria
  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.categoria]) {
      acc[block.categoria] = []
    }
    acc[block.categoria].push(block)
    return acc
  }, {} as Record<string, typeof BLOCCHI_TEMPLATE[number][]>)

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredBlocks.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredBlocks[selectedIndex]) {
          onSelect(filteredBlocks[selectedIndex].id)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredBlocks, selectedIndex, onSelect])

  // Reset selection on search change
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Calculate position (adjust if near edges)
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 9999,
  }

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">Inserisci Blocco</span>
          <button
            onClick={onClose}
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
            placeholder="Cerca blocco..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      {/* Blocks list */}
      <div className="max-h-72 overflow-y-auto py-2">
        {Object.keys(groupedBlocks).length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">
            Nessun blocco trovato
          </div>
        ) : (
          Object.entries(groupedBlocks).map(([categoria, blocks]) => (
            <div key={categoria}>
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                {categoria}
              </div>
              {blocks.map((block) => {
                const globalIndex = filteredBlocks.findIndex(
                  (b) => b.id === block.id
                )
                const isSelected = globalIndex === selectedIndex

                return (
                  <button
                    key={block.id}
                    onClick={() => onSelect(block.id)}
                    className={`w-full px-4 py-2.5 text-left flex items-start gap-3 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {block.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {block.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {block.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex items-center gap-3">
        <span>
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">↑↓</kbd> naviga
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">↵</kbd> inserisci
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> chiudi
        </span>
      </div>
    </div>
  )
}
