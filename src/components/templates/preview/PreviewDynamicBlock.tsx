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

// Contenuto esempio per ogni tipo di blocco
function getBlockExampleContent(blockType: string, config: Record<string, unknown>): React.ReactNode {
    switch (blockType) {
        case 'header':
            return (
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">LOGO</div>
                        <div>
                            <div className="font-bold text-gray-700">Property Manager Srl</div>
                            <div className="text-sm text-gray-500">Via Roma 1, 20100 Milano</div>
                        </div>
                    </div>
                    {config.showContacts !== false && (
                        <div className="text-xs text-gray-400">info@pm.it • +39 02 1234567</div>
                    )}
                </div>
            )

        case 'cliente':
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700">Mario Rossi</div>
                    {config.showAddress !== false && (
                        <div className="text-sm text-gray-500">Via Lago 5, 22017 Menaggio (CO)</div>
                    )}
                    {config.showContacts !== false && (
                        <div className="text-sm text-gray-500">mario@example.com • +39 333 1234567</div>
                    )}
                </div>
            )

        case 'proprieta':
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700">Villa Belvedere</div>
                    {config.showAddress !== false && (
                        <div className="text-sm text-gray-500">Via Lago 5, 22017 Menaggio (CO)</div>
                    )}
                    {config.showDetails !== false && (
                        <div className="text-sm text-gray-500">150 mq • 3 camere • 2 bagni • Max 6 ospiti</div>
                    )}
                </div>
            )

        case 'serviziTabella':
            return (
                <div className="text-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="text-left p-2 border">Servizio</th>
                                {config.showQuantity !== false && <th className="text-center p-2 border w-16">Qtà</th>}
                                <th className="text-right p-2 border w-24">Prezzo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2 border">Setup Iniziale</td>
                                {config.showQuantity !== false && <td className="text-center p-2 border">1</td>}
                                <td className="text-right p-2 border">€ 500,00</td>
                            </tr>
                            <tr>
                                <td className="p-2 border">Gestione Mensile</td>
                                {config.showQuantity !== false && <td className="text-center p-2 border">12</td>}
                                <td className="text-right p-2 border">20%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )

        case 'totali':
            return (
                <div className="text-sm space-y-1 text-right">
                    {config.showSubtotale !== false && (
                        <div className="text-gray-600">Subtotale: <span className="font-medium">€ 1.000,00</span></div>
                    )}
                    {config.showIva !== false && (
                        <div className="text-gray-600">IVA 22%: <span className="font-medium">€ 220,00</span></div>
                    )}
                    <div className="text-lg font-bold text-gray-900 pt-1 border-t">Totale: € 1.220,00</div>
                </div>
            )

        case 'validita':
            const days = (config.days as number) || 30
            return (
                <div className="text-sm text-gray-600">
                    Questa proposta è valida per <span className="font-medium">{days} giorni</span> dalla data di emissione.
                </div>
            )

        case 'termini':
            return (
                <div className="text-xs text-gray-500 space-y-1">
                    <div>• I prezzi sono da intendersi IVA esclusa salvo ove diversamente specificato</div>
                    <div>• Il pagamento deve essere effettuato entro 30 giorni dalla fatturazione</div>
                    <div>• Per i servizi ricorrenti la commissione viene calcolata sul fatturato lordo</div>
                </div>
            )

        case 'firme':
            const leftLabel = (config.leftLabel as string) || 'Il Fornitore'
            const rightLabel = (config.rightLabel as string) || 'Il Cliente'
            return (
                <div className="flex justify-between pt-4">
                    <div className="text-center">
                        <div className="w-32 border-b border-gray-400 mb-1 h-12"></div>
                        <div className="text-sm text-gray-600">{leftLabel}</div>
                    </div>
                    <div className="text-center">
                        <div className="w-32 border-b border-gray-400 mb-1 h-12"></div>
                        <div className="text-sm text-gray-600">{rightLabel}</div>
                    </div>
                </div>
            )

        case 'note':
            const styles: Record<string, string> = {
                warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
                info: 'bg-blue-50 border-blue-300 text-blue-800',
                success: 'bg-green-50 border-green-300 text-green-800',
                error: 'bg-red-50 border-red-300 text-red-800',
            }
            const style = (config.style as string) || 'warning'
            return (
                <div className={`p-3 border rounded ${styles[style] || styles.warning}`}>
                    <div className="text-sm">Nota importante da compilare...</div>
                </div>
            )

        case 'separatore':
            const lineStyles: Record<string, string> = {
                solid: 'border-solid',
                dashed: 'border-dashed',
                dotted: 'border-dotted',
                double: 'border-double border-2',
            }
            const lineStyle = (config.style as string) || 'solid'
            return <hr className={`border-gray-300 my-4 ${lineStyles[lineStyle] || lineStyles.solid}`} />

        default:
            return <div className="text-gray-400 italic">Contenuto blocco...</div>
    }
}

export function PreviewDynamicBlock({ blockType, config }: PreviewDynamicBlockProps) {
    const blockInfo = BLOCK_MAP[blockType]

    if (!blockInfo) {
        return (
            <div className="my-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                Blocco non riconosciuto: {blockType}
            </div>
        )
    }

    return (
        <div className="my-3 relative border-2 border-dashed border-purple-200 bg-purple-50/30 rounded-xl p-4">
            {/* Header blocco */}
            <div className="flex items-center gap-2 mb-3 text-purple-600">
                <span className="text-lg">{blockInfo.icon}</span>
                <span className="text-xs font-medium uppercase tracking-wide">{blockInfo.label}</span>
                <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded ml-auto">Placeholder</span>
            </div>

            {/* Contenuto esempio */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
                {getBlockExampleContent(blockType, config)}
            </div>
        </div>
    )
}
