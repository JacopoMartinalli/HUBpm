'use client'

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

export function VariableMentionView({ node }: NodeViewProps) {
  const { id, label, categoria } = node.attrs

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-blue-100 text-blue-700 rounded text-sm font-medium cursor-default"
        contentEditable={false}
        title={`${categoria}: ${id}`}
      >
        <span className="text-blue-400">@</span>
        {label}
      </span>
    </NodeViewWrapper>
  )
}
