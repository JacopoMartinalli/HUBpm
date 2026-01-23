'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface KanbanColumn<T> {
  id: string
  title: string
  description?: string
  color?: string
  items: T[]
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[]
  renderCard: (item: T) => React.ReactNode
  onCardClick?: (item: T) => void
  onMoveCard?: (item: T, targetColumnId: string) => void
  onDrop?: (itemId: string, targetColumnId: string) => void
  emptyMessage?: string
  className?: string
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onCardClick,
  emptyMessage = 'Nessun elemento',
  className,
}: KanbanBoardProps<T>) {
  return (
    <ScrollArea className={cn('w-full', className)}>
      <div className="flex gap-4 pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex w-[300px] flex-shrink-0 flex-col"
          >
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {column.items.length}
                  </Badge>
                </div>
                {column.description && (
                  <p className="text-xs text-muted-foreground">
                    {column.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="flex flex-col gap-2">
                    {column.items.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        {emptyMessage}
                      </div>
                    ) : (
                      column.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onCardClick?.(item)}
                          className={cn(
                            'cursor-pointer transition-colors',
                            onCardClick && 'hover:opacity-80'
                          )}
                        >
                          {renderCard(item)}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

// Componente per una card Kanban generica
interface KanbanCardProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function KanbanCard({
  title,
  subtitle,
  badge,
  footer,
  className,
}: KanbanCardProps) {
  return (
    <Card className={cn('p-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {badge}
      </div>
      {footer && <div className="mt-2 pt-2 border-t">{footer}</div>}
    </Card>
  )
}
