'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
    useCreateAppuntamento,
    useUpdateAppuntamento,
    useDeleteAppuntamento,
    useContatti
} from '@/lib/hooks'
import type { Appuntamento, TipoAppuntamento, StatoAppuntamento, AppuntamentoInsert } from '@/types/database'
import {
    MapPin,
    Phone,
    Video,
    Users,
    Calendar,
    Clock,
    Trash2,
    Save,
} from 'lucide-react'

interface AppuntamentoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appuntamento: Appuntamento | null
    defaultDates?: { start: Date; end: Date } | null
    onClose: () => void
    // For pre-filling from lead/property
    prefillData?: {
        contattoId?: string
        proprietaId?: string
        proprietaLeadId?: string
        titolo?: string
        luogo?: string
    }
}

const TIPO_OPTIONS: { value: TipoAppuntamento; label: string; icon: React.ReactNode }[] = [
    { value: 'sopralluogo', label: 'Sopralluogo', icon: <MapPin className="h-4 w-4" /> },
    { value: 'telefonata', label: 'Telefonata', icon: <Phone className="h-4 w-4" /> },
    { value: 'videochiamata', label: 'Videochiamata', icon: <Video className="h-4 w-4" /> },
    { value: 'riunione', label: 'Riunione', icon: <Users className="h-4 w-4" /> },
    { value: 'altro', label: 'Altro', icon: <Calendar className="h-4 w-4" /> },
]

const STATO_OPTIONS: { value: StatoAppuntamento; label: string }[] = [
    { value: 'proposto', label: 'Proposto' },
    { value: 'confermato', label: 'Confermato' },
    { value: 'completato', label: 'Completato' },
    { value: 'annullato', label: 'Annullato' },
    { value: 'no_show', label: 'No Show' },
]

interface FormData {
    titolo: string
    descrizione: string
    tipo: TipoAppuntamento
    stato: StatoAppuntamento
    data_inizio: string
    ora_inizio: string
    data_fine: string
    ora_fine: string
    tutto_il_giorno: boolean
    luogo: string
    note: string
    contatto_id: string
}

function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0]
}

function formatTimeForInput(date: Date): string {
    return date.toTimeString().slice(0, 5)
}

