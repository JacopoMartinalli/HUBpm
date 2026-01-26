'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Save, Building2, User, Phone, CreditCard, Palette, Globe, Instagram, Facebook, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, LoadingCard } from '@/components/shared'
import { usePropertyManager, useUpsertPropertyManager } from '@/lib/hooks'
import { toast } from 'sonner'

const propertyManagerSchema = z.object({
  // Dati Aziendali
  ragione_sociale: z.string().min(1, 'Ragione sociale obbligatoria'),
  nome_commerciale: z.string().nullable().optional(),
  partita_iva: z.string().nullable().optional(),
  codice_fiscale: z.string().nullable().optional(),
  codice_sdi: z.string().nullable().optional(),
  pec: z.string().email('Email PEC non valida').nullable().optional().or(z.literal('')),
  // Indirizzo
  indirizzo: z.string().nullable().optional(),
  citta: z.string().nullable().optional(),
  cap: z.string().nullable().optional(),
  provincia: z.string().nullable().optional(),
  // Contatti
  email: z.string().email('Email non valida').nullable().optional().or(z.literal('')),
  telefono: z.string().nullable().optional(),
  cellulare: z.string().nullable().optional(),
  sito_web: z.string().url('URL non valido').nullable().optional().or(z.literal('')),
  // Social
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  // Referente
  referente_nome: z.string().nullable().optional(),
  referente_cognome: z.string().nullable().optional(),
  referente_ruolo: z.string().nullable().optional(),
  referente_email: z.string().email('Email non valida').nullable().optional().or(z.literal('')),
  referente_telefono: z.string().nullable().optional(),
  // Dati Bancari
  banca: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  swift: z.string().nullable().optional(),
  intestatario_conto: z.string().nullable().optional(),
  // Branding
  logo_url: z.string().url('URL non valido').nullable().optional().or(z.literal('')),
  colore_primario: z.string().nullable().optional(),
  // Note
  note: z.string().nullable().optional(),
})

type PropertyManagerFormData = z.infer<typeof propertyManagerSchema>

