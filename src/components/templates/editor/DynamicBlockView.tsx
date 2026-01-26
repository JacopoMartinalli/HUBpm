'use client'

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState } from 'react'
import { Settings, GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { BLOCCHI_TEMPLATE } from '@/constants'

type BlockType = typeof BLOCCHI_TEMPLATE[number]['id']

// Mappa blocchi per accesso rapido
const BLOCK_MAP = BLOCCHI_TEMPLATE.reduce((acc, block) => {
  acc[block.id] = block
  return acc
}, {} as Record<string, typeof BLOCCHI_TEMPLATE[number]>)

export function DynamicBlockView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [showConfig, setShowConfig] = useState(false)
  const blockType = node.attrs.blockType as BlockType
  const config = (node.attrs.config || {}) as Record<string, unknown>
  const blockInfo = BLOCK_MAP[blockType]

  if (!blockInfo) {
    return (
      <NodeViewWrapper className="my-3">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          Blocco non riconosciuto: {blockType}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="my-3">
      <div
        className={`group relative border-2 border-dashed rounded-xl transition-all ${
          selected
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30'
        }`}
      >
        {/* Drag handle */}
        <div
          className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1"
          data-drag-handle
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{blockInfo.icon}</span>
              <div>
                <div className="font-medium text-gray-900">{blockInfo.label}</div>
                <div className="text-sm text-gray-500">{blockInfo.description}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {blockInfo.configurabile.length > 0 && (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className={`p-2 rounded-lg transition-colors ${
                    showConfig ? 'bg-blue-100 text-blue-600' : 'hover:bg-white text-gray-500'
                  }`}
                  title="Configura"
                >
                  {showConfig ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={deleteNode}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                title="Rimuovi blocco"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Config panel */}
          {showConfig && (
            <BlockConfigPanel
              blockType={blockType}
              config={config}
              onChange={(newConfig) => updateAttributes({ config: newConfig })}
            />
          )}
        </div>

        {/* Auto badge */}
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">
          Auto
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// Pannello configurazione blocco
interface BlockConfigPanelProps {
  blockType: BlockType
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

function BlockConfigPanel({ blockType, config, onChange }: BlockConfigPanelProps) {
  const updateConfig = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value })
  }

  // Configurazioni specifiche per tipo di blocco
  const renderConfig = () => {
    switch (blockType) {
      case 'header':
        return (
          <div className="grid grid-cols-2 gap-3">
            <CheckboxOption
              label="Mostra logo"
              checked={config.showLogo !== false}
              onChange={(v) => updateConfig('showLogo', v)}
            />
            <CheckboxOption
              label="Mostra indirizzo"
              checked={config.showAddress !== false}
              onChange={(v) => updateConfig('showAddress', v)}
            />
            <CheckboxOption
              label="Mostra contatti"
              checked={config.showContacts !== false}
              onChange={(v) => updateConfig('showContacts', v)}
            />
            <CheckboxOption
              label="Mostra P.IVA"
              checked={config.showPiva !== false}
              onChange={(v) => updateConfig('showPiva', v)}
            />
          </div>
        )

      case 'cliente':
        return (
          <div className="grid grid-cols-2 gap-3">
            <CheckboxOption
              label="Mostra indirizzo"
              checked={config.showAddress !== false}
              onChange={(v) => updateConfig('showAddress', v)}
            />
            <CheckboxOption
              label="Mostra contatti"
              checked={config.showContacts !== false}
              onChange={(v) => updateConfig('showContacts', v)}
            />
            <CheckboxOption
              label="Mostra C.F."
              checked={config.showCf === true}
              onChange={(v) => updateConfig('showCf', v)}
            />
            <CheckboxOption
              label="Mostra P.IVA"
              checked={config.showPiva === true}
              onChange={(v) => updateConfig('showPiva', v)}
            />
          </div>
        )

      case 'proprieta':
        return (
          <div className="grid grid-cols-2 gap-3">
            <CheckboxOption
              label="Mostra indirizzo"
              checked={config.showAddress !== false}
              onChange={(v) => updateConfig('showAddress', v)}
            />
            <CheckboxOption
              label="Mostra dettagli (mq, camere...)"
              checked={config.showDetails !== false}
              onChange={(v) => updateConfig('showDetails', v)}
            />
            <CheckboxOption
              label="Mostra codici (CIR, CIN)"
              checked={config.showCodes === true}
              onChange={(v) => updateConfig('showCodes', v)}
            />
          </div>
        )

      case 'serviziTabella':
        return (
          <div className="grid grid-cols-2 gap-3">
            <CheckboxOption
              label="Mostra descrizione"
              checked={config.showDescription !== false}
              onChange={(v) => updateConfig('showDescription', v)}
            />
            <CheckboxOption
              label="Mostra quantita"
              checked={config.showQuantity !== false}
              onChange={(v) => updateConfig('showQuantity', v)}
            />
          </div>
        )

      case 'totali':
        return (
          <div className="grid grid-cols-2 gap-3">
            <CheckboxOption
              label="Mostra subtotale"
              checked={config.showSubtotale !== false}
              onChange={(v) => updateConfig('showSubtotale', v)}
            />
            <CheckboxOption
              label="Mostra IVA"
              checked={config.showIva !== false}
              onChange={(v) => updateConfig('showIva', v)}
            />
            <CheckboxOption
              label="Mostra acconto"
              checked={config.showAcconto === true}
              onChange={(v) => updateConfig('showAcconto', v)}
            />
          </div>
        )

      case 'validita':
        return (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giorni di validita</label>
            <input
              type="number"
              value={(config.days as number) || 30}
              onChange={(e) => updateConfig('days', parseInt(e.target.value) || 30)}
              className="w-24 px-3 py-1.5 border rounded-lg text-sm"
              min="1"
              max="365"
            />
          </div>
        )

      case 'firme':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Etichetta sinistra</label>
                <input
                  type="text"
                  value={(config.leftLabel as string) || 'Il Fornitore'}
                  onChange={(e) => updateConfig('leftLabel', e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Etichetta destra</label>
                <input
                  type="text"
                  value={(config.rightLabel as string) || 'Il Cliente'}
                  onChange={(e) => updateConfig('rightLabel', e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                />
              </div>
            </div>
            <CheckboxOption
              label="Mostra campo data"
              checked={config.showDate !== false}
              onChange={(v) => updateConfig('showDate', v)}
            />
          </div>
        )

      case 'note':
        return (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Stile</label>
            <select
              value={(config.style as string) || 'warning'}
              onChange={(e) => updateConfig('style', e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="warning">Avviso (giallo)</option>
              <option value="info">Info (blu)</option>
              <option value="success">Conferma (verde)</option>
              <option value="error">Errore (rosso)</option>
            </select>
          </div>
        )

      case 'termini':
        return (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Termini personalizzati (opzionale)</label>
            <textarea
              value={(config.customTerms as string) || ''}
              onChange={(e) => updateConfig('customTerms', e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg text-sm h-24 resize-none"
              placeholder="Lascia vuoto per usare i termini standard..."
            />
          </div>
        )

      case 'separatore':
        return (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Stile linea</label>
            <select
              value={(config.style as string) || 'solid'}
              onChange={(e) => updateConfig('style', e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="solid">Continua</option>
              <option value="dashed">Tratteggiata</option>
              <option value="dotted">Puntinata</option>
              <option value="double">Doppia</option>
            </select>
          </div>
        )

      default:
        return (
          <p className="text-sm text-gray-500">Nessuna opzione disponibile</p>
        )
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        Configurazione
      </div>
      {renderConfig()}
    </div>
  )
}

// Componente checkbox riutilizzabile
function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
