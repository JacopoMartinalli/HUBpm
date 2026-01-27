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
import { X, FileText, Printer } from 'lucide-react'

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
                                {template.nome}
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
                            {template.descrizione && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    {template.descrizione}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Info legenda placeholders */}
                <div className="flex-shrink-0 bg-purple-50 border border-purple-200 rounded-lg p-3 mx-1">
                    <div className="flex items-center gap-3 text-sm text-purple-700">
                        <div className="flex items-center gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 border border-dashed border-purple-300 rounded text-xs">
                                <span className="text-purple-400">@</span>
                                <span className="font-medium ml-1">Variabile:</span>
                                <span className="italic ml-1">esempio</span>
                            </span>
                            <span>= Dato dinamico</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-xs">
                                Placeholder
                            </span>
                            <span>= Blocco automatico</span>
                        </div>
                    </div>
                </div>

                {/* Preview content */}
                <div className="flex-1 overflow-y-auto mt-4 border rounded-lg bg-white">
                    <div
                        className="p-8 min-h-full"
                        style={{
                            // Simula le proporzioni della pagina
                            maxWidth: template.orientamento === 'landscape' ? '100%' : '800px',
                            margin: '0 auto',
                        }}
                    >
                        <TemplatePreview content={template.contenuto || {}} />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t mt-4">
                    <div className="text-sm text-muted-foreground">
                        {template.variabili_utilizzate?.length || 0} variabili • v{template.versione}
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
