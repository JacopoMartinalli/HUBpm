'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  BookOpen,
  ClipboardList,
  Settings,
  Users,
  Home,
  ArrowRight,
} from 'lucide-react'
import { DOCUMENTI_WIKI } from '@/constants/documenti-wiki'

// Definizione sezioni Wiki
const WIKI_SECTIONS = [
  {
    id: 'documenti',
    title: 'Documenti',
    description: 'Guida completa ai documenti richiesti per ogni fase della gestione proprietà',
    icon: FileText,
    href: '/wiki/documenti',
    count: DOCUMENTI_WIKI.length,
    countLabel: 'documenti',
    color: 'bg-blue-500',
  },
  {
    id: 'procedure',
    title: 'Procedure Operative',
    description: 'Procedure standard per check-in, check-out, pulizie e manutenzione',
    icon: ClipboardList,
    href: '/wiki/procedure',
    count: null,
    countLabel: null,
    color: 'bg-green-500',
    comingSoon: true,
  },
  {
    id: 'onboarding',
    title: 'Onboarding Clienti',
    description: 'Processo di acquisizione e onboarding nuovi clienti e proprietà',
    icon: Users,
    href: '/wiki/onboarding',
    count: null,
    countLabel: null,
    color: 'bg-purple-500',
    comingSoon: true,
  },
  {
    id: 'proprieta',
    title: 'Setup Proprietà',
    description: 'Guida al setup completo di una nuova proprietà nel sistema',
    icon: Home,
    href: '/wiki/proprieta',
    count: null,
    countLabel: null,
    color: 'bg-amber-500',
    comingSoon: true,
  },
  {
    id: 'configurazione',
    title: 'Configurazione Sistema',
    description: 'Impostazioni, template e configurazioni del gestionale',
    icon: Settings,
    href: '/wiki/configurazione',
    count: null,
    countLabel: null,
    color: 'bg-gray-500',
    comingSoon: true,
  },
]

export default function WikiPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Wiki & Procedure
        </h1>
        <p className="text-muted-foreground">
          Knowledge base interna con documenti, procedure e guide operative
        </p>
      </div>

      {/* Griglia sezioni */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WIKI_SECTIONS.map((section) => {
          const Icon = section.icon
          const isAvailable = !section.comingSoon

          return (
            <Link
              key={section.id}
              href={isAvailable ? section.href : '#'}
              className={isAvailable ? '' : 'pointer-events-none'}
            >
              <Card className={`h-full transition-all ${isAvailable ? 'hover:shadow-md hover:border-primary/50 cursor-pointer' : 'opacity-60'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${section.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {section.comingSoon && (
                      <Badge variant="secondary" className="text-xs">
                        Coming soon
                      </Badge>
                    )}
                    {section.count !== null && (
                      <Badge variant="outline" className="text-xs">
                        {section.count} {section.countLabel}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                {isAvailable && (
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm text-primary font-medium">
                      Vai alla sezione
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Info box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Knowledge Base in evoluzione</h3>
              <p className="text-sm text-muted-foreground">
                Questa wiki viene costantemente aggiornata con nuove procedure e documentazione.
                Le sezioni &quot;Coming soon&quot; saranno disponibili nelle prossime versioni.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
