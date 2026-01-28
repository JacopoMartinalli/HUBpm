'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTemplateAppuntamenti } from '@/lib/hooks/use-appuntamenti'
import { AppuntamentoDialog } from './AppuntamentoDialog'
import { Lightbulb, CalendarClock, ArrowRight } from 'lucide-react'
import type { TipoAppuntamento } from '@/types/database'

interface AppuntamentoSuggestionCardProps {
    tipoEntita: 'lead' | 'proprieta_lead'
    fase: string
    entityId: string // contattoId or proprietaLeadId
    contattoId?: string // always needed for linking contact
    proprietaLeadId?: string
    proprietaId?: string
}

export function AppuntamentoSuggestionCard({
    tipoEntita,
    fase,
    entityId,
    contattoId,
    proprietaLeadId,
    proprietaId
}: AppuntamentoSuggestionCardProps) {
    const { data: templates, isLoading } = useTemplateAppuntamenti(tipoEntita, fase)
    const [selectedTemplate, setSelectedTemplate] = useState<{
        titolo: string
        descrizione: string
        tipo: TipoAppuntamento
    } | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    if (isLoading || !templates || templates.length === 0) {
        return null
    }

    const handleSuggestionClick = (template: typeof templates[0]) => {
        setSelectedTemplate({
            titolo: template.titolo,
            descrizione: template.descrizione || '',
            tipo: template.tipo // Assuming template has 'tipo' field matching TipoAppuntamento
        })
        setIsDialogOpen(true)
    }

    return (
        <>
            <Card className="bg-blue-50/50 border-blue-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Suggerimenti Prossimi Passi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-blue-100 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-full mt-0.5">
                                    <CalendarClock className="h-4 w-4 text-blue-600" />
                                    --</div>
                                <div>
                                    <h4 className="font-medium text-sm text-gray-900">{template.titolo}</h4>
                                    {template.descrizione && (
                                        <p className="text-xs text-gray-500 line-clamp-1">{template.descrizione}</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="ml-4 shrink-0 border-blue-200 hover:bg-blue-50 text-blue-700"
                                onClick={() => handleSuggestionClick(template)}
                            >
                                Pianifica
                                <ArrowRight className="h-3 w-3 ml-1.5" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <AppuntamentoDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                appuntamento={null}
                onClose={() => {
                    setIsDialogOpen(false)
                    setSelectedTemplate(null)
                }}
                prefillData={{
                    contattoId: contattoId,
                    proprietaLeadId: proprietaLeadId,
                    proprietaId: proprietaId,
                    titolo: selectedTemplate?.titolo,
                    descrizione: selectedTemplate?.descrizione,
                    tipo: selectedTemplate?.tipo
                }}
            />
        </>
    )
}
