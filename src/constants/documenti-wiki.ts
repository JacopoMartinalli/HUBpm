/**
 * WIKI DOCUMENTI - HUB Property Management
 *
 * Definizione completa di tutti i documenti richiesti per la gestione
 * delle proprietà in affitto breve. Include:
 * - Descrizione dettagliata
 * - Procedura per ottenere/verificare il documento
 * - Fase in cui è richiesto
 * - Scadenza (se applicabile)
 * - Link utili e riferimenti normativi
 */

import type { CategoriaDocumento } from '@/types/database'

// Tipo per la definizione completa di un documento
export type DocumentoWiki = {
  id: string
  nome: string
  categoria: CategoriaDocumento
  obbligatorio: boolean
  fase: string // Fase in cui viene richiesto per la prima volta
  descrizione: string
  procedura: string[]
  tempiStimati?: string
  costo?: string
  scadenza?: string // es. "annuale", "5 anni", "nessuna"
  linkUtili?: { label: string; url: string }[]
  note?: string
  documentiCorrelati?: string[] // ID di altri documenti correlati
}

// ============================================================================
// DOCUMENTI FASE P0 - VALUTAZIONE
// ============================================================================

export const DOC_IDENTITA_PROPRIETARIO: DocumentoWiki = {
  id: 'doc_identita_proprietario',
  nome: 'Documento identità proprietario',
  categoria: 'identita',
  obbligatorio: true,
  fase: 'P0',
  descrizione: 'Carta d\'identità o passaporto del proprietario dell\'immobile. Necessario per verificare l\'identità e per le pratiche burocratiche.',
  procedura: [
    'Richiedere al proprietario copia fronte/retro del documento',
    'Verificare che il documento sia in corso di validità',
    'Controllare che i dati corrispondano a quelli della visura catastale',
    'Salvare in formato PDF o immagine ad alta risoluzione',
  ],
  tempiStimati: 'Immediato',
  costo: 'Gratuito',
  scadenza: '10 anni (CI) / 10 anni (Passaporto)',
  note: 'In caso di comproprietà, raccogliere i documenti di tutti i proprietari',
}

export const DOC_CODICE_FISCALE: DocumentoWiki = {
  id: 'doc_codice_fiscale',
  nome: 'Codice fiscale proprietario',
  categoria: 'fiscale',
  obbligatorio: true,
  fase: 'P0',
  descrizione: 'Tessera sanitaria o certificato di attribuzione del codice fiscale del proprietario.',
  procedura: [
    'Richiedere copia della tessera sanitaria (fronte/retro)',
    'In alternativa, accettare certificato di attribuzione CF',
    'Verificare corrispondenza con documento identità',
  ],
  tempiStimati: 'Immediato',
  costo: 'Gratuito',
  scadenza: 'Nessuna (il CF non scade)',
  note: 'La tessera sanitaria scade ma il codice fiscale rimane valido',
}

