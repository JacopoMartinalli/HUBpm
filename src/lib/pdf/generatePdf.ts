import { pdf } from '@react-pdf/renderer'
import { PdfDocument } from './TipTapToPdf'
import { supabase } from '@/lib/supabase'
import type { TemplateContext } from '@/lib/services/template-resolver'

interface GeneratePdfOptions {
  content: Record<string, unknown>
  context: TemplateContext
  fileName: string
  showHeaderFooter?: boolean
}

interface GeneratePdfResult {
  blob: Blob
  url: string | null
  storagePath: string | null
}

/**
 * Genera un PDF dal contenuto TipTap e lo carica su Supabase Storage.
 * Ritorna il blob, l'URL pubblico e il path nello storage.
 */
export async function generateAndUploadPdf({
  content,
  context,
  fileName,
  showHeaderFooter = true,
}: GeneratePdfOptions): Promise<GeneratePdfResult> {
  // 1. Genera il blob PDF
  const pdfBlob = await pdf(
    PdfDocument({ content, context, showHeaderFooter })
  ).toBlob()

  // 2. Prepara il path per lo storage
  const timestamp = Date.now()
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50)
  const storagePath = `generati/${timestamp}_${sanitizedFileName}.pdf`

  // 3. Upload su Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documenti')
    .upload(storagePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    console.error('Errore upload PDF:', uploadError)
    // Ritorna comunque il blob anche se upload fallisce
    return {
      blob: pdfBlob,
      url: null,
      storagePath: null,
    }
  }

  // 4. Ottieni URL pubblico
  const { data: urlData } = supabase.storage
    .from('documenti')
    .getPublicUrl(storagePath)

  return {
    blob: pdfBlob,
    url: urlData.publicUrl,
    storagePath,
  }
}

/**
 * Genera solo il blob PDF senza upload (utile per preview/download diretto).
 */
export async function generatePdfBlob({
  content,
  context,
  showHeaderFooter = true,
}: Omit<GeneratePdfOptions, 'fileName'>): Promise<Blob> {
  return pdf(
    PdfDocument({ content, context, showHeaderFooter })
  ).toBlob()
}

/**
 * Scarica il PDF direttamente nel browser.
 */
export async function downloadPdf({
  content,
  context,
  fileName,
  showHeaderFooter = true,
}: GeneratePdfOptions): Promise<void> {
  const blob = await generatePdfBlob({ content, context, showHeaderFooter })

  // Crea link temporaneo per download
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
