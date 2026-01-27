'use client'

import { VARIABILI_TEMPLATE } from '@/constants'

interface PreviewVariableProps {
    id: string
    label: string
    categoria: string
}

// Map per accesso veloce alle variabili
const VARIABILI_MAP = VARIABILI_TEMPLATE.reduce((acc, v) => {
    acc[v.id] = v
    return acc
}, {} as Record<string, typeof VARIABILI_TEMPLATE[number]>)

export function PreviewVariable({ id, label }: PreviewVariableProps) {
    const variabile = VARIABILI_MAP[id]
    const esempio = variabile?.esempio || 'N/A'

    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-purple-50 border border-dashed border-purple-300 text-purple-700 rounded text-sm"
            title={`Variabile: ${id}`}
        >
            <span className="text-purple-400 text-xs">@</span>
            <span className="font-medium">{label}:</span>
            <span className="text-purple-600 italic">{esempio}</span>
        </span>
    )
}