export default function PropertyManagerPage() {
  const { data: propertyManager, isLoading } = usePropertyManager()
  const upsertMutation = useUpsertPropertyManager()

  const form = useForm<PropertyManagerFormData>({
    resolver: zodResolver(propertyManagerSchema),
    defaultValues: {
      ragione_sociale: '',
      nome_commerciale: '',
      partita_iva: '',
      codice_fiscale: '',
      codice_sdi: '',
      pec: '',
      indirizzo: '',
      citta: '',
      cap: '',
      provincia: '',
      email: '',
      telefono: '',
      cellulare: '',
      sito_web: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      referente_nome: '',
      referente_cognome: '',
      referente_ruolo: '',
      referente_email: '',
      referente_telefono: '',
      banca: '',
      iban: '',
      swift: '',
      intestatario_conto: '',
      logo_url: '',
      colore_primario: '#3b82f6',
      note: '',
    },
  })

  useEffect(() => {
    if (propertyManager) {
      form.reset({
        ragione_sociale: propertyManager.ragione_sociale || '',
        nome_commerciale: propertyManager.nome_commerciale || '',
        partita_iva: propertyManager.partita_iva || '',
        codice_fiscale: propertyManager.codice_fiscale || '',
        codice_sdi: propertyManager.codice_sdi || '',
        pec: propertyManager.pec || '',
        indirizzo: propertyManager.indirizzo || '',
        citta: propertyManager.citta || '',
        cap: propertyManager.cap || '',
        provincia: propertyManager.provincia || '',
        email: propertyManager.email || '',
        telefono: propertyManager.telefono || '',
        cellulare: propertyManager.cellulare || '',
        sito_web: propertyManager.sito_web || '',
        instagram: propertyManager.instagram || '',
        facebook: propertyManager.facebook || '',
        linkedin: propertyManager.linkedin || '',
        referente_nome: propertyManager.referente_nome || '',
        referente_cognome: propertyManager.referente_cognome || '',
        referente_ruolo: propertyManager.referente_ruolo || '',
        referente_email: propertyManager.referente_email || '',
        referente_telefono: propertyManager.referente_telefono || '',
        banca: propertyManager.banca || '',
        iban: propertyManager.iban || '',
        swift: propertyManager.swift || '',
        intestatario_conto: propertyManager.intestatario_conto || '',
        logo_url: propertyManager.logo_url || '',
        colore_primario: propertyManager.colore_primario || '#3b82f6',
        note: propertyManager.note || '',
      })
    }
  }, [propertyManager, form])

  const onSubmit = async (data: PropertyManagerFormData) => {
    try {
      // Clean empty strings to null
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === '' ? null : value,
        ])
      ) as PropertyManagerFormData

      await upsertMutation.mutateAsync({
        ...cleanData,
        id: propertyManager?.id,
      })
      toast.success('Dati salvati con successo')
    } catch (error) {
      toast.error('Errore durante il salvataggio')
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="I Miei Dati"
          description="Gestisci i dati aziendali del Property Manager"
        />
        <LoadingCard />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="I Miei Dati"
        description="Gestisci i dati aziendali del Property Manager"
        actions={
          <Button onClick={form.handleSubmit(onSubmit)} disabled={upsertMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {upsertMutation.isPending ? 'Salvataggio...' : 'Salva'}
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="azienda" className="space-y-4">
            <TabsList>
              <TabsTrigger value="azienda">
                <Building2 className="h-4 w-4 mr-2" />
                Azienda
              </TabsTrigger>
              <TabsTrigger value="banca">
                <CreditCard className="h-4 w-4 mr-2" />
                Dati Bancari
              </TabsTrigger>
              <TabsTrigger value="branding">
                <Palette className="h-4 w-4 mr-2" />
                Branding
              </TabsTrigger>
            </TabsList>

            {/* Tab Azienda - unificato con Contatti e Referente */}
            <TabsContent value="azienda">
              <div className="space-y-6">
                {/* Riga 1: Dati Societari + Sede Legale */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dati Societari</CardTitle>
                      <CardDescription>Informazioni legali dell&apos;azienda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ragione_sociale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ragione Sociale *</FormLabel>
                            <FormControl>
                              <Input placeholder="Es. Mario Rossi Property Management S.r.l." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nome_commerciale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Commerciale</FormLabel>
                            <FormControl>
                              <Input placeholder="Es. MR Property" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>Nome utilizzato per il marketing</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="partita_iva"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Partita IVA</FormLabel>
                              <FormControl>
                                <Input placeholder="12345678901" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="codice_fiscale"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Codice Fiscale</FormLabel>
                              <FormControl>
                                <Input placeholder="RSSMRA..." {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="codice_sdi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Codice SDI</FormLabel>
                              <FormControl>
                                <Input placeholder="XXXXXXX" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormDescription>Per fatturazione elettronica</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pec"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PEC</FormLabel>
                              <FormControl>
                                <Input placeholder="azienda@pec.it" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sede Legale</CardTitle>
                      <CardDescription>Indirizzo della sede operativa</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="indirizzo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Indirizzo</FormLabel>
                            <FormControl>
                              <Input placeholder="Via Roma 1" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="citta"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Città</FormLabel>
                              <FormControl>
                                <Input placeholder="Roma" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cap"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CAP</FormLabel>
                              <FormControl>
                                <Input placeholder="00100" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="provincia"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provincia</FormLabel>
                              <FormControl>
                                <Input placeholder="RM" maxLength={2} {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Note</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Note aggiuntive..."
                                className="resize-none"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Riga 2: Contatti + Social + Referente */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contatti
                      </CardTitle>
                      <CardDescription>Email e telefono</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="info@azienda.it" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefono</FormLabel>
                            <FormControl>
                              <Input placeholder="+39 06 12345678" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cellulare"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cellulare</FormLabel>
                            <FormControl>
                              <Input placeholder="+39 333 1234567" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sito_web"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sito Web</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="https://www.azienda.it" {...field} value={field.value || ''} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Social Media
                      </CardTitle>
                      <CardDescription>Profili social</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Instagram className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="@azienda" {...field} value={field.value || ''} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Facebook className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="facebook.com/azienda" {...field} value={field.value || ''} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="linkedin.com/company/azienda" {...field} value={field.value || ''} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Referente
                      </CardTitle>
                      <CardDescription>Persona di riferimento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="referente_nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Mario" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referente_cognome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cognome</FormLabel>
                              <FormControl>
                                <Input placeholder="Rossi" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="referente_ruolo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ruolo</FormLabel>
                            <FormControl>
                              <Input placeholder="CEO / Property Manager" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="referente_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="mario@azienda.it" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="referente_telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefono</FormLabel>
                            <FormControl>
                              <Input placeholder="+39 333 1234567" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab Dati Bancari */}
            <TabsContent value="banca">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Dati Bancari</CardTitle>
                  <CardDescription>Coordinate bancarie per pagamenti e fatturazione</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="banca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banca</FormLabel>
                        <FormControl>
                          <Input placeholder="Intesa Sanpaolo" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input placeholder="IT60X0542811101000000123456" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="swift"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT/BIC</FormLabel>
                          <FormControl>
                            <Input placeholder="BCITITMM" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="intestatario_conto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intestatario Conto</FormLabel>
                          <FormControl>
                            <Input placeholder="Mario Rossi PM S.r.l." {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Branding */}
            <TabsContent value="branding">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Logo e colori aziendali per documenti e comunicazioni</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Logo</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          Inserisci l&apos;URL del logo aziendale (sarà usato nei documenti)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="colore_primario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colore Primario</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              className="w-16 h-10 p-1 cursor-pointer"
                              {...field}
                              value={field.value || '#3b82f6'}
                            />
                            <Input
                              placeholder="#3b82f6"
                              {...field}
                              value={field.value || ''}
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Colore principale per documenti e comunicazioni
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch('logo_url') && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Anteprima Logo</p>
                      <div className="border rounded-lg p-4 bg-muted/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.watch('logo_url') || ''}
                          alt="Logo anteprima"
                          className="max-h-24 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  )
}
