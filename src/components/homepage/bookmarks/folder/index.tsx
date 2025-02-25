import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import type { BookmarkFolderNode } from "@/types/bookmark-types"
import React, { useState } from "react"
import folderIcon from "data-base64:@/assets/folder-svgrepo-com.svg"
import DeleteDialog from "../delete-dialog"
import { DeleteIcon, EditIcon, MoveIcon } from "lucide-react"
import CreateAFolder from "../create-a-folder"
import useIcon from "@/hooks/use-icon"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/cn"

type Props = BookmarkFolderNode & {
  onOpenFolder: () => void
  layout: "grid" | "list"
  index: number
}

const BookmarkFolder = (props: Props) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const { icon, setIcon } = useIcon({ id: props.id, defaultIcon: folderIcon })

  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: { index: props.index },
  })

  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    isDragging,
    transform,
  } = useDraggable({
    id: props.id,
    data: { index: props.index },
  })

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined

  return (
    <>
      <CreateAFolder
        open={isUpdateDialogOpen}
        setOpen={setIsUpdateDialogOpen}
        defaultValues={{
          id: props.id,
          title: props.title,
        }}
      />
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        id={props.id}
        label={props.title + " folder and it's contents"}
      />
      <ContextMenu>
        <ContextMenuTrigger>
          {props.layout === "grid" ? (
            <button
              ref={setNodeRef}
              style={style}
              onClick={props.onOpenFolder}
              className={cn("flex flex-col  space-y-1 p-2 rounded-lg hover:scale-105 w-24 disabled:opacity-50", isOver && "bg-accent/10")}
            >
              <img
                ref={draggableRef}
                {...attributes}
                {...listeners}
                src={icon}
                alt=""
                className={cn("size-12 mx-auto rounded-md object-contain object-center", isDragging && "scale-105")}
                onError={() => setIcon(folderIcon)}
              />
              <p className="text-center line-clamp-2 text-xs break-all">
                {props.title} ({props.children.length})
              </p>
            </button>
          ) : (
            <button
              onClick={props.onOpenFolder}
              style={style}
              ref={setNodeRef}
              className={cn("flex space-x-1 p-2 items-center rounded-lg transition-colors disabled:opacity-50", isOver && "bg-accent/10")}
            >
              <img
                src={icon}
                ref={draggableRef}
                {...attributes}
                {...listeners}
                alt=""
                className={cn("size-12 rounded-md object-contain object-center", isDragging && "scale-105")}
                onError={() => setIcon(folderIcon)}
              />
              <p className="text-xs w-full text-left line-clamp-2">
                {props.title}
                <br />
                {props.children?.filter((child) => "children" in child).length}
                f,{" "}
                {props.children?.filter((child) => "children" in child).length}b
              </p>
            </button>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-fit min-w-40">
          <ContextMenuItem
            onClick={() => setTimeout(() => setIsUpdateDialogOpen(true), 100)}
          >
            Edit
            <ContextMenuShortcut>
              <EditIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Move
            <ContextMenuShortcut>
              <MoveIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setTimeout(() => setIsDeleteDialogOpen(true), 100)}
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

export default BookmarkFolder
