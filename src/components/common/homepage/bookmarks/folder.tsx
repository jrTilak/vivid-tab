import type { BookmarkFolderNode } from "@/types/bookmark-types"
import { FolderClosedIcon, FolderIcon } from "lucide-react"
import React from "react"
import folderIcon from "data-base64:@/assets/folder-svgrepo-com.svg"

type Props = BookmarkFolderNode & {
  onOpenFolder: () => void
  layout: "grid" | "list"
}

const BookmarkFolder = (props: Props) => {
  if (props.layout === "grid") {
    return (
      <button
        onClick={props.onOpenFolder}
        className="flex flex-col  space-y-1 p-2 rounded-lg hover:scale-105 transition-transform w-24">
        <img src={folderIcon} alt="" className="size-12 mx-auto" />
        <p className="text-center line-clamp-2 text-xs">{props.title}</p>
      </button>
    )
  } else {
    return (
      <button
        onClick={props.onOpenFolder}
        className="flex space-x-1 p-2 items-center rounded-lg transition-colors">
        <img src={folderIcon} alt="" className="size-12" />
        <p className="text-xs w-full text-left line-clamp-2">
          {props.title}
          <br />
          {props.children?.length} items
        </p>
      </button>
    )
  }
}

export default BookmarkFolder
