'use client'

import { useState } from 'react'
import { Key, Wifi, Calendar, Car, Trash2, BookOpen, Edit2, Save, X, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { Proprieta } from '@/types/database'

interface OperativoSectionProps {
  proprieta: Proprieta
  id: string
  onUpdateProprieta: (data: any) => void
}

export function OperativoSection({ proprieta, id, onUpdateProprieta }: OperativoSectionProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleEdit = (field: string, currentValue: string | null) => {
    setEditingField(field)
    setEditValue(currentValue || '')
  }

  const handleSave = (field: string) => {
    onUpdateProprieta({ id, [field]: editValue || null })
    setEditingField(null)
    setEditValue('')
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  const EditableField = ({
    field,
    value,
    label,
    multiline = false
  }: {
    field: string
    value: string | null
    label: string
    multiline?: boolean
  }) => {
    const isEditing = editingField === field

    if (isEditing) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          {multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[100px]"
              placeholder={`Inserisci ${label.toLowerCase()}...`}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Inserisci ${label.toLowerCase()}...`}
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleSave(field)}>
              <Save className="h-3 w-3 mr-1" />
              Salva
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-3 w-3 mr-1" />
              Annulla
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="group">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
            onClick={() => handleEdit(field, value)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
        <p className={`text-sm whitespace-pre-wrap ${!value ? 'text-muted-foreground italic' : ''}`}>
          {value || 'Non specificato'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Accesso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              Accesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Codice Portone</p>
              <p className="font-medium font-mono">{proprieta.codice_portone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Codice Appartamento</p>
              <p className="font-medium font-mono">{proprieta.codice_appartamento || '-'}</p>
            </div>
            <Separator />
            <EditableField
              field="istruzioni_accesso"
              value={proprieta.istruzioni_accesso}
              label="Istruzioni Accesso"
              multiline
            />
          </CardContent>
        </Card>

        {/* WiFi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Connettività
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">WiFi SSID</p>
              <p className="font-medium font-mono">{proprieta.wifi_ssid || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">WiFi Password</p>
              <p className="font-medium font-mono">{proprieta.wifi_password || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Check-in/out */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Check-in / Check-out
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Orario Check-in</p>
                <p className="font-medium">{proprieta.checkin_orario || '15:00'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orario Check-out</p>
                <p className="font-medium">{proprieta.checkout_orario || '10:00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smaltimento Rifiuti e Parcheggio */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Smaltimento Rifiuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableField
              field="smaltimento_rifiuti"
              value={proprieta.smaltimento_rifiuti}
              label="Istruzioni raccolta differenziata"
              multiline
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              Parcheggio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableField
              field="parcheggio"
              value={proprieta.parcheggio}
              label="Info parcheggio"
              multiline
            />
          </CardContent>
        </Card>
      </div>

      {/* Regole Casa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Regole della Casa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableField
            field="regole_casa"
            value={proprieta.regole_casa}
            label="Regole per gli ospiti"
            multiline
          />
        </CardContent>
      </Card>

      {/* Note e Info Utili */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Info Utili e Contatti Locali
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableField
            field="note"
            value={proprieta.note}
            label="Note, contatti utili, luoghi d'interesse nelle vicinanze"
            multiline
          />
        </CardContent>
      </Card>
    </div>
  )
}
