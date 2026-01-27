'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TemplatePreview } from '@/components/templates/preview'
import { CATEGORIE_TEMPLATE, FORMATI_PAGINA, ORIENTAMENTI_PAGINA } from '@/constants'
import type { DocumentTemplate } from '@/types/database'
import { X, FileText } from 'lucide-react'

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
    if (!template) return null

    const categoria = CATEGORIE_TEMPLATE.find((c) => c.id === template.categoria)
    const formato = FORMATI_PAGINA.find((f) => f.id === template.formato_pagina)
    const orientamento = ORIENTAMENTI_PAGINA.find((o) => o.id === template.orientamento)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
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

                {/* PDF-like preview container */}
                <div className="flex-1 overflow-y-auto bg-gray-100 rounded-lg p-6">
                    {/* Paper simulation */}
                    <div
                        className="bg-white shadow-lg mx-auto"
                        style={{
                            maxWidth: template.orientamento === 'landscape' ? '1000px' : '700px',
                            minHeight: '900px',
                            padding: '48px',
                            fontFamily: 'Georgia, "Times New Roman", serif',
                        }}
                    >
                        <TemplatePreview content={template.contenuto || {}} />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t mt-4">
                    <div className="text-sm text-muted-foreground">
                        Anteprima con dati di esempio • {template.variabili_utilizzate?.length || 0} variabili
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
