import { useDraggable, useDroppable } from "@dnd-kit/core"
import React from "react"
import { MoveBookmarkDialog } from "./move-bookmark-dialog"
import { DeleteDialog } from "./delete-dialog"
import { CreateAFolder } from "./create-a-folder"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/cn"
import { DeleteIcon, EditIcon, MoveIcon } from "lucide-react"

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const { isOver, setNodeRef } = useDroppable({
    id: item.id,
    data: { index: item.index },
  })

  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    transform,
    isDragging,
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
    <>
      <MoveBookmarkDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        id={item.id}
        label={item.label + " bookmark"}
      />
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        id={item?.id}
        label={item?.label + " tab and it's contents"}
      />
      <CreateAFolder
        open={editDialogOpen}
        setOpen={setEditDialogOpen}
        defaultValues={{
          id: item.id,
          title: item.label,
        }}
      />
      <ContextMenu key={item.id}>
        <ContextMenuTrigger disabled={disableDragging}>
          <div style={style} ref={disableDragging ? null : setNodeRef}>
            <Button
              key={item.id}
              onClick={onClick}
              onFocusCapture={onClick}
              variant={activeRootFolder === item.id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "text-xs px-2.5 py-1 h-fit rounded-sm",
                activeRootFolder !== item.id &&
                  "bg-muted/20 hover:bg-muted/30 text-accent-foreground",
                isOver && "bg-destructive",
                isDragging && "scale-110",
              )}
              {...(disableDragging
                ? {}
                : { ref: draggableRef, ...listeners, ...attributes })}
            >
              {item.label}
            </Button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-fit min-w-40">
          <ContextMenuItem
            onClick={() => {
              setTimeout(() => setEditDialogOpen(true), 100)
            }}
          >
            Edit
            <ContextMenuShortcut>
              <EditIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setTimeout(() => setIsMoveDialogOpen(true), 100)
            }}
          >
            Move
            <ContextMenuShortcut>
              <MoveIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setTimeout(() => setIsDeleteDialogOpen(true), 100)
            }}
            className="text-destructive"
          >
            Delete
            <ContextMenuShortcut>
              <DeleteIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  )
}

export { RootFolderButton }
