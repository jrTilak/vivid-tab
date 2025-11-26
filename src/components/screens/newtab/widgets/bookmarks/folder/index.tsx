import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import type { BookmarkFolderNode } from "@/types/bookmark"
import React, { useState, useEffect } from "react"
import folderIcon from "data-base64:@/assets/folder-svgrepo-com.png"
import { DeleteDialog } from "../delete-dialog"
import { DeleteIcon, EditIcon, MoveIcon } from "lucide-react"
import { CreateAFolder } from "../create-a-folder"
import { useIcon } from "@/hooks/use-icon"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/cn"
import { MoveBookmarkDialog } from "../move-bookmark-dialog"

type Props = BookmarkFolderNode & {
  onOpenFolder: () => void
  layout: "grid" | "list"
  index: number
}

const BookmarkFolder = (props: Props) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const { icon, fetchIcon } = useIcon({ id: props.id })

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

  useEffect(() => {
    if (!isUpdateDialogOpen) {
      fetchIcon()
    }
  }, [isUpdateDialogOpen, fetchIcon])

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
      <MoveBookmarkDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        id={props.id}
        label={props.title + " bookmark"}
      />
      <ContextMenu>
        <ContextMenuTrigger>
          {props.layout === "grid" ? (
            <button
              ref={setNodeRef}
              style={style}
              onClick={props.onOpenFolder}
              className={cn(
                "flex flex-col space-y-1 p-2 rounded-lg hover:scale-105 w-24 disabled:opacity-50 cursor-pointer disabled:cursor-default transition-transform",
                isOver && "bg-accent/10",
                isDragging && "bg-destructive/20",
                isDragging && "relative z-50",
              )}
            >
              {icon ? (
                <div
                  ref={draggableRef}
                  {...attributes}
                  {...listeners}
                  className={cn(
                    "relative size-12 mx-auto rounded-md object-contain object-center",
                    isDragging && "scale-105",
                  )}
                >
                  <img src={folderIcon} />
                  <img
                    src={icon}
                    alt=""
                    className="absolute w-10 h-6 object-cover object-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md shadow-inner brightness-90"
                  />
                </div>
              ) : (
                <img
                  ref={draggableRef}
                  {...attributes}
                  {...listeners}
                  src={folderIcon}
                  alt=""
                  className={cn(
                    "size-12 mx-auto rounded-md object-contain object-center",
                    isDragging && "scale-105",
                  )}
                />
              )}
              <p className="text-center line-clamp-2 text-xs break-all">
                {props.title} ({props.children.length})
              </p>
            </button>
          ) : (
            <button
              onClick={props.onOpenFolder}
              style={style}
              ref={setNodeRef}
              className={cn(
                "flex gap-2 p-2 items-center rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-default transition-transform",
                isOver && "bg-accent/10",
                isDragging && "scale-110 bg-destructive/20",
                isDragging && "relative z-50",
              )}
            >
              {icon ? (
                <div
                  ref={draggableRef}
                  {...attributes}
                  {...listeners}
                  className={cn(
                    "relative min-w-12 size-12 mx-auto rounded-md object-contain object-center",
                    isDragging && "scale-105",
                  )}
                >
                  <img src={folderIcon} className="size-12 min-w-12" />
                  <img
                    src={icon}
                    alt=""
                    className="absolute w-10 h-8 object-cover object-center top-1/2 left-1/2 -translate-x-1/2 translate-y-[-40%] rounded-md shadow-inner brightness-90"
                  />
                </div>
              ) : (
                <img
                  ref={draggableRef}
                  {...attributes}
                  {...listeners}
                  src={folderIcon}
                  alt=""
                  className={cn(
                    "size-12 mx-auto rounded-md object-contain object-center",
                    isDragging && "scale-105",
                  )}
                />
              )}
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
          <ContextMenuItem
            onClick={() => setTimeout(() => setIsMoveDialogOpen(true), 100)}
          >
            Move
            <ContextMenuShortcut>
              <MoveIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setTimeout(() => setIsDeleteDialogOpen(true), 100)}
            className="text-red-500"
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

export { BookmarkFolder }
