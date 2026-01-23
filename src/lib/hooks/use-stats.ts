import { useQuery } from '@tanstack/react-query'
import { supabase, DEFAULT_TENANT_ID } from '@/lib/supabase'

export const statsKeys = {
  all: ['stats'] as const,
  dashboard: () => [...statsKeys.all, 'dashboard'] as const,
  lead: () => [...statsKeys.all, 'lead'] as const,
  proprieta: () => [...statsKeys.all, 'proprieta'] as const,
  clienti: () => [...statsKeys.all, 'clienti'] as const,
  prenotazioni: (anno?: number) => [...statsKeys.all, 'prenotazioni', anno] as const,
}

// Stats generali per la dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: statsKeys.dashboard(),
    queryFn: async () => {
      // Lead attivi (esito in_corso)
      const { count: leadAttivi } = await supabase
        .from('contatti')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo', 'lead')
        .eq('esito_lead', 'in_corso')

      // Clienti attivi (non cessati)
      const { count: clientiAttivi } = await supabase
        .from('contatti')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo', 'cliente')
        .neq('fase_cliente', 'C3')

      // Proprietà operative (P4)
      const { count: proprietaOperative } = await supabase
        .from('proprieta')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('fase', 'P4')

      // Proprietà lead in valutazione
      const { count: proprietaLeadAttive } = await supabase
        .from('proprieta_lead')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('esito', 'in_corso')

      // Task pendenti
      const { count: taskPendenti } = await supabase
        .from('task')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .in('stato', ['da_fare', 'in_corso'])

      // Task scaduti
      const today = new Date().toISOString().split('T')[0]
      const { count: taskScaduti } = await supabase
        .from('task')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .in('stato', ['da_fare', 'in_corso'])
        .lt('data_scadenza', today)

      // Prenotazioni del mese corrente
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      const { data: prenotazioniMese } = await supabase
        .from('prenotazioni')
        .select('importo_netto')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .gte('checkin', startOfMonth)
        .lte('checkin', endOfMonth)
        .not('stato', 'in', '("cancellata","no_show")')

      const ricaviMese = prenotazioniMese?.reduce((sum, p) => sum + (p.importo_netto || 0), 0) || 0

      return {
        leadAttivi: leadAttivi || 0,
        clientiAttivi: clientiAttivi || 0,
        proprietaOperative: proprietaOperative || 0,
        proprietaLeadAttive: proprietaLeadAttive || 0,
        taskPendenti: taskPendenti || 0,
        taskScaduti: taskScaduti || 0,
        ricaviMese,
      }
    },
  })
}

// Stats Lead per fase
export function useLeadStatsByFase() {
  return useQuery({
    queryKey: statsKeys.lead(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatti')
        .select('fase_lead, esito_lead')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo', 'lead')

      if (error) throw error

      const byFase: Record<string, number> = {}
      const byEsito: Record<string, number> = {}

      data.forEach((lead) => {
        if (lead.fase_lead) {
          byFase[lead.fase_lead] = (byFase[lead.fase_lead] || 0) + 1
        }
        if (lead.esito_lead) {
          byEsito[lead.esito_lead] = (byEsito[lead.esito_lead] || 0) + 1
        }
      })

      return { byFase, byEsito, totale: data.length }
    },
  })
}

// Stats Proprietà per fase
export function useProprietaStatsByFase() {
  return useQuery({
    queryKey: statsKeys.proprieta(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprieta')
        .select('fase')
        .eq('tenant_id', DEFAULT_TENANT_ID)

      if (error) throw error

      const byFase: Record<string, number> = {}

      data.forEach((p) => {
        byFase[p.fase] = (byFase[p.fase] || 0) + 1
      })

      return { byFase, totale: data.length }
    },
  })
}

// Stats Clienti per fase
export function useClientiStatsByFase() {
  return useQuery({
    queryKey: statsKeys.clienti(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatti')
        .select('fase_cliente')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('tipo', 'cliente')

      if (error) throw error

      const byFase: Record<string, number> = {}

      data.forEach((c) => {
        if (c.fase_cliente) {
          byFase[c.fase_cliente] = (byFase[c.fase_cliente] || 0) + 1
        }
      })

      return { byFase, totale: data.length }
    },
  })
}

// Stats Prenotazioni annuali
export function usePrenotazioniStatsAnnuali(anno?: number) {
  const currentYear = anno || new Date().getFullYear()

  return useQuery({
    queryKey: statsKeys.prenotazioni(currentYear),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prenotazioni')
        .select('checkin, importo_netto, notti')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .gte('checkin', `${currentYear}-01-01`)
        .lte('checkin', `${currentYear}-12-31`)
        .not('stato', 'in', '("cancellata","no_show")')

      if (error) throw error

      // Raggruppa per mese
      const byMonth: Record<number, { prenotazioni: number; ricavi: number; notti: number }> = {}

      for (let i = 1; i <= 12; i++) {
        byMonth[i] = { prenotazioni: 0, ricavi: 0, notti: 0 }
      }

      data.forEach((p) => {
        const month = new Date(p.checkin).getMonth() + 1
        byMonth[month].prenotazioni += 1
        byMonth[month].ricavi += p.importo_netto || 0
        byMonth[month].notti += p.notti || 0
      })

      const totaleRicavi = data.reduce((sum, p) => sum + (p.importo_netto || 0), 0)
      const totaleNotti = data.reduce((sum, p) => sum + (p.notti || 0), 0)

      return {
        byMonth,
        totalePrenotazioni: data.length,
        totaleRicavi,
        totaleNotti,
        anno: currentYear,
      }
    },
  })
}
