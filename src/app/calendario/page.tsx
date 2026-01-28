'use client'

import { useState, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingPage } from '@/components/shared'
import { useAppuntamenti, useUpdateAppuntamento } from '@/lib/hooks'
import { AppuntamentoDialog } from '@/components/appuntamenti/AppuntamentoDialog'
import type { Appuntamento, TipoAppuntamento } from '@/types/database'
import { CalendarDays, Plus } from 'lucide-react'

// Colori per tipo appuntamento
const TIPO_COLORS: Record<TipoAppuntamento, string> = {
    sopralluogo: '#3B82F6',     // blue
    telefonata: '#10B981',      // green
    videochiamata: '#8B5CF6',   // purple
    riunione: '#F59E0B',        // amber
    altro: '#6B7280',           // gray
}

export default function CalendarioPage() {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0),
    })

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedAppuntamento, setSelectedAppuntamento] = useState<Appuntamento | null>(null)
    const [defaultDates, setDefaultDates] = useState<{ start: Date; end: Date } | null>(null)

    const { data: appuntamenti, isLoading } = useAppuntamenti({
        dataInizio: dateRange.start.toISOString(),
        dataFine: dateRange.end.toISOString(),
    })

    const updateAppuntamento = useUpdateAppuntamento()

    // Convert appointments to FullCalendar events
    const events = useMemo(() => {
        if (!appuntamenti) return []

        return appuntamenti.map((app) => ({
            id: app.id,
            title: app.titolo,
            start: app.data_inizio,
            end: app.data_fine,
            allDay: app.tutto_il_giorno,
            backgroundColor: TIPO_COLORS[app.tipo] || TIPO_COLORS.altro,
            borderColor: TIPO_COLORS[app.tipo] || TIPO_COLORS.altro,
            extendedProps: {
                appuntamento: app,
            },
        }))
    }, [appuntamenti])

    // Handle date range change (when user navigates calendar)
    const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
        setDateRange({
            start: arg.start,
            end: arg.end,
        })
    }, [])

    // Click on event -> edit
    const handleEventClick = useCallback((arg: EventClickArg) => {
        const app = arg.event.extendedProps.appuntamento as Appuntamento
        setSelectedAppuntamento(app)
        setDefaultDates(null)
        setDialogOpen(true)
    }, [])

    // Select date range -> create new
    const handleDateSelect = useCallback((arg: DateSelectArg) => {
        setSelectedAppuntamento(null)
        setDefaultDates({
            start: arg.start,
            end: arg.end,
        })
        setDialogOpen(true)
    }, [])

    // Drag to reschedule
    const handleEventDrop = useCallback((arg: EventDropArg) => {
        const app = arg.event.extendedProps.appuntamento as Appuntamento

        updateAppuntamento.mutate({
            id: app.id,
            data_inizio: arg.event.start?.toISOString() || app.data_inizio,
            data_fine: arg.event.end?.toISOString() || app.data_fine,
        })
    }, [updateAppuntamento])

    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false)
        setSelectedAppuntamento(null)
        setDefaultDates(null)
    }, [])

    const handleNewAppuntamento = useCallback(() => {
        setSelectedAppuntamento(null)
        setDefaultDates({
            start: new Date(),
            end: new Date(Date.now() + 60 * 60 * 1000), // +1 hour
        })
        setDialogOpen(true)
    }, [])

    if (isLoading) {
        return <LoadingPage />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <CalendarDays className="h-6 w-6" />
                        Calendario Appuntamenti
                    </h1>
                    <p className="text-muted-foreground">
                        Gestisci sopralluoghi, chiamate e riunioni
                    </p>
                </div>
                <Button onClick={handleNewAppuntamento}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Appuntamento
                </Button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4">
                {Object.entries(TIPO_COLORS).map(([tipo, color]) => (
                    <div key={tipo} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="capitalize">{tipo}</span>
                    </div>
                ))}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        locale="it"
                        firstDay={1}
                        events={events}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        editable={true}
                        selectAllow={(selectInfo) => {
                            return selectInfo.start >= new Date(new Date().setHours(0, 0, 0, 0))
                        }}
                        eventAllow={(dropInfo, draggedEvent) => {
                            return dropInfo.start >= new Date(new Date().setHours(0, 0, 0, 0))
                        }}
                        datesSet={handleDatesSet}
                        eventClick={handleEventClick}
                        select={handleDateSelect}
                        eventDrop={handleEventDrop}
                        height="auto"
                        buttonText={{
                            today: 'Oggi',
                            month: 'Mese',
                            week: 'Settimana',
                            day: 'Giorno',
                        }}
                    />
                </CardContent>
            </Card>

            <AppuntamentoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                appuntamento={selectedAppuntamento}
                defaultDates={defaultDates}
                onClose={handleCloseDialog}
            />
        </div>
    )
}