export const DOC_VISURA_CATASTALE: DocumentoWiki = {
  id: 'doc_visura_catastale',
  nome: 'Visura catastale',
  categoria: 'proprieta',
  obbligatorio: true,
  fase: 'P0',
  descrizione: 'Documento ufficiale che certifica i dati catastali dell\'immobile e l\'intestazione. Può essere storica (con tutti i passaggi di proprietà) o attuale.',
  procedura: [
    'Accedere al sito dell\'Agenzia delle Entrate (Sister) o tramite SPID',
    'Inserire i dati catastali: Foglio, Mappale/Particella, Subalterno',
    'Scaricare visura per immobile o per soggetto',
    'Verificare che l\'intestatario corrisponda al proprietario dichiarato',
    'Controllare la categoria catastale (A/2, A/3, ecc.)',
  ],
  tempiStimati: '5-10 minuti online',
  costo: 'Gratuito online per i proprietari, €1.35 per visura attuale, €5.40 per storica',
  scadenza: 'Consigliato aggiornamento annuale',
  linkUtili: [
    { label: 'Agenzia Entrate - Visure', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/visura-catastale' },
  ],
  note: 'La visura storica è utile per verificare eventuali passaggi di proprietà recenti',
}

export const DOC_PLANIMETRIA_CATASTALE: DocumentoWiki = {
  id: 'doc_planimetria_catastale',
  nome: 'Planimetria catastale',
  categoria: 'proprieta',
  obbligatorio: true,
  fase: 'P0',
  descrizione: 'Rappresentazione grafica dell\'unità immobiliare depositata al Catasto. Mostra la disposizione degli ambienti e le dimensioni.',
  procedura: [
    'Accedere al sito dell\'Agenzia delle Entrate con SPID/CIE',
    'Richiedere planimetria per l\'immobile specifico',
    'Verificare che corrisponda allo stato attuale dell\'immobile',
    'Se ci sono difformità, segnalare al proprietario la necessità di aggiornamento',
  ],
  tempiStimati: '5-10 minuti online',
  costo: 'Gratuito per il proprietario',
  scadenza: 'Nessuna, ma deve corrispondere allo stato di fatto',
  linkUtili: [
    { label: 'Agenzia Entrate - Planimetrie', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/consultazione-planimetrie-catastali' },
  ],
  note: 'Difformità tra planimetria e stato di fatto possono causare problemi con la SCIA',
  documentiCorrelati: ['doc_visura_catastale'],
}

// ============================================================================
// DOCUMENTI FASE P1 - ONBOARDING
// ============================================================================

export const DOC_ATTO_PROPRIETA: DocumentoWiki = {
  id: 'doc_atto_proprieta',
  nome: 'Atto di proprietà o contratto locazione',
  categoria: 'proprieta',
  obbligatorio: true,
  fase: 'P1',
  descrizione: 'Documento che attesta il titolo di possesso dell\'immobile. Può essere l\'atto notarile di compravendita, donazione, successione, oppure un contratto di locazione con autorizzazione alla sublocazione.',
  procedura: [
    'Richiedere copia dell\'atto notarile di acquisto/donazione/successione',
    'Se in affitto: richiedere contratto di locazione registrato',
    'Verificare presenza di clausola che autorizza la sublocazione turistica',
    'In assenza di autorizzazione, richiedere lettera di consenso dal proprietario',
    'Verificare che non ci siano vincoli o ipoteche che impediscano l\'attività',
  ],
  tempiStimati: '1-7 giorni',
  costo: 'Gratuito (copia già in possesso del proprietario)',
  scadenza: 'Nessuna',
  note: 'Per immobili in affitto, la sublocazione deve essere espressamente autorizzata',
  documentiCorrelati: ['doc_visura_catastale'],
}

export const DOC_APE: DocumentoWiki = {
  id: 'doc_ape',
  nome: 'APE (Attestato Prestazione Energetica)',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P1',
  descrizione: 'Certificato che attesta la classe energetica dell\'immobile. Obbligatorio per legge per locazioni e pubblicità immobiliare.',
  procedura: [
    'Verificare se esiste già un APE valido (consultare catasto energetico regionale)',
    'Se assente o scaduto, contattare un tecnico certificatore abilitato',
    'Il tecnico effettuerà un sopralluogo per rilevare le caratteristiche energetiche',
    'Ricevere l\'APE con codice identificativo univoco',
    'Conservare sia il PDF che il codice per gli annunci',
  ],
  tempiStimati: '3-7 giorni lavorativi',
  costo: '€100-250 a seconda della zona e dimensione immobile',
  scadenza: '10 anni dalla data di rilascio',
  linkUtili: [
    { label: 'ENEA - APE', url: 'https://www.efficienzaenergetica.enea.it/glossario/attestato-di-prestazione-energetica-ape.html' },
  ],
  note: 'La classe energetica deve essere indicata negli annunci pubblicitari',
}

export const DOC_CONTRATTO_GESTIONE: DocumentoWiki = {
  id: 'doc_contratto_gestione',
  nome: 'Contratto di gestione firmato',
  categoria: 'contratti',
  obbligatorio: true,
  fase: 'P1',
  descrizione: 'Contratto tra il Property Manager e il proprietario che definisce i termini della gestione dell\'immobile per affitti brevi.',
  procedura: [
    'Preparare il contratto con i dati del proprietario e dell\'immobile',
    'Definire: commissione, durata, servizi inclusi, responsabilità',
    'Inviare bozza per revisione al proprietario',
    'Procedere alla firma (digitale o cartacea)',
    'Registrare il contratto se necessario (consulta commercialista)',
  ],
  tempiStimati: '1-5 giorni',
  costo: 'Variabile (marca da bollo €16 se cartaceo)',
  scadenza: 'Secondo i termini del contratto',
  note: 'Includere sempre clausole su: recesso, responsabilità danni, assicurazione',
}

export const DOC_DELEGA_OPERATIVA: DocumentoWiki = {
  id: 'doc_delega_operativa',
  nome: 'Delega operativa',
  categoria: 'contratti',
  obbligatorio: true,
  fase: 'P1',
  descrizione: 'Documento con cui il proprietario autorizza il Property Manager a svolgere pratiche burocratiche per suo conto (SCIA, CIR, CIN, ecc.).',
  procedura: [
    'Preparare modulo di delega con dati proprietario e PM',
    'Specificare le pratiche delegate: SCIA, CIR, CIN, Alloggiati, ISTAT',
    'Allegare copia documento identità del proprietario',
    'Far firmare in originale o con firma digitale',
    'Conservare per presentazione agli enti',
  ],
  tempiStimati: '1-2 giorni',
  costo: 'Gratuito',
  scadenza: 'Secondo i termini indicati (consigliato: durata del contratto)',
  note: 'Alcuni Comuni richiedono delega specifica per ogni pratica',
}

export const DOC_PRIVACY_GDPR: DocumentoWiki = {
  id: 'doc_privacy_gdpr',
  nome: 'Modulo privacy GDPR firmato',
  categoria: 'contratti',
  obbligatorio: true,
  fase: 'P1',
  descrizione: 'Informativa e consenso al trattamento dei dati personali secondo il Regolamento GDPR.',
  procedura: [
    'Preparare informativa privacy conforme al GDPR',
    'Includere: finalità, base giuridica, durata conservazione, diritti',
    'Far firmare il consenso al proprietario',
    'Conservare prova del consenso',
  ],
  tempiStimati: 'Immediato',
  costo: 'Gratuito',
  scadenza: 'Valido fino a revoca',
  note: 'Aggiornare l\'informativa se cambiano le modalità di trattamento',
}

export const DOC_COORDINATE_BANCARIE: DocumentoWiki = {
  id: 'doc_coordinate_bancarie',
  nome: 'Coordinate bancarie proprietario',
  categoria: 'fiscale',
  obbligatorio: true,
  fase: 'P1',
  descrizione: 'IBAN del conto corrente su cui accreditare i compensi del proprietario.',
  procedura: [
    'Richiedere IBAN completo al proprietario',
    'Verificare che sia intestato al proprietario o cointestato',
    'Richiedere documento che attesti la titolarità (estratto conto o certificato)',
    'Salvare in modo sicuro rispettando il GDPR',
  ],
  tempiStimati: 'Immediato',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  note: 'Aggiornare in caso di cambio conto',
}

export const DOC_REGOLAMENTO_CONDOMINIALE: DocumentoWiki = {
  id: 'doc_regolamento_condominiale',
  nome: 'Regolamento condominiale',
  categoria: 'proprieta',
  obbligatorio: false,
  fase: 'P1',
  descrizione: 'Documento che regola la vita condominiale. Importante verificare che non vieti espressamente gli affitti brevi.',
  procedura: [
    'Richiedere copia del regolamento all\'amministratore di condominio',
    'Verificare assenza di divieti espliciti per locazioni turistiche',
    'Controllare eventuali limitazioni su orari, rumori, accessi',
    'Se presente divieto: valutare con avvocato o rinunciare',
  ],
  tempiStimati: '1-7 giorni',
  costo: 'Gratuito o piccolo rimborso all\'amministratore',
  scadenza: 'Verificare aggiornamenti periodici',
  note: 'Solo i regolamenti "contrattuali" (approvati all\'unanimità) possono vietare gli affitti brevi',
}

// ============================================================================
// DOCUMENTI FASE P2 - SETUP LEGALE
// ============================================================================

export const DOC_SCIA: DocumentoWiki = {
  id: 'doc_scia',
  nome: 'SCIA protocollata',
  categoria: 'legale',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Segnalazione Certificata di Inizio Attività per locazione turistica. Comunicazione obbligatoria al Comune che abilita all\'attività.',
  procedura: [
    'Accedere al portale SUAP del Comune competente',
    'Compilare il modulo SCIA per "Locazione turistica" o "Casa vacanze"',
    'Allegare: documento identità, visura catastale, planimetria, APE, delega',
    'Indicare capacità ricettiva massima e periodo di attività',
    'Inviare telematicamente e conservare la ricevuta di protocollo',
    'Attendere eventuali richieste di integrazione (30-60 giorni)',
  ],
  tempiStimati: '1-2 ore per compilazione, 30-60 giorni per esito',
  costo: 'Gratuito o diritti di segreteria €20-50 a seconda del Comune',
  scadenza: 'Nessuna (salvo cessazione attività)',
  linkUtili: [
    { label: 'Impresa in un giorno - SUAP', url: 'https://www.impresainungiorno.gov.it/' },
  ],
  note: 'Ogni Comune ha modulistica specifica. Verificare i requisiti locali.',
  documentiCorrelati: ['doc_visura_catastale', 'doc_planimetria_catastale', 'doc_ape', 'doc_delega_operativa'],
}

export const DOC_RICEVUTA_SCIA: DocumentoWiki = {
  id: 'doc_ricevuta_scia',
  nome: 'Ricevuta SCIA SUAP',
  categoria: 'legale',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Ricevuta di protocollazione della SCIA rilasciata dal portale SUAP. Attesta l\'avvenuta presentazione.',
  procedura: [
    'Scaricare la ricevuta automatica dal portale SUAP dopo l\'invio',
    'Verificare che contenga numero di protocollo e data',
    'Conservare come prova di avvio attività',
  ],
  tempiStimati: 'Immediato dopo invio SCIA',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  documentiCorrelati: ['doc_scia'],
}

export const DOC_CIR: DocumentoWiki = {
  id: 'doc_cir',
  nome: 'CIR - Codice Identificativo Regionale',
  categoria: 'legale',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Codice univoco assegnato dalla Regione che identifica la struttura ricettiva. Obbligatorio da esporre negli annunci.',
  procedura: [
    'Accedere al portale regionale per le strutture ricettive',
    'Registrare la struttura con i dati della SCIA',
    'Caricare documentazione richiesta (varia per regione)',
    'Attendere rilascio del codice CIR',
    'Annotare il codice e inserirlo in tutti gli annunci',
  ],
  tempiStimati: '7-30 giorni a seconda della Regione',
  costo: 'Gratuito nella maggior parte delle Regioni',
  scadenza: 'Nessuna (legato alla SCIA)',
  note: 'Ogni Regione ha un proprio portale e procedura. Lombardia: ROSS1000, Lazio: Radar, ecc.',
  documentiCorrelati: ['doc_scia'],
}

export const DOC_CERTIFICATO_CIR: DocumentoWiki = {
  id: 'doc_certificato_cir',
  nome: 'Certificato CIR',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Documento ufficiale che attesta l\'assegnazione del Codice Identificativo Regionale.',
  procedura: [
    'Scaricare dal portale regionale dopo l\'approvazione',
    'Verificare correttezza dei dati',
    'Conservare e stampare per eventuali controlli',
  ],
  tempiStimati: 'Immediato dopo approvazione CIR',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  documentiCorrelati: ['doc_cir'],
}

export const DOC_CIN: DocumentoWiki = {
  id: 'doc_cin',
  nome: 'CIN - Codice Identificativo Nazionale',
  categoria: 'legale',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Codice univoco nazionale introdotto dal DL 145/2023. Obbligatorio per tutte le strutture ricettive e locazioni turistiche dal 2024.',
  procedura: [
    'Accedere alla BDSR (Banca Dati Strutture Ricettive) del Ministero del Turismo',
    'Autenticarsi con SPID/CIE',
    'Verificare se la struttura è già presente (importata da CIR regionale)',
    'Se non presente, inserire manualmente i dati',
    'Attendere verifica e rilascio del CIN',
    'Esporre il CIN all\'esterno dell\'immobile e in tutti gli annunci',
  ],
  tempiStimati: '7-30 giorni',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  linkUtili: [
    { label: 'BDSR - Ministero Turismo', url: 'https://bdsr.ministeroturismo.gov.it/' },
  ],
  note: 'Dal 2024 è obbligatorio esporre fisicamente il CIN con targhetta visibile dall\'esterno',
  documentiCorrelati: ['doc_cir', 'doc_scia'],
}

export const DOC_CERTIFICATO_CIN: DocumentoWiki = {
  id: 'doc_certificato_cin',
  nome: 'Certificato CIN',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Attestato ufficiale di rilascio del Codice Identificativo Nazionale dalla BDSR.',
  procedura: [
    'Scaricare dalla BDSR dopo il rilascio del CIN',
    'Verificare correttezza dati',
    'Conservare per eventuali controlli',
  ],
  tempiStimati: 'Immediato dopo rilascio CIN',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  documentiCorrelati: ['doc_cin'],
}

export const DOC_ROSS1000: DocumentoWiki = {
  id: 'doc_ross1000',
  nome: 'Abilitazione ROSS 1000',
  categoria: 'operativo',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Abilitazione al portale Alloggiati Web della Polizia di Stato per la schedatura degli ospiti. In Lombardia si chiama ROSS1000.',
  procedura: [
    'Richiedere credenziali alla Questura competente',
    'Compilare modulo di richiesta con dati struttura e gestore',
    'Allegare copia SCIA e documento identità',
    'Attendere rilascio credenziali via PEC',
    'Accedere al portale e configurare la struttura',
  ],
  tempiStimati: '15-30 giorni',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  linkUtili: [
    { label: 'Alloggiati Web', url: 'https://alloggiatiweb.poliziadistato.it/' },
  ],
  note: 'È obbligatorio comunicare gli ospiti entro 24 ore dall\'arrivo',
  documentiCorrelati: ['doc_scia'],
}

export const DOC_REGISTRAZIONE_ALLOGGIATI: DocumentoWiki = {
  id: 'doc_registrazione_alloggiati',
  nome: 'Registrazione Alloggiati Web',
  categoria: 'operativo',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Conferma dell\'avvenuta registrazione della struttura sul portale Alloggiati Web.',
  procedura: [
    'Dopo aver ricevuto le credenziali, accedere al portale',
    'Completare la registrazione della struttura',
    'Salvare screenshot o stampa della conferma',
  ],
  tempiStimati: '30 minuti',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  documentiCorrelati: ['doc_ross1000'],
}

export const DOC_ISTAT: DocumentoWiki = {
  id: 'doc_istat',
  nome: 'Registrazione ISTAT iniziale',
  categoria: 'operativo',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Registrazione presso il sistema regionale/provinciale per le comunicazioni statistiche ISTAT sui flussi turistici.',
  procedura: [
    'Accedere al portale turistico regionale/provinciale',
    'Registrare la struttura nel sistema ISTAT',
    'Configurare modalità di invio dati (manuale o automatico)',
    'Salvare conferma di registrazione',
  ],
  tempiStimati: '1-2 ore',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  note: 'Le comunicazioni ISTAT sono obbligatorie mensilmente',
  documentiCorrelati: ['doc_cir'],
}

export const DOC_CONFORMITA_ELETTRICO: DocumentoWiki = {
  id: 'doc_conformita_elettrico',
  nome: 'Certificato conformità impianto elettrico',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P2',
  descrizione: 'Dichiarazione di Conformità (DiCo) dell\'impianto elettrico rilasciata da elettricista abilitato. Attesta la sicurezza dell\'impianto.',
  procedura: [
    'Verificare se esiste già una DiCo valida',
    'Se assente: contattare elettricista abilitato per verifica impianto',
    'Se l\'impianto è conforme, rilascerà la DiCo',
    'Se non conforme, eseguire lavori di adeguamento',
    'Conservare originale e copia digitale',
  ],
  tempiStimati: '1-7 giorni',
  costo: '€100-300 per verifica e rilascio, lavori a parte',
  scadenza: 'Nessuna se l\'impianto non viene modificato',
  note: 'Per impianti ante 1990 senza DiCo, si può usare la DiRi (Dichiarazione di Rispondenza)',
}

export const DOC_CONFORMITA_GAS: DocumentoWiki = {
  id: 'doc_conformita_gas',
  nome: 'Certificato conformità impianto gas',
  categoria: 'certificazioni',
  obbligatorio: false,
  fase: 'P2',
  descrizione: 'Dichiarazione di Conformità dell\'impianto gas (caldaia, piano cottura). Richiesto solo se presente impianto gas.',
  procedura: [
    'Verificare presenza di impianto gas nell\'immobile',
    'Se presente, verificare esistenza DiCo',
    'Se assente: contattare tecnico abilitato per verifica',
    'Eseguire eventuali adeguamenti necessari',
    'Conservare certificato',
  ],
  tempiStimati: '1-7 giorni',
  costo: '€100-300',
  scadenza: 'Nessuna se l\'impianto non viene modificato',
  note: 'Obbligatoria anche la manutenzione periodica della caldaia con libretto impianto',
}

// ============================================================================
// DOCUMENTI FASE P3 - SETUP OPERATIVO
// ============================================================================

export const DOC_FOTO_PROFESSIONALI: DocumentoWiki = {
  id: 'doc_foto_professionali',
  nome: 'Foto professionali immobile',
  categoria: 'operativo',
  obbligatorio: true,
  fase: 'P3',
  descrizione: 'Servizio fotografico professionale dell\'immobile per gli annunci sulle OTA (Airbnb, Booking, ecc.).',
  procedura: [
    'Verificare che l\'immobile sia completamente allestito',
    'Prenotare fotografo specializzato in immobili/hospitality',
    'Preparare l\'immobile: pulizia, illuminazione, staging',
    'Effettuare shooting (consigliato: luce naturale, obiettivo grandangolare)',
    'Selezionare le migliori 20-30 foto',
    'Post-produzione leggera (luminosità, colori)',
  ],
  tempiStimati: '2-4 ore shooting + 2-5 giorni post-produzione',
  costo: '€150-400',
  scadenza: 'Aggiornare se cambiano arredi significativi',
  note: 'Foto di qualità aumentano significativamente le prenotazioni e il prezzo medio',
}

export const DOC_FOTO_DRONE: DocumentoWiki = {
  id: 'doc_foto_drone',
  nome: 'Foto drone/esterni',
  categoria: 'operativo',
  obbligatorio: false,
  fase: 'P3',
  descrizione: 'Riprese aeree con drone per mostrare esterni, giardino, vista panoramica. Particolarmente utili per ville e proprietà con spazi esterni.',
  procedura: [
    'Verificare se la zona permette voli drone (no-fly zones)',
    'Contattare operatore drone con licenza ENAC',
    'Pianificare shooting con meteo favorevole',
    'Includere: vista aerea, giardino, piscina, dintorni',
  ],
  tempiStimati: '1-2 ore',
  costo: '€100-250 aggiuntivi',
  scadenza: 'Nessuna',
  note: 'Molto efficaci per proprietà rurali, ville con piscina, case con vista',
}

export const DOC_WELCOME_BOOK: DocumentoWiki = {
  id: 'doc_welcome_book',
  nome: 'Welcome Book digitale',
  categoria: 'operativo',
  obbligatorio: true,
  fase: 'P3',
  descrizione: 'Guida digitale per gli ospiti con tutte le informazioni utili sulla casa e la zona.',
  procedura: [
    'Creare documento con: istruzioni casa, WiFi, check-in/out, regole',
    'Aggiungere: contatti emergenza, PM, proprietario',
    'Includere: info zona, ristoranti, attrazioni, trasporti',
    'Formattare in modo chiaro e accattivante',
    'Creare versione PDF e/o link web',
    'Inviare agli ospiti prima dell\'arrivo',
  ],
  tempiStimati: '2-4 ore',
  costo: 'Gratuito (tempo interno) o €50-100 se esternalizzato',
  scadenza: 'Aggiornare periodicamente',
  note: 'Può essere creato con Canva, Notion, o piattaforme dedicate come Hostfully',
}

export const DOC_INVENTARIO: DocumentoWiki = {
  id: 'doc_inventario',
  nome: 'Inventario arredi e dotazioni',
  categoria: 'operativo',
  obbligatorio: true,
  fase: 'P3',
  descrizione: 'Elenco dettagliato di tutti gli arredi, elettrodomestici e dotazioni presenti nell\'immobile.',
  procedura: [
    'Effettuare sopralluogo dettagliato',
    'Elencare ogni elemento per stanza',
    'Fotografare elementi di valore',
    'Indicare marca/modello degli elettrodomestici',
    'Annotare condizioni generali',
    'Far firmare al proprietario per accettazione',
  ],
  tempiStimati: '1-2 ore',
  costo: 'Gratuito',
  scadenza: 'Aggiornare ad ogni modifica significativa',
  note: 'Utile per: assicurazione, contestazioni danni, fine rapporto',
}

export const DOC_ISTRUZIONI_ELETTRODOMESTICI: DocumentoWiki = {
  id: 'doc_istruzioni_elettrodomestici',
  nome: 'Istruzioni elettrodomestici',
  categoria: 'operativo',
  obbligatorio: false,
  fase: 'P3',
  descrizione: 'Manuali e guide rapide per l\'utilizzo degli elettrodomestici presenti.',
  procedura: [
    'Raccogliere manuali originali degli elettrodomestici',
    'Creare guide rapide semplificate per ospiti stranieri',
    'Includere in Welcome Book o lasciare in casa',
  ],
  tempiStimati: '1-2 ore',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  note: 'Particolarmente utili per: lavatrice, lavastoviglie, TV, climatizzatore',
}

export const DOC_CONTRATTO_PULIZIE: DocumentoWiki = {
  id: 'doc_contratto_pulizie',
  nome: 'Contratto pulizie',
  categoria: 'contratti',
  obbligatorio: false,
  fase: 'P3',
  descrizione: 'Accordo con impresa o addetto alle pulizie per il servizio di cleaning tra un ospite e l\'altro.',
  procedura: [
    'Identificare fornitore affidabile (impresa o freelance)',
    'Definire: frequenza, checklist, tariffe, tempistiche',
    'Formalizzare accordo scritto',
    'Condividere calendario prenotazioni',
  ],
  tempiStimati: '1-3 giorni',
  costo: 'Variabile per singolo servizio',
  scadenza: 'Secondo termini contrattuali',
  note: 'Servizio critico: qualità pulizie = recensioni positive',
}

export const DOC_CONTRATTO_LAVANDERIA: DocumentoWiki = {
  id: 'doc_contratto_lavanderia',
  nome: 'Contratto lavanderia',
  categoria: 'contratti',
  obbligatorio: false,
  fase: 'P3',
  descrizione: 'Accordo con lavanderia per il servizio di lavaggio biancheria (lenzuola, asciugamani).',
  procedura: [
    'Identificare lavanderia affidabile nella zona',
    'Definire: quantità set biancheria, tempistiche ritiro/consegna, tariffe',
    'Valutare: noleggio biancheria vs proprietà',
    'Formalizzare accordo scritto',
  ],
  tempiStimati: '1-3 giorni',
  costo: 'Variabile (€5-15 per set completo)',
  scadenza: 'Secondo termini contrattuali',
}

export const DOC_TARGHETTA_CIN: DocumentoWiki = {
  id: 'doc_targhetta_cin',
  nome: 'Targhetta CIN esposta',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P3',
  descrizione: 'Foto che documenta l\'esposizione della targhetta con il CIN all\'esterno dell\'immobile, come richiesto dalla normativa.',
  procedura: [
    'Ordinare targhetta con CIN (dimensioni minime previste dalla legge)',
    'Installare in posizione visibile dall\'esterno (portone, citofono)',
    'Fotografare la targhetta installata',
    'Conservare foto come prova di adempimento',
  ],
  tempiStimati: '1-7 giorni (ordine targhetta) + 30 min installazione',
  costo: '€10-30 per la targhetta',
  scadenza: 'Nessuna',
  note: 'Dal 2024 la targhetta CIN esterna è obbligatoria per legge',
  documentiCorrelati: ['doc_cin'],
}

export const DOC_ESTINTORE: DocumentoWiki = {
  id: 'doc_estintore',
  nome: 'Estintore certificato',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P3',
  descrizione: 'Estintore a norma presente nell\'immobile con certificato di revisione valido.',
  procedura: [
    'Acquistare estintore a polvere o CO2 (minimo 2 kg)',
    'Posizionare in punto accessibile e segnalato',
    'Far revisionare ogni 6 mesi da tecnico abilitato',
    'Conservare certificato di revisione',
    'Inserire data prossima revisione nel Welcome Book',
  ],
  tempiStimati: 'Immediato (acquisto) + revisione periodica',
  costo: '€30-60 acquisto, €15-30 revisione semestrale',
  scadenza: 'Revisione ogni 6 mesi',
  note: 'Obbligatorio per strutture ricettive secondo norme antincendio',
}

export const DOC_RILEVATORE_GAS: DocumentoWiki = {
  id: 'doc_rilevatore_gas',
  nome: 'Rilevatore gas/fumo',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P3',
  descrizione: 'Dispositivi di sicurezza per rilevazione fughe gas e/o fumo installati nell\'immobile.',
  procedura: [
    'Installare rilevatore fumo in corridoio/zona notte',
    'Se presente gas: installare rilevatore gas in cucina',
    'Verificare funzionamento periodicamente',
    'Sostituire batterie secondo indicazioni produttore',
    'Documentare con foto l\'installazione',
  ],
  tempiStimati: '1 ora',
  costo: '€20-50 per dispositivo',
  scadenza: 'Batterie ogni 1-2 anni, dispositivo ogni 5-10 anni',
  note: 'Sensori interconnessi WiFi permettono notifiche su smartphone',
}

// ============================================================================
// DOCUMENTI FASE P4 - OPERATIVA
// ============================================================================

export const DOC_POLIZZA_RC: DocumentoWiki = {
  id: 'doc_polizza_rc',
  nome: 'Polizza assicurativa RC',
  categoria: 'certificazioni',
  obbligatorio: true,
  fase: 'P4',
  descrizione: 'Assicurazione Responsabilità Civile verso terzi (ospiti) per danni a persone o cose durante il soggiorno.',
  procedura: [
    'Contattare broker/compagnia assicurativa',
    'Richiedere polizza specifica per locazioni turistiche/B&B',
    'Verificare massimali adeguati (consigliato: €500.000+)',
    'Includere: danni a ospiti, RC prodotti, tutela legale',
    'Pagare premio e conservare polizza',
  ],
  tempiStimati: '3-7 giorni',
  costo: '€150-400/anno a seconda dei massimali',
  scadenza: 'Annuale - rinnovare alla scadenza',
  note: 'Alcune OTA offrono coperture aggiuntive (es. AirCover di Airbnb)',
}

export const DOC_POLIZZA_DANNI: DocumentoWiki = {
  id: 'doc_polizza_danni',
  nome: 'Polizza danni immobile',
  categoria: 'certificazioni',
  obbligatorio: false,
  fase: 'P4',
  descrizione: 'Assicurazione per danni all\'immobile e al contenuto causati da ospiti o eventi.',
  procedura: [
    'Verificare se polizza casa del proprietario copre locazioni turistiche',
    'Se non coperta, integrare o stipulare polizza dedicata',
    'Includere: danni da ospiti, furto, incendio, allagamento',
    'Valutare franchigie e massimali',
  ],
  tempiStimati: '3-7 giorni',
  costo: '€200-500/anno',
  scadenza: 'Annuale',
  note: 'Può essere inclusa nella polizza RC o separata',
}

export const DOC_VERBALE_CHIAVI: DocumentoWiki = {
  id: 'doc_verbale_chiavi',
  nome: 'Verbale consegna chiavi',
  categoria: 'operativo',
  obbligatorio: false,
  fase: 'P4',
  descrizione: 'Documento che attesta la consegna delle chiavi dell\'immobile dal proprietario al Property Manager.',
  procedura: [
    'Preparare verbale con elenco chiavi consegnate',
    'Specificare: chiavi portone, appartamento, cantina, garage',
    'Indicare numero di copie per tipo',
    'Far firmare a entrambe le parti',
    'Conservare copia per ciascuno',
  ],
  tempiStimati: '15 minuti',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  note: 'Utile per tracciare responsabilità e gestione accessi',
}

export const DOC_REGISTRO_MANUTENZIONI: DocumentoWiki = {
  id: 'doc_registro_manutenzioni',
  nome: 'Registro manutenzioni',
  categoria: 'operativo',
  obbligatorio: false,
  fase: 'P4',
  descrizione: 'Registro degli interventi di manutenzione ordinaria e straordinaria effettuati sull\'immobile.',
  procedura: [
    'Creare documento/foglio per tracciare interventi',
    'Registrare: data, tipo intervento, fornitore, costo',
    'Allegare fatture/ricevute',
    'Aggiornare dopo ogni intervento',
  ],
  tempiStimati: 'Ongoing',
  costo: 'Gratuito',
  scadenza: 'Nessuna',
  note: 'Utile per: pianificazione manutenzioni, rendicontazione al proprietario, storico immobile',
}

// ============================================================================
// DOCUMENTI FASE P5 - CESSATA
// ============================================================================

export const DOC_VERBALE_RICONSEGNA: DocumentoWiki = {
  id: 'doc_verbale_riconsegna',
  nome: 'Verbale riconsegna immobile',
  categoria: 'operativo',
  obbligatorio: true,
  fase: 'P5',
  descrizione: 'Documento che attesta la riconsegna dell\'immobile dal Property Manager al proprietario alla fine del rapporto.',
  procedura: [
    'Effettuare sopralluogo congiunto con proprietario',
    'Confrontare stato attuale con inventario iniziale',
    'Documentare eventuali danni o mancanze',
    'Restituire tutte le chiavi',
    'Far firmare verbale a entrambe le parti',
  ],
  tempiStimati: '1-2 ore',
  costo: 'Gratuito',
  scadenza: 'Alla fine del rapporto',
  documentiCorrelati: ['doc_inventario', 'doc_verbale_chiavi'],
}

export const DOC_CHIUSURA_SCIA: DocumentoWiki = {
  id: 'doc_chiusura_scia',
  nome: 'Chiusura SCIA',
  categoria: 'legale',
  obbligatorio: true,
  fase: 'P5',
  descrizione: 'Comunicazione al SUAP della cessazione dell\'attività di locazione turistica.',
  procedura: [
    'Accedere al portale SUAP del Comune',
    'Presentare comunicazione di cessazione attività',
    'Indicare data effettiva di cessazione',
    'Conservare ricevuta di protocollazione',
  ],
  tempiStimati: '30 minuti',
  costo: 'Gratuito',
  scadenza: 'Entro 30 giorni dalla cessazione',
  note: 'Comunicare anche al portale regionale per chiusura CIR',
  documentiCorrelati: ['doc_scia'],
}

export const DOC_RENDICONTO_FINALE: DocumentoWiki = {
  id: 'doc_rendiconto_finale',
  nome: 'Rendiconto finale',
  categoria: 'fiscale',
  obbligatorio: true,
  fase: 'P5',
  descrizione: 'Documento contabile finale con riepilogo di tutti i movimenti economici del rapporto.',
  procedura: [
    'Calcolare tutte le prenotazioni gestite',
    'Riepilogare incassi e commissioni',
    'Includere eventuali spese sostenute',
    'Calcolare saldo finale da versare/recuperare',
    'Far approvare e firmare al proprietario',
  ],
  tempiStimati: '2-4 ore',
  costo: 'Gratuito',
  scadenza: 'Alla chiusura del rapporto',
}

export const DOC_DISDETTA_CONTRATTO: DocumentoWiki = {
  id: 'doc_disdetta_contratto',
  nome: 'Disdetta contratto gestione',
  categoria: 'contratti',
  obbligatorio: true,
  fase: 'P5',
  descrizione: 'Comunicazione formale di recesso dal contratto di gestione, da parte del PM o del proprietario.',
  procedura: [
    'Verificare termini di preavviso nel contratto',
    'Inviare comunicazione scritta (raccomandata o PEC)',
    'Indicare data effettiva di cessazione',
    'Concordare modalità di transizione',
  ],
  tempiStimati: '1 giorno',
  costo: 'Costo raccomandata/PEC',
  scadenza: 'Secondo termini contrattuali',
  documentiCorrelati: ['doc_contratto_gestione'],
}

// ============================================================================
// EXPORT AGGREGATO
// ============================================================================

export const DOCUMENTI_WIKI: DocumentoWiki[] = [
  // P0
  DOC_IDENTITA_PROPRIETARIO,
  DOC_CODICE_FISCALE,
  DOC_VISURA_CATASTALE,
  DOC_PLANIMETRIA_CATASTALE,
  // P1
  DOC_ATTO_PROPRIETA,
  DOC_APE,
  DOC_CONTRATTO_GESTIONE,
  DOC_DELEGA_OPERATIVA,
  DOC_PRIVACY_GDPR,
  DOC_COORDINATE_BANCARIE,
  DOC_REGOLAMENTO_CONDOMINIALE,
  // P2
  DOC_SCIA,
  DOC_RICEVUTA_SCIA,
  DOC_CIR,
  DOC_CERTIFICATO_CIR,
  DOC_CIN,
  DOC_CERTIFICATO_CIN,
  DOC_ROSS1000,
  DOC_REGISTRAZIONE_ALLOGGIATI,
  DOC_ISTAT,
  DOC_CONFORMITA_ELETTRICO,
  DOC_CONFORMITA_GAS,
  // P3
  DOC_FOTO_PROFESSIONALI,
  DOC_FOTO_DRONE,
  DOC_WELCOME_BOOK,
  DOC_INVENTARIO,
  DOC_ISTRUZIONI_ELETTRODOMESTICI,
  DOC_CONTRATTO_PULIZIE,
  DOC_CONTRATTO_LAVANDERIA,
  DOC_TARGHETTA_CIN,
  DOC_ESTINTORE,
  DOC_RILEVATORE_GAS,
  // P4
  DOC_POLIZZA_RC,
  DOC_POLIZZA_DANNI,
  DOC_VERBALE_CHIAVI,
  DOC_REGISTRO_MANUTENZIONI,
  // P5
  DOC_VERBALE_RICONSEGNA,
  DOC_CHIUSURA_SCIA,
  DOC_RENDICONTO_FINALE,
  DOC_DISDETTA_CONTRATTO,
]

// Helper: ottieni documento wiki per nome
export function getDocumentoWikiByNome(nome: string): DocumentoWiki | undefined {
  const normalizza = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  return DOCUMENTI_WIKI.find(d => normalizza(d.nome) === normalizza(nome))
}

// Helper: ottieni documenti wiki per fase
export function getDocumentiWikiByFase(fase: string): DocumentoWiki[] {
  return DOCUMENTI_WIKI.filter(d => d.fase === fase)
}

// Helper: ottieni documenti wiki obbligatori per fase
export function getDocumentiObbligatoriByFase(fase: string): DocumentoWiki[] {
  return DOCUMENTI_WIKI.filter(d => d.fase === fase && d.obbligatorio)
}

// Statistiche per fase
export const STATS_DOCUMENTI_PER_FASE = {
  P0: { totale: 4, obbligatori: 4 },
  P1: { totale: 7, obbligatori: 6 },
  P2: { totale: 11, obbligatori: 10 },
  P3: { totale: 10, obbligatori: 6 },
  P4: { totale: 4, obbligatori: 1 },
  P5: { totale: 4, obbligatori: 4 },
}
