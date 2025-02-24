import { Card, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/cn"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { GripIcon } from "lucide-react"
import React from "react"

type Props = {
  label?: string
  id?: string
  className?: string
  index: number
}

const PreviewCard = ({
  id = "empty",
  label = "Empty",
  className,
  index,
}: Props) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id === "empty" ? String(id) + index : id,
    data: { index },
  })

  const {
    attributes,
    listeners,
    setNodeRef: draggableRed,
    isDragging,
    transform,
  } = useDraggable({
    id: id === "empty" ? String(id) + index : id,
    data: { index },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "relative w-full flex items-center justify-center text-center bg-muted text-foreground",
        isOver && "bg-muted-foreground/40",
        className,
      )}
      style={style}
    >
      <CardHeader>{label}</CardHeader>

      {/* Drag button */}
      <button
        ref={draggableRed} // Attach drag ref to the button
        className={cn("absolute top-2 right-2", isDragging && "opacity-50")}
        {...attributes}
        {...listeners}
      >
        <GripIcon size={20} />
      </button>
    </Card>
  )
}

export default PreviewCard
