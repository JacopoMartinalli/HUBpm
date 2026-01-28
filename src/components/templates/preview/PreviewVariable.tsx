'use client'

import { VARIABILI_TEMPLATE } from '@/constants'

interface PreviewVariableProps {
    id: string
    label: string
    categoria: string
    resolvedValue?: string | null
}

// Map per accesso veloce alle variabili
const VARIABILI_MAP = VARIABILI_TEMPLATE.reduce((acc, v) => {
    acc[v.id] = v
    return acc
}, {} as Record<string, typeof VARIABILI_TEMPLATE[number]>)

export function PreviewVariable({ id, resolvedValue }: PreviewVariableProps) {
    const variabile = VARIABILI_MAP[id]

    // Use resolved value if available, otherwise fall back to example
    if (resolvedValue != null && resolvedValue !== '') {
        return <span>{resolvedValue}</span>
    }

    const esempio = variabile?.esempio || 'N/A'
    return <span className="text-amber-600">{esempio}</span>
}
