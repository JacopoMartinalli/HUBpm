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

export function PreviewVariable({ id }: PreviewVariableProps) {
    const variabile = VARIABILI_MAP[id]
    const esempio = variabile?.esempio || 'N/A'

    // Render as inline text just like in the final PDF
    return <span>{esempio}</span>
}
