'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

export interface KanbanColumn<T> {
  id: string
  title: string
  description?: string
  color?: string
  items: T[]
}

interface KanbanBoardDndProps<T> {
  columns: KanbanColumn<T>[]
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode
  onCardClick?: (item: T) => void
  onMoveCard?: (itemId: string, sourceColumnId: string, targetColumnId: string) => void
  emptyMessage?: string
  className?: string
  getItemColumn?: (item: T) => string
}

// Componente per card draggabile
function DraggableCard<T extends { id: string }>({
  item,
  renderCard,
  onCardClick,
}: {
  item: T
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode
  onCardClick?: (item: T) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50'
      )}
    >
      {/* Handle per il drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Card content */}
      <div
        onClick={() => onCardClick?.(item)}
        className={cn(
          'cursor-pointer transition-colors pl-6',
          onCardClick && 'hover:opacity-80'
        )}
      >
        {renderCard(item, isDragging)}
      </div>
    </div>
  )
}

// Componente colonna droppabile
function DroppableColumn<T extends { id: string }>({
  column,
  renderCard,
  onCardClick,
  emptyMessage,
}: {
  column: KanbanColumn<T>
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode
  onCardClick?: (item: T) => void
  emptyMessage: string
}) {
  return (
    <div className="flex w-[300px] flex-shrink-0 flex-col">
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
            <SortableContext
              items={column.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 min-h-[100px]">
                {column.items.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    {emptyMessage}
                  </div>
                ) : (
                  column.items.map((item) => (
                    <DraggableCard
                      key={item.id}
                      item={item}
                      renderCard={renderCard}
                      onCardClick={onCardClick}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export function KanbanBoardDnd<T extends { id: string }>({
  columns,
  renderCard,
  onCardClick,
  onMoveCard,
  emptyMessage = 'Nessun elemento',
  className,
  getItemColumn,
}: KanbanBoardDndProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<T | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Trova l'item attivo
  const findItem = (id: string): T | null => {
    for (const column of columns) {
      const item = column.items.find(i => i.id === id)
      if (item) return item
    }
    return null
  }

  // Trova la colonna di un item
  const findColumnForItem = (itemId: string): string | null => {
    for (const column of columns) {
      if (column.items.some(i => i.id === itemId)) {
        return column.id
      }
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setActiveItem(findItem(active.id as string))
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Gestito in handleDragEnd
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setActiveItem(null)

    if (!over) return

    const activeItemId = active.id as string
    const overId = over.id as string

    // Trova la colonna di origine
    const sourceColumnId = findColumnForItem(activeItemId)
    if (!sourceColumnId) return

    // Determina la colonna di destinazione
    let targetColumnId: string | null = null

    // Se over è una colonna
    if (columns.some(c => c.id === overId)) {
      targetColumnId = overId
    } else {
      // Se over è un altro item, trova la sua colonna
      targetColumnId = findColumnForItem(overId)
    }

    if (!targetColumnId) return

    // Se la colonna è cambiata, chiama onMoveCard
    if (sourceColumnId !== targetColumnId && onMoveCard) {
      onMoveCard(activeItemId, sourceColumnId, targetColumnId)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveItem(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className={cn('w-full', className)}>
        <div className="flex gap-4 pb-4">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              renderCard={renderCard}
              onCardClick={onCardClick}
              emptyMessage={emptyMessage}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Overlay durante il drag */}
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-80 rotate-3 scale-105">
            {renderCard(activeItem, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
