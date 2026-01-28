'use client'

import { BLOCCHI_TEMPLATE } from '@/constants'

interface PreviewDynamicBlockProps {
    blockType: string
    config: Record<string, unknown>
    resolvedData?: Record<string, unknown>
}

// Map blocchi per accesso rapido
const BLOCK_MAP = BLOCCHI_TEMPLATE.reduce((acc, block) => {
    acc[block.id] = block
    return acc
}, {} as Record<string, typeof BLOCCHI_TEMPLATE[number]>)

// Fallback examples when no real data
const FALLBACK = {
    header: { nome: 'Property Manager Srl', indirizzo: 'Via Roma 1, 20100 Milano', email: 'info@pm.it', telefono: '+39 02 1234567', piva: '12345678901', logoUrl: '' },
    cliente: { nome: 'Mario Rossi', indirizzo: 'Via Lago 5, 22017 Menaggio (CO)', email: 'mario@example.com', telefono: '+39 333 1234567', cf: 'RSSMRA80A01F205X', piva: '' },
    proprieta: { nome: 'Villa Belvedere', indirizzo: 'Via Lago 5, 22017 Menaggio (CO)', mq: '150', camere: '3', bagni: '2', maxOspiti: '6', cir: '013157-CNI-00123', cin: 'IT013157A1B2C3D4E5' },
    totali: { subtotale: '€ 1.000,00', totale: '€ 1.220,00', sconto: '' },
}

function d(resolved: Record<string, unknown> | undefined, fallback: Record<string, unknown>): Record<string, unknown> {
    // If resolved data exists and has at least one non-empty value, use it
    if (resolved && Object.values(resolved).some(v => v != null && v !== '')) {
        return resolved
    }
    return fallback
}

