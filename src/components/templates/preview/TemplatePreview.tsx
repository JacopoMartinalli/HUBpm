'use client'

import { useMemo } from 'react'
import { PreviewVariable } from './PreviewVariable'
import { PreviewDynamicBlock } from './PreviewDynamicBlock'
import type { TemplateContext } from '@/lib/services/template-resolver'
import { resolveVariable, resolveBlockData } from '@/lib/services/template-resolver'
import { getDefaultIntestazione, getDefaultPiePagina } from '@/lib/default-header-footer'

interface TemplatePreviewProps {
    content: Record<string, unknown>
    context?: TemplateContext
    className?: string
    fontTitoli?: string
    fontCorpo?: string
    /** Mostra intestazione e piè di pagina (solo per PDF A4) */
    showHeaderFooter?: boolean
}

interface TipTapNode {
    type: string
    content?: TipTapNode[]
    text?: string
    attrs?: Record<string, unknown>
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

// Renderizza i marks (bold, italic, etc.)
function renderMarks(text: string, marks?: Array<{ type: string; attrs?: Record<string, unknown> }>): React.ReactNode {
    if (!marks || marks.length === 0) return text

    let content: React.ReactNode = text
    for (const mark of marks) {
        switch (mark.type) {
            case 'bold':
                content = <strong>{content}</strong>
                break
            case 'italic':
                content = <em>{content}</em>
                break
            case 'underline':
                content = <u>{content}</u>
                break
            case 'strike':
                content = <s>{content}</s>
                break
            case 'link':
                content = <a href={mark.attrs?.href as string} className="text-blue-600 underline">{content}</a>
                break
        }
    }
    return content
}

// Renderizza ricorsivamente i nodi TipTap
function RenderNode({ node, index, context, fontTitoli }: { node: TipTapNode; index: number; context?: TemplateContext; fontTitoli?: string }): React.ReactNode {
    switch (node.type) {
        case 'doc':
            return (
                <div className="template-preview-content">
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                    ))}
                </div>
            )

        case 'paragraph': {
            const textAlign = node.attrs?.textAlign as string
            const alignClass = textAlign ? `text-${textAlign}` : ''
            return (
                <p className={`mb-3 ${alignClass}`} key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                    )) || <br />}
                </p>
            )
        }

        case 'heading': {
            const level = (node.attrs?.level as number) || 1
            const headingAlign = node.attrs?.textAlign as string
            const headingAlignClass = headingAlign ? `text-${headingAlign}` : ''
            const Tag = `h${level}` as keyof JSX.IntrinsicElements
            const sizeClasses: Record<number, string> = {
                1: 'text-2xl font-bold mb-4',
                2: 'text-xl font-semibold mb-3',
                3: 'text-lg font-medium mb-2',
            }
            return (
                <Tag className={`${sizeClasses[level] || sizeClasses[1]} ${headingAlignClass}`} key={index} style={fontTitoli ? { fontFamily: fontTitoli } : undefined}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                    ))}
                </Tag>
            )
        }

        case 'text':
            return renderMarks(node.text || '', node.marks)

        case 'bulletList':
            return (
                <ul className="list-disc list-inside mb-3 space-y-1" key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                    ))}
                </ul>
            )

        case 'orderedList':
            return (
                <ol className="list-decimal list-inside mb-3 space-y-1" key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                    ))}
                </ol>
            )

        case 'listItem':
            return (
                <li key={index}>
                    {node.content?.map((child, i) => {
                        if (child.type === 'paragraph') {
                            return child.content?.map((c, j) => (
                                <RenderNode key={j} node={c} index={j} context={context} />
                            ))
                        }
                        return <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                    })}
                </li>
            )

        case 'blockquote':
            return (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3" key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                    ))}
                </blockquote>
            )

        case 'horizontalRule':
            return <hr className="my-4 border-gray-300" key={index} />

        case 'hardBreak':
            return <br key={index} />

        // Nodi custom per template
        case 'variableMention': {
            const varId = node.attrs?.id as string
            const resolved = context ? resolveVariable(varId, context) : null
            return (
                <PreviewVariable
                    key={index}
                    id={varId}
                    label={node.attrs?.label as string}
                    categoria={node.attrs?.categoria as string}
                    resolvedValue={resolved}
                />
            )
        }

        case 'dynamicBlock': {
            const blockType = node.attrs?.blockType as string
            const config = (node.attrs?.config as Record<string, unknown>) || {}
            const resolved = context ? resolveBlockData(blockType, context) : undefined
            return (
                <PreviewDynamicBlock
                    key={index}
                    blockType={blockType}
                    config={config}
                    resolvedData={resolved}
                />
            )
        }

        default:
            if (node.content) {
                return (
                    <div key={index}>
                        {node.content.map((child, i) => (
                            <RenderNode key={i} node={child} index={i} context={context} fontTitoli={fontTitoli} />
                        ))}
                    </div>
                )
            }
            return null
    }
}

export function TemplatePreview({ content, context, className = '', fontTitoli, fontCorpo, showHeaderFooter = true }: TemplatePreviewProps) {
    const renderedContent = useMemo(() => {
        if (!content || Object.keys(content).length === 0) {
            return (
                <div className="text-center text-gray-400 py-8">
                    <p>Nessun contenuto nel template</p>
                </div>
            )
        }

        return <RenderNode node={content as unknown as unknown as TipTapNode} index={0} context={context} fontTitoli={fontTitoli} />
    }, [content, context, fontTitoli])

    // Header/footer from azienda settings, with defaults as fallback (only for PDF A4 documents)
    const headerContent = showHeaderFooter
        ? (context?.azienda?.intestazione_json || getDefaultIntestazione())
        : null
    const footerContent = showHeaderFooter
        ? (context?.azienda?.pie_pagina_json || getDefaultPiePagina())
        : null

    const renderedHeader = useMemo(() => {
        if (!headerContent || Object.keys(headerContent).length === 0) return null
        return <RenderNode node={headerContent as unknown as TipTapNode} index={-1} context={context} fontTitoli={fontTitoli} />
    }, [headerContent, context, fontTitoli])

    const renderedFooter = useMemo(() => {
        if (!footerContent || Object.keys(footerContent).length === 0) return null
        return <RenderNode node={footerContent as unknown as TipTapNode} index={-2} context={context} fontTitoli={fontTitoli} />
    }, [footerContent, context, fontTitoli])

    return (
        <div className={`template-preview prose prose-sm max-w-none ${className}`}>
            {renderedHeader && (
                <div className="template-header mb-6">
                    {renderedHeader}
                </div>
            )}
            {renderedContent}
            {renderedFooter && (
                <div className="template-footer mt-6">
                    {renderedFooter}
                </div>
            )}
        </div>
    )
}
