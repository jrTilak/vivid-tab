import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import React from 'react'

type Props = {
  item: {
    id: string
    label: string
    index: number
  }
  onClick: () => void
  activeRootFolder: string
  disableDragging?: boolean
}

const RootFolderButton = ({
  item,
  onClick,
  activeRootFolder,
  disableDragging,
}: Props) => {

  const { isOver, setNodeRef } = useDroppable({
    id: item.id,
    data: { index: item.index },
  })

  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    transform,
  } = useDraggable({
    id: item.id,
    data: { index: item.index },
  })

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined

  return (
    <div
      style={style}
      ref={disableDragging ? null : setNodeRef}
    >
      <Button
        key={item.id}
        onClick={onClick}
        onFocusCapture={onClick}
        variant={activeRootFolder === item.id ? "default" : "ghost"}
        size="sm"
        className={cn(
          "text-xs px-2.5 py-1 h-fit rounded-sm",
          activeRootFolder !== item.id &&
          "bg-muted/20 hover:bg-muted/30",
          isOver && "bg-destructive",
        )}
        {...(disableDragging ? {} : { ref: draggableRef, ...listeners, ...attributes })}
      >
        {item.label}
      </Button>
    </div>
  )
}

export default RootFolderButton