export function AppuntamentoDialog({
    open,
    onOpenChange,
    appuntamento,
    defaultDates,
    onClose,
    prefillData,
}: AppuntamentoDialogProps) {
    const isEditing = !!appuntamento

    const createAppuntamento = useCreateAppuntamento()
    const updateAppuntamento = useUpdateAppuntamento()
    const deleteAppuntamento = useDeleteAppuntamento()

    const { data: contatti } = useContatti({ tipo: 'lead' })

    const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
        defaultValues: {
            titolo: '',
            descrizione: '',
            tipo: 'sopralluogo',
            stato: 'proposto',
            data_inizio: formatDateForInput(new Date()),
            ora_inizio: '09:00',
            data_fine: formatDateForInput(new Date()),
            ora_fine: '10:00',
            tutto_il_giorno: false,
            luogo: '',
            note: '',
            contatto_id: '',
        },
    })

    const tuttoIlGiorno = watch('tutto_il_giorno')
    const tipo = watch('tipo')

    // Reset form when dialog opens/closes or appuntamento changes
    useEffect(() => {
        if (open) {
            if (appuntamento) {
                // Editing existing
                const startDate = new Date(appuntamento.data_inizio)
                const endDate = new Date(appuntamento.data_fine)

                reset({
                    titolo: appuntamento.titolo,
                    descrizione: appuntamento.descrizione || '',
                    tipo: appuntamento.tipo,
                    stato: appuntamento.stato,
                    data_inizio: formatDateForInput(startDate),
                    ora_inizio: formatTimeForInput(startDate),
                    data_fine: formatDateForInput(endDate),
                    ora_fine: formatTimeForInput(endDate),
                    tutto_il_giorno: appuntamento.tutto_il_giorno,
                    luogo: appuntamento.luogo || '',
                    note: appuntamento.note || '',
                    contatto_id: appuntamento.contatto_id || '',
                })
            } else if (defaultDates) {
                // Creating new with dates
                reset({
                    titolo: prefillData?.titolo || '',
                    descrizione: '',
                    tipo: 'sopralluogo',
                    stato: 'proposto',
                    data_inizio: formatDateForInput(defaultDates.start),
                    ora_inizio: formatTimeForInput(defaultDates.start),
                    data_fine: formatDateForInput(defaultDates.end),
                    ora_fine: formatTimeForInput(defaultDates.end),
                    tutto_il_giorno: false,
                    luogo: prefillData?.luogo || '',
                    note: '',
                    contatto_id: prefillData?.contattoId || '',
                })
            } else {
                // Creating new without dates
                const now = new Date()
                const later = new Date(now.getTime() + 60 * 60 * 1000)
                reset({
                    titolo: prefillData?.titolo || '',
                    descrizione: '',
                    tipo: 'sopralluogo',
                    stato: 'proposto',
                    data_inizio: formatDateForInput(now),
                    ora_inizio: formatTimeForInput(now),
                    data_fine: formatDateForInput(later),
                    ora_fine: formatTimeForInput(later),
                    tutto_il_giorno: false,
                    luogo: prefillData?.luogo || '',
                    note: '',
                    contatto_id: prefillData?.contattoId || '',
                })
            }
        }
    }, [open, appuntamento, defaultDates, prefillData, reset])

    const onSubmit = async (data: FormData) => {
        // Combine date and time
        const dataInizio = new Date(`${data.data_inizio}T${data.tutto_il_giorno ? '00:00' : data.ora_inizio}`)
        const dataFine = new Date(`${data.data_fine}T${data.tutto_il_giorno ? '23:59' : data.ora_fine}`)

        const payload: Omit<AppuntamentoInsert, 'tenant_id'> = {
            titolo: data.titolo,
            descrizione: data.descrizione || null,
            tipo: data.tipo,
            stato: data.stato,
            data_inizio: dataInizio.toISOString(),
            data_fine: dataFine.toISOString(),
            tutto_il_giorno: data.tutto_il_giorno,
            luogo: data.luogo || null,
            note: data.note || null,
            contatto_id: data.contatto_id || null,
            proprieta_id: prefillData?.proprietaId || null,
            proprieta_lead_id: prefillData?.proprietaLeadId || null,
            promemoria_minuti: null,
            invito_inviato: false,
            invito_accettato: null,
        }

        try {
            if (isEditing) {
                await updateAppuntamento.mutateAsync({ id: appuntamento.id, ...payload })
            } else {
                await createAppuntamento.mutateAsync(payload)
            }
            onClose()
        } catch (error) {
            console.error('Error saving appuntamento:', error)
        }
    }

    const handleDelete = async () => {
        if (!appuntamento || !confirm('Sei sicuro di voler eliminare questo appuntamento?')) return

        try {
            await deleteAppuntamento.mutateAsync(appuntamento.id)
            onClose()
        } catch (error) {
            console.error('Error deleting appuntamento:', error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="titolo">Titolo *</Label>
                        <Input
                            id="titolo"
                            placeholder="Es: Sopralluogo Villa Rossi"
                            {...register('titolo', { required: true })}
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <div className="flex flex-wrap gap-2">
                            {TIPO_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    variant={tipo === option.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setValue('tipo', option.value)}
                                    className="flex items-center gap-1"
                                >
                                    {option.icon}
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                        <Label htmlFor="contatto_id">Contatto</Label>
                        <Select
                            value={watch('contatto_id')}
                            onValueChange={(value) => setValue('contatto_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleziona contatto" />
                            </SelectTrigger>
                            <SelectContent>
                                {contatti?.map((contatto) => (
                                    <SelectItem key={contatto.id} value={contatto.id}>
                                        {contatto.nome} {contatto.cognome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* All day toggle */}
                    <div className="flex items-center gap-2">
                        <Switch
                            id="tutto_il_giorno"
                            checked={tuttoIlGiorno}
                            onCheckedChange={(checked) => setValue('tutto_il_giorno', checked)}
                        />
                        <Label htmlFor="tutto_il_giorno">Tutto il giorno</Label>
                    </div>

                    {/* Date/Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_inizio">Data inizio</Label>
                            <Input
                                id="data_inizio"
                                type="date"
                                {...register('data_inizio', { required: true })}
                            />
                        </div>
                        {!tuttoIlGiorno && (
                            <div className="space-y-2">
                                <Label htmlFor="ora_inizio">Ora inizio</Label>
                                <Input
                                    id="ora_inizio"
                                    type="time"
                                    {...register('ora_inizio')}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data_fine">Data fine</Label>
                            <Input
                                id="data_fine"
                                type="date"
                                {...register('data_fine', { required: true })}
                            />
                        </div>
                        {!tuttoIlGiorno && (
                            <div className="space-y-2">
                                <Label htmlFor="ora_fine">Ora fine</Label>
                                <Input
                                    id="ora_fine"
                                    type="time"
                                    {...register('ora_fine')}
                                />
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="luogo">Luogo / Link</Label>
                        <Input
                            id="luogo"
                            placeholder="Indirizzo o link videocall"
                            {...register('luogo')}
                        />
                    </div>

                    {/* Status (only for editing) */}
                    {isEditing && (
                        <div className="space-y-2">
                            <Label>Stato</Label>
                            <Select
                                value={watch('stato')}
                                onValueChange={(value) => setValue('stato', value as StatoAppuntamento)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATO_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                            id="note"
                            rows={2}
                            placeholder="Note aggiuntive..."
                            {...register('note')}
                        />
                    </div>

                    <DialogFooter className="flex gap-2">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleteAppuntamento.isPending}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina
                            </Button>
                        )}
                        <div className="flex-1" />
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annulla
                        </Button>
                        <Button
                            type="submit"
                            disabled={createAppuntamento.isPending || updateAppuntamento.isPending}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isEditing ? 'Salva' : 'Crea'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
