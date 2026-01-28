'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppuntamenti } from '@/lib/hooks/use-appuntamenti'
import {
    Clock,
    MapPin,
    Phone,
    Video,
    Users,
    CalendarDays,
    Calendar
} from 'lucide-react'

interface AppuntamentiListCardProps {
    contattoId?: string
    proprietaId?: string
    limit?: number
    className?: string
}

export function AppuntamentiListCard({
    contattoId,
    proprietaId,
    limit = 5,
    className
}: AppuntamentiListCardProps) {
    const { data: appuntamenti, isLoading } = useAppuntamenti({
        contattoId,
        proprietaId,
        dataInizio: new Date().toISOString(),
    })

    // Filter out cancelled/completed
    const activeAppuntamenti = appuntamenti?.filter(a =>
        a.stato !== 'annullato' && a.stato !== 'completato'
    ).slice(0, limit)

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Prossimi Appuntamenti
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Caricamento...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Prossimi Appuntamenti
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/calendario">Calendario</Link>
                </Button>
            </CardHeader>
            <CardContent>
                {activeAppuntamenti && activeAppuntamenti.length > 0 ? (
                    <div className="space-y-3">
                        {activeAppuntamenti.map((app) => (
                            <div
                                key={app.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                    p-2 rounded-full
                    ${app.tipo === 'sopralluogo' ? 'bg-blue-100 text-blue-600' : ''}
                    ${app.tipo === 'telefonata' ? 'bg-green-100 text-green-600' : ''}
                    ${app.tipo === 'videochiamata' ? 'bg-purple-100 text-purple-600' : ''}
                    ${app.tipo === 'riunione' ? 'bg-amber-100 text-amber-600' : ''}
                    ${app.tipo === 'altro' ? 'bg-gray-100 text-gray-600' : ''}
                  `}>
                                        {app.tipo === 'sopralluogo' && <MapPin className="h-4 w-4" />}
                                        {app.tipo === 'telefonata' && <Phone className="h-4 w-4" />}
                                        {app.tipo === 'videochiamata' && <Video className="h-4 w-4" />}
                                        {app.tipo === 'riunione' && <Users className="h-4 w-4" />}
                                        {app.tipo === 'altro' && <CalendarDays className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{app.titolo}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{new Date(app.data_inizio).toLocaleDateString('it-IT')}</span>
                                            <span>•</span>
                                            <span>{new Date(app.data_inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground text-sm">
                            Nessun appuntamento in programma
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