function renderBlockContent(blockType: string, config: Record<string, unknown>, resolvedData?: Record<string, unknown>): React.ReactNode {
    switch (blockType) {
        case 'header': {
            const data = d(resolvedData, FALLBACK.header)
            const isFallback = !resolvedData || !Object.values(resolvedData).some(v => v != null && v !== '')
            const cls = isFallback ? 'text-amber-600' : ''
            return (
                <div className="mb-6">
                    <div className="flex items-start gap-4">
                        {config.showLogo !== false && (
                            data.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={data.logoUrl as string} alt="Logo" className="w-16 h-16 object-contain" />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs border">LOGO</div>
                            )
                        )}
                        <div>
                            <div className={`text-xl font-bold text-gray-900 ${cls}`}>{data.nome as string}</div>
                            {config.showAddress !== false && <div className={`text-gray-600 ${cls}`}>{data.indirizzo as string}</div>}
                            {config.showContacts !== false && (
                                <div className={`text-gray-500 text-sm mt-1 ${cls}`}>
                                    {[data.email as string, data.telefono as string].filter(Boolean).join(' • ')}
                                </div>
                            )}
                            {config.showPiva !== false && Boolean(data.piva) && (
                                <div className={`text-gray-500 text-sm ${cls}`}>P.IVA {data.piva as string}</div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        case 'cliente': {
            const data = d(resolvedData, FALLBACK.cliente)
            const isFallback = !resolvedData || !Object.values(resolvedData).some(v => v != null && v !== '')
            const cls = isFallback ? 'text-amber-600' : ''
            return (
                <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Destinatario:</div>
                    <div className={`font-semibold text-gray-900 ${cls}`}>{data.nome as string}</div>
                    {config.showAddress !== false && Boolean(data.indirizzo) && (
                        <div className={`text-gray-600 ${cls}`}>{data.indirizzo as string}</div>
                    )}
                    {config.showContacts !== false && (
                        <div className={`text-gray-500 text-sm ${cls}`}>
                            {[data.email as string, data.telefono as string].filter(Boolean).join(' • ')}
                        </div>
                    )}
                    {config.showCf !== false && Boolean(data.cf) && (
                        <div className={`text-gray-500 text-sm ${cls}`}>C.F. {data.cf as string}</div>
                    )}
                    {config.showPiva !== false && Boolean(data.piva) && (
                        <div className={`text-gray-500 text-sm ${cls}`}>P.IVA {data.piva as string}</div>
                    )}
                </div>
            )
        }

        case 'proprieta': {
            const data = d(resolvedData, FALLBACK.proprieta)
            const isFallback = !resolvedData || !Object.values(resolvedData).some(v => v != null && v !== '')
            const cls = isFallback ? 'text-amber-600' : ''
            return (
                <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Proprietà:</div>
                    <div className={`font-semibold text-gray-900 ${cls}`}>{data.nome as string}</div>
                    {config.showAddress !== false && Boolean(data.indirizzo) && (
                        <div className={`text-gray-600 ${cls}`}>{data.indirizzo as string}</div>
                    )}
                    {config.showDetails !== false && (
                        <div className={`text-gray-500 text-sm ${cls}`}>
                            {[
                                data.mq ? `${data.mq} mq` : null,
                                data.camere ? `${data.camere} camere` : null,
                                data.bagni ? `${data.bagni} bagni` : null,
                                data.maxOspiti ? `Max ${data.maxOspiti} ospiti` : null,
                            ].filter(Boolean).join(' • ')}
                        </div>
                    )}
                    {config.showCodes !== false && (Boolean(data.cir) || Boolean(data.cin)) && (
                        <div className={`text-gray-500 text-sm ${cls}`}>
                            {[data.cir ? `CIR: ${data.cir}` : null, data.cin ? `CIN: ${data.cin}` : null].filter(Boolean).join(' • ')}
                        </div>
                    )}
                </div>
            )
        }

        case 'serviziTabella': {
            const items = (resolvedData?.items as Array<{ nome: string; descrizione?: string | null; quantita: number; prezzo_unitario: number; prezzo_totale: number }>) || []
            const hasRealItems = items.length > 0
            const isFallback = !hasRealItems

            // Fallback items per anteprima
            const fallbackItems = [
                { nome: 'Servizio esempio 1', descrizione: 'Descrizione servizio', quantita: 1, prezzo_unitario: 500, prezzo_totale: 500 },
                { nome: 'Servizio esempio 2', descrizione: null, quantita: 2, prezzo_unitario: 150, prezzo_totale: 300 },
            ]

            const displayItems = hasRealItems ? items : fallbackItems

            const formatPrice = (value: number) => {
                return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
            }

            return (
                <div className="my-4">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left p-3 border border-gray-200 font-semibold">Servizio</th>
                                {config.showQuantity !== false && (
                                    <th className="text-center p-3 border border-gray-200 font-semibold w-20">Qtà</th>
                                )}
                                <th className="text-right p-3 border border-gray-200 font-semibold w-28">Prezzo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, index) => (
                                <tr key={index}>
                                    <td className={`p-3 border border-gray-200 ${isFallback ? 'text-amber-600' : ''}`}>
                                        <div>{item.nome}</div>
                                        {config.showDescription !== false && item.descrizione && (
                                            <div className="text-xs text-gray-500 mt-0.5">{item.descrizione}</div>
                                        )}
                                    </td>
                                    {config.showQuantity !== false && (
                                        <td className={`text-center p-3 border border-gray-200 ${isFallback ? 'text-amber-600' : ''}`}>
                                            {item.quantita}
                                        </td>
                                    )}
                                    <td className={`text-right p-3 border border-gray-200 ${isFallback ? 'text-amber-600' : ''}`}>
                                        {formatPrice(item.prezzo_totale)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }

        case 'totali': {
            const data = d(resolvedData, FALLBACK.totali)
            const isFallback = !resolvedData || !Object.values(resolvedData).some(v => v != null && v !== '')
            const cls = isFallback ? 'text-amber-600' : ''
            return (
                <div className="my-4 ml-auto w-64">
                    {config.showSubtotale !== false && (
                        <div className={`flex justify-between py-1 text-gray-600 ${cls}`}>
                            <span>Subtotale:</span>
                            <span>{data.subtotale as string || '€ 1.000,00'}</span>
                        </div>
                    )}
                    {config.showIva !== false && (
                        <div className="flex justify-between py-1 text-gray-600">
                            <span>IVA 22%:</span>
                            <span>€ 220,00</span>
                        </div>
                    )}
                    <div className={`flex justify-between py-2 mt-1 border-t-2 border-gray-900 font-bold text-lg ${cls}`}>
                        <span>Totale:</span>
                        <span>{data.totale as string || '€ 1.220,00'}</span>
                    </div>
                </div>
            )
        }

        case 'validita': {
            const days = (config.days as number) || 30
            return (
                <div className="my-4 text-gray-600 italic">
                    Questa proposta è valida per {days} giorni dalla data di emissione.
                </div>
            )
        }

        case 'termini':
            return (
                <div className="my-4 text-sm text-gray-600 space-y-1">
                    <div className="font-semibold mb-2">Termini e Condizioni:</div>
                    <div>• I prezzi sono da intendersi IVA esclusa salvo ove diversamente specificato</div>
                    <div>• Il pagamento deve essere effettuato entro 30 giorni dalla fatturazione</div>
                    <div>• Per i servizi ricorrenti la commissione viene calcolata sul fatturato lordo</div>
                </div>
            )

        case 'firme': {
            const leftLabel = (config.leftLabel as string) || 'Il Fornitore'
            const rightLabel = (config.rightLabel as string) || 'Il Cliente'
            return (
                <div className="flex justify-between mt-12 mb-4">
                    <div className="text-center">
                        <div className="w-40 border-b border-gray-400 mb-2 h-16"></div>
                        <div className="text-sm text-gray-600">{leftLabel}</div>
                    </div>
                    <div className="text-center">
                        <div className="w-40 border-b border-gray-400 mb-2 h-16"></div>
                        <div className="text-sm text-gray-600">{rightLabel}</div>
                    </div>
                </div>
            )
        }

        case 'note': {
            const noteStyles: Record<string, string> = {
                warning: 'bg-yellow-50 border-l-4 border-yellow-400',
                info: 'bg-blue-50 border-l-4 border-blue-400',
                success: 'bg-green-50 border-l-4 border-green-400',
                error: 'bg-red-50 border-l-4 border-red-400',
            }
            const style = (config.style as string) || 'info'
            return (
                <div className={`my-4 p-4 ${noteStyles[style] || noteStyles.info}`}>
                    <div className="text-gray-700">Nota importante da compilare...</div>
                </div>
            )
        }

        case 'separatore': {
            const lineStyles: Record<string, string> = {
                solid: 'border-solid',
                dashed: 'border-dashed',
                dotted: 'border-dotted',
                double: 'border-double border-t-4',
            }
            const lineStyle = (config.style as string) || 'solid'
            return <hr className={`my-6 border-gray-300 ${lineStyles[lineStyle] || lineStyles.solid}`} />
        }

        default:
            return null
    }
}

export function PreviewDynamicBlock({ blockType, config, resolvedData }: PreviewDynamicBlockProps) {
    const blockInfo = BLOCK_MAP[blockType]

    if (!blockInfo) {
        return (
            <div className="my-3 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                Blocco non riconosciuto: {blockType}
            </div>
        )
    }

    return <>{renderBlockContent(blockType, config, resolvedData)}</>
}
