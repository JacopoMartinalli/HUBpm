'use client'

import { BLOCCHI_TEMPLATE } from '@/constants'

interface PreviewDynamicBlockProps {
    blockType: string
    config: Record<string, unknown>
}

// Map blocchi per accesso rapido
const BLOCK_MAP = BLOCCHI_TEMPLATE.reduce((acc, block) => {
    acc[block.id] = block
    return acc
}, {} as Record<string, typeof BLOCCHI_TEMPLATE[number]>)

// Render block content as it would appear in the final PDF
function renderBlockContent(blockType: string, config: Record<string, unknown>): React.ReactNode {
    switch (blockType) {
        case 'header':
            return (
                <div className="mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs border">
                            LOGO
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-900">Property Manager Srl</div>
                            <div className="text-gray-600">Via Roma 1, 20100 Milano</div>
                            {config.showContacts !== false && (
                                <div className="text-gray-500 text-sm mt-1">
                                    info@pm.it • +39 02 1234567
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )

        case 'cliente':
            return (
                <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Destinatario:</div>
                    <div className="font-semibold text-gray-900">Mario Rossi</div>
                    {config.showAddress !== false && (
                        <div className="text-gray-600">Via Lago 5, 22017 Menaggio (CO)</div>
                    )}
                    {config.showContacts !== false && (
                        <div className="text-gray-500 text-sm">mario@example.com • +39 333 1234567</div>
                    )}
                </div>
            )

        case 'proprieta':
            return (
                <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Proprietà:</div>
                    <div className="font-semibold text-gray-900">Villa Belvedere</div>
                    {config.showAddress !== false && (
                        <div className="text-gray-600">Via Lago 5, 22017 Menaggio (CO)</div>
                    )}
                    {config.showDetails !== false && (
                        <div className="text-gray-500 text-sm">150 mq • 3 camere • 2 bagni • Max 6 ospiti</div>
                    )}
                </div>
            )

        case 'serviziTabella':
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
                            <tr>
                                <td className="p-3 border border-gray-200">Setup Iniziale</td>
                                {config.showQuantity !== false && (
                                    <td className="text-center p-3 border border-gray-200">1</td>
                                )}
                                <td className="text-right p-3 border border-gray-200">€ 500,00</td>
                            </tr>
                            <tr>
                                <td className="p-3 border border-gray-200">Gestione Mensile</td>
                                {config.showQuantity !== false && (
                                    <td className="text-center p-3 border border-gray-200">12</td>
                                )}
                                <td className="text-right p-3 border border-gray-200">20%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )

        case 'totali':
            return (
                <div className="my-4 ml-auto w-64">
                    {config.showSubtotale !== false && (
                        <div className="flex justify-between py-1 text-gray-600">
                            <span>Subtotale:</span>
                            <span>€ 1.000,00</span>
                        </div>
                    )}
                    {config.showIva !== false && (
                        <div className="flex justify-between py-1 text-gray-600">
                            <span>IVA 22%:</span>
                            <span>€ 220,00</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 mt-1 border-t-2 border-gray-900 font-bold text-lg">
                        <span>Totale:</span>
                        <span>€ 1.220,00</span>
                    </div>
                </div>
            )

        case 'validita':
            const days = (config.days as number) || 30
            return (
                <div className="my-4 text-gray-600 italic">
                    Questa proposta è valida per {days} giorni dalla data di emissione.
                </div>
            )

        case 'termini':
            return (
                <div className="my-4 text-sm text-gray-600 space-y-1">
                    <div className="font-semibold mb-2">Termini e Condizioni:</div>
                    <div>• I prezzi sono da intendersi IVA esclusa salvo ove diversamente specificato</div>
                    <div>• Il pagamento deve essere effettuato entro 30 giorni dalla fatturazione</div>
                    <div>• Per i servizi ricorrenti la commissione viene calcolata sul fatturato lordo</div>
                </div>
            )

        case 'firme':
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

        case 'note':
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

        case 'separatore':
            const lineStyles: Record<string, string> = {
                solid: 'border-solid',
                dashed: 'border-dashed',
                dotted: 'border-dotted',
                double: 'border-double border-t-4',
            }
            const lineStyle = (config.style as string) || 'solid'
            return <hr className={`my-6 border-gray-300 ${lineStyles[lineStyle] || lineStyles.solid}`} />

        default:
            return null
    }
}

export function PreviewDynamicBlock({ blockType, config }: PreviewDynamicBlockProps) {
    const blockInfo = BLOCK_MAP[blockType]

    if (!blockInfo) {
        return (
            <div className="my-3 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                Blocco non riconosciuto: {blockType}
            </div>
        )
    }

    // Render directly as PDF content, no wrapper or placeholder styling
    return <>{renderBlockContent(blockType, config)}</>
}
