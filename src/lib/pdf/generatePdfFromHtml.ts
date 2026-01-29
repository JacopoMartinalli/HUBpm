'use client'

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface GeneratePdfFromHtmlOptions {
    element: HTMLElement
    fileName: string
    /** Optional: Override the width of the PDF (in mm). Default is A4 width (210mm) */
    pdfWidth?: number
    /** Optional: Add margins (in mm). Default is 10mm */
    margin?: number
}

/**
 * Generates a PDF from an HTML element using html2canvas and jspdf.
 * This approach renders the HTML exactly as it appears on screen.
 */
export async function generatePdfFromHtml({
    element,
    fileName,
    pdfWidth = 210, // A4 width in mm
    margin = 10,
}: GeneratePdfFromHtmlOptions): Promise<void> {
    console.log('[PDF] Starting PDF generation for:', fileName)
    console.log('[PDF] Element:', element)
    console.log('[PDF] Element dimensions:', element.offsetWidth, 'x', element.offsetHeight)

    try {
        // Store original styles to restore later
        const originalStyles: { element: HTMLElement; styles: { height: string; maxHeight: string; overflow: string } }[] = []

        // Expand scrollable containers to full height for capture
        let parent: HTMLElement | null = element
        while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent)
            if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
                originalStyles.push({
                    element: parent,
                    styles: {
                        height: parent.style.height,
                        maxHeight: parent.style.maxHeight,
                        overflow: parent.style.overflow,
                    }
                })
                // Expand to full content height
                parent.style.height = 'auto'
                parent.style.maxHeight = 'none'
                parent.style.overflow = 'visible'
                console.log('[PDF] Expanded scrollable container:', parent.className)
            }
            parent = parent.parentElement
        }

        // Wait for layout to settle
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('[PDF] After expansion, element dimensions:', element.offsetWidth, 'x', element.offsetHeight)

        // Render the HTML element to a canvas
        console.log('[PDF] Running html2canvas...')
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution for better quality
            useCORS: true, // Allow cross-origin images
            logging: false,
            backgroundColor: '#ffffff',
            windowHeight: element.scrollHeight,
            height: element.scrollHeight,
        })
        console.log('[PDF] Canvas created:', canvas.width, 'x', canvas.height)

        // Restore original styles
        for (const item of originalStyles) {
            item.element.style.height = item.styles.height
            item.element.style.maxHeight = item.styles.maxHeight
            item.element.style.overflow = item.styles.overflow
        }

        // Calculate dimensions
        const imgWidth = pdfWidth - (margin * 2)
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        console.log('[PDF] Image dimensions for PDF:', imgWidth, 'x', imgHeight)

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        })
        console.log('[PDF] jsPDF instance created')

        // Get page height for multi-page support
        const pageHeight = pdf.internal.pageSize.getHeight() - (margin * 2)
        console.log('[PDF] Page height:', pageHeight)

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png')
        console.log('[PDF] Image data length:', imgData.length)

        // If content fits on one page
        if (imgHeight <= pageHeight) {
            console.log('[PDF] Content fits on one page')
            pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
        } else {
            // Multi-page support
            console.log('[PDF] Content requires multiple pages')
            let heightLeft = imgHeight
            let page = 0

            while (heightLeft > 0) {
                if (page > 0) {
                    pdf.addPage()
                }

                // Calculate the portion of the image to show on this page
                const sourceY = page * (pageHeight / imgHeight * canvas.height)
                const sourceHeight = Math.min(
                    (pageHeight / imgHeight * canvas.height),
                    canvas.height - sourceY
                )

                // Create a temporary canvas for this page slice
                const pageCanvas = document.createElement('canvas')
                pageCanvas.width = canvas.width
                pageCanvas.height = sourceHeight
                const ctx = pageCanvas.getContext('2d')

                if (ctx) {
                    ctx.drawImage(
                        canvas,
                        0, sourceY, canvas.width, sourceHeight,
                        0, 0, canvas.width, sourceHeight
                    )

                    const pageImgData = pageCanvas.toDataURL('image/png')
                    const pageImgHeight = (sourceHeight * imgWidth) / canvas.width

                    pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight)
                }

                heightLeft -= pageHeight
                page++
            }
            console.log('[PDF] Total pages:', page)
        }

        // Download the PDF
        console.log('[PDF] Saving PDF...')
        pdf.save(`${fileName}.pdf`)
        console.log('[PDF] PDF saved successfully!')
    } catch (error) {
        console.error('[PDF] Error during PDF generation:', error)
        throw error
    }
}

/**
 * Simplified wrapper that generates PDF from a ref element
 */
export async function downloadPdfFromRef(
    ref: React.RefObject<HTMLElement>,
    fileName: string
): Promise<void> {
    if (!ref.current) {
        throw new Error('Element reference is not available')
    }

    await generatePdfFromHtml({
        element: ref.current,
        fileName,
    })
}
