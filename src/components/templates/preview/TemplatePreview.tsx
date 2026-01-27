'use client'

import { useMemo } from 'react'
import { PreviewVariable } from './PreviewVariable'
import { PreviewDynamicBlock } from './PreviewDynamicBlock'

interface TemplatePreviewProps {
    content: Record<string, unknown>
    className?: string
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
function RenderNode({ node, index }: { node: TipTapNode; index: number }): React.ReactNode {
    switch (node.type) {
        case 'doc':
            return (
                <div className="template-preview-content">
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} />
                    ))}
                </div>
            )

        case 'paragraph':
            const textAlign = node.attrs?.textAlign as string
            const alignClass = textAlign ? `text-${textAlign}` : ''
            return (
                <p className={`mb-3 ${alignClass}`} key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} />
                    )) || <br />}
                </p>
            )

        case 'heading':
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
                <Tag className={`${sizeClasses[level] || sizeClasses[1]} ${headingAlignClass}`} key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} />
                    ))}
                </Tag>
            )

        case 'text':
            return renderMarks(node.text || '', node.marks)

        case 'bulletList':
            return (
                <ul className="list-disc list-inside mb-3 space-y-1" key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} />
                    ))}
                </ul>
            )

        case 'orderedList':
            return (
                <ol className="list-decimal list-inside mb-3 space-y-1" key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} />
                    ))}
                </ol>
            )

        case 'listItem':
            return (
                <li key={index}>
                    {node.content?.map((child, i) => {
                        // Per list items, renderizziamo il contenuto inline
                        if (child.type === 'paragraph') {
                            return child.content?.map((c, j) => (
                                <RenderNode key={j} node={c} index={j} />
                            ))
                        }
                        return <RenderNode key={i} node={child} index={i} />
                    })}
                </li>
            )

        case 'blockquote':
            return (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3" key={index}>
                    {node.content?.map((child, i) => (
                        <RenderNode key={i} node={child} index={i} />
                    ))}
                </blockquote>
            )

        case 'horizontalRule':
            return <hr className="my-4 border-gray-300" key={index} />

        case 'hardBreak':
            return <br key={index} />

        // Nodi custom per template
        case 'variableMention':
            return (
                <PreviewVariable
                    key={index}
                    id={node.attrs?.id as string}
                    label={node.attrs?.label as string}
                    categoria={node.attrs?.categoria as string}
                />
            )

        case 'dynamicBlock':
            return (
                <PreviewDynamicBlock
                    key={index}
                    blockType={node.attrs?.blockType as string}
                    config={(node.attrs?.config as Record<string, unknown>) || {}}
                />
            )

        default:
            // Per nodi non riconosciuti, prova a renderizzare i figli
            if (node.content) {
                return (
                    <div key={index}>
                        {node.content.map((child, i) => (
                            <RenderNode key={i} node={child} index={i} />
                        ))}
                    </div>
                )
            }
            return null
    }
}

export function TemplatePreview({ content, className = '' }: TemplatePreviewProps) {
    const renderedContent = useMemo(() => {
        if (!content || Object.keys(content).length === 0) {
            return (
                <div className="text-center text-gray-400 py-8">
                    <p>Nessun contenuto nel template</p>
                </div>
            )
        }

        return <RenderNode node={content as TipTapNode} index={0} />
    }, [content])

    return (
        <div className={`template-preview prose prose-sm max-w-none ${className}`}>
            {renderedContent}
        </div>
    )
}
