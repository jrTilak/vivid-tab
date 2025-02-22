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

type Props = BookmarkFolderNode & {
  onOpenFolder: () => void
  layout: "grid" | "list"
}

const BookmarkFolder = (props: Props) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)

  return (
    <>
      <CreateAFolder open={isUpdateDialogOpen} setOpen={setIsUpdateDialogOpen} defaultValues={{
        id: props.id,
        title: props.title
      }} />
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        id={props.id}
        label={props.title + " folder and it's contents"}
      />
      <ContextMenu>
        <ContextMenuTrigger>
          {
            props.layout === "grid" ? (
              <button
                onClick={props.onOpenFolder}
                className="flex flex-col  space-y-1 p-2 rounded-lg hover:scale-105 transition-transform w-24 disabled:opacity-50"
              >
                <img src={folderIcon} alt="" className="size-12 mx-auto" />
                <p className="text-center line-clamp-2 text-xs break-all">
                  {props.title}
                </p>
              </button>
            ) : (
              <button
                onClick={props.onOpenFolder}
                className="flex space-x-1 p-2 items-center rounded-lg transition-colors disabled:opacity-50"
              >
                <img src={folderIcon} alt="" className="size-12" />
                <p className="text-xs w-full text-left line-clamp-2">
                  {props.title}
                  <br />
                  {props.children?.filter((child) => "children" in child).length}f,{" "}
                  {props.children?.filter((child) => "children" in child).length}b
                </p>
              </button>
            )
          }
        </ContextMenuTrigger>
        <ContextMenuContent className="w-fit min-w-40">

          <ContextMenuItem
            onClick={() => setIsUpdateDialogOpen(true)}
          >
            Edit
            <ContextMenuShortcut
            >
              <EditIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem >
            Move
            <ContextMenuShortcut>
              <MoveIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive">
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
