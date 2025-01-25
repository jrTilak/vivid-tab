import { Card, CardHeader } from "@/components/ui/card"
import { cn } from "@/helpers/cn"
import { useSettings } from "@/providers/settings-provider"
import { GridIcon, GripIcon } from "lucide-react"
import React from "react"
import { useDrag, useDrop } from "react-dnd"

type Props = {
  label: string
  id: string
  className?: string
  index: number
}

const PreviewCard = ({ id, label, className, index }: Props) => {
  const { setSettings } = useSettings()
  // Drag hook for the button
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  // Drop hook for the card
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "CARD",
    drop: (item: { id: string; index: number }) => {
      if (id === item.id) return
      if (id === "bookmarks" || item.id === "bookmarks") return
      if (item.id === "searchbar" && !(index === 0 || index === 8)) return

      // Update the settings layout
      setSettings((prevSettings) => {
        return {
          ...prevSettings,
          layout: {
            ...prevSettings.layout,
            [index]: item.id,
            [item.index]: id
          }
        }
      })
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }))

  return (
    <Card
      ref={drop} // Attach drop ref to the card
      className={cn(
        "relative w-full flex items-center justify-center text-center bg-muted",
        isOver && "bg-muted-foreground/40",
        className
      )}>
      <CardHeader>{label}</CardHeader>

      {/* Drag button */}
      <button
        ref={drag} // Attach drag ref to the button
        className={cn("absolute top-2 right-2", isDragging && "opacity-50")}>
        <GripIcon size={20} />
      </button>
    </Card>
  )
}

export default PreviewCard
