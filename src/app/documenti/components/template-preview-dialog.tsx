'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TemplatePreview } from '@/components/templates/preview'
import { CATEGORIE_TEMPLATE, FORMATI_PAGINA, ORIENTAMENTI_PAGINA } from '@/constants'
import { usePropertyManager, useClienti, useProprietaList } from '@/lib/hooks'
import type { DocumentTemplate } from '@/types/database'
import type { TemplateContext } from '@/lib/services/template-resolver'
import { X, FileText, Database, User, Home } from 'lucide-react'

interface TemplatePreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    template: DocumentTemplate | null
}

export function TemplatePreviewDialog({
    open,
    onOpenChange,
    template,
}: TemplatePreviewDialogProps) {
    const [selectedClienteId, setSelectedClienteId] = useState<string>('')
    const [selectedProprietaId, setSelectedProprietaId] = useState<string>('')

    const { data: propertyManager } = usePropertyManager()
    const { data: clienti } = useClienti()
    const { data: proprieta } = useProprietaList()

    const selectedCliente = useMemo(
        () => clienti?.find((c) => c.id === selectedClienteId) || null,
        [clienti, selectedClienteId]
    )

    const selectedProprieta = useMemo(
        () => proprieta?.find((p) => p.id === selectedProprietaId) || null,
        [proprieta, selectedProprietaId]
    )

    const context: TemplateContext = useMemo(() => ({
        azienda: propertyManager || null,
        cliente: selectedCliente,
        proprieta: selectedProprieta,
    }), [propertyManager, selectedCliente, selectedProprieta])

    const fontTitoli = propertyManager?.font_titoli || undefined
    const fontCorpo = propertyManager?.font_corpo || undefined

    // Load Google Fonts dynamically
    useEffect(() => {
        const fonts = [fontTitoli, fontCorpo].filter(Boolean) as string[]
        fonts.forEach((font) => {
            const linkId = `gfont-${font.replace(/\s+/g, '-')}`
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link')
                link.id = linkId
                link.rel = 'stylesheet'
                link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap`
                document.head.appendChild(link)
            }
        })
    }, [fontTitoli, fontCorpo])

    const hasContext = !!propertyManager || !!selectedCliente || !!selectedProprieta

    if (!template) return null

    const categoria = CATEGORIE_TEMPLATE.find((c) => c.id === template.categoria)
    const isPdfA4 = categoria?.formato_output === 'pdf_a4'
    const formato = FORMATI_PAGINA.find((f) => f.id === template.formato_pagina)
    const orientamento = ORIENTAMENTI_PAGINA.find((o) => o.id === template.orientamento)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Anteprima: {template.nome}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">
                                    {categoria?.icon} {categoria?.label}
                                </Badge>
                                <Badge variant="secondary">
                                    {formato?.label} {orientamento?.icon}
                                </Badge>
                                {template.predefinito && (
                                    <Badge className="bg-blue-500">Predefinito</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Data source selectors */}
                <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                    <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground flex-shrink-0">Dati:</span>

                    {/* Azienda - always loaded from PropertyManager */}
                    <Badge variant={propertyManager ? 'default' : 'secondary'} className="text-xs">
                        {propertyManager ? '✓ I miei dati' : '○ I miei dati'}
                    </Badge>

                    {/* Cliente selector */}
                    <Select value={selectedClienteId} onValueChange={(v) => setSelectedClienteId(v === '__none__' ? '' : v)}>
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                            <User className="h-3 w-3 mr-1.5" />
                            <SelectValue placeholder="Seleziona cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">
                                <span className="text-muted-foreground">Nessun cliente</span>
                            </SelectItem>
                            {clienti?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.nome} {c.cognome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Proprietà selector */}
                    <Select value={selectedProprietaId} onValueChange={(v) => setSelectedProprietaId(v === '__none__' ? '' : v)}>
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                            <Home className="h-3 w-3 mr-1.5" />
                            <SelectValue placeholder="Seleziona proprietà" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">
                                <span className="text-muted-foreground">Nessuna proprietà</span>
                            </SelectItem>
                            {proprieta?.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.nome} — {p.citta}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* PDF-like preview container */}
                <div className="flex-1 overflow-y-auto bg-gray-100 rounded-lg p-6">
                    <div
                        className="bg-white shadow-lg mx-auto"
                        style={{
                            maxWidth: template.orientamento === 'landscape' ? '1000px' : '700px',
                            minHeight: '900px',
                            padding: '48px',
                            fontFamily: propertyManager?.font_corpo || 'Georgia, "Times New Roman", serif',
                        }}
                    >
                        <TemplatePreview
                            content={template.contenuto || {}}
                            context={context}
                            fontTitoli={fontTitoli}
                            fontCorpo={fontCorpo}
                            showHeaderFooter={isPdfA4}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t mt-4">
                    <div className="text-sm text-muted-foreground">
                        {hasContext ? (
                            <span className="text-green-600">● Anteprima con dati reali</span>
                        ) : (
                            <span className="text-amber-600">● Anteprima con dati di esempio</span>
                        )}
                        {' '} • {template.variabili_utilizzate?.length || 0} variabili
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Chiudi
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
