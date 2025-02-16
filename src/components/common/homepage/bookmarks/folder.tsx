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
        disabled={props.children?.length === 0}
        onClick={props.onOpenFolder}
        className="flex flex-col  space-y-1 p-2 rounded-lg hover:scale-105 transition-transform w-24 disabled:opacity-50">
        <img src={folderIcon} alt="" className="size-12 mx-auto" />
        <p className="text-center line-clamp-2 text-xs break-all">{props.title}</p>
      </button>
    )
  } else {
    return (
      <button
        disabled={props.children?.length === 0}
        onClick={props.onOpenFolder}
        className="flex space-x-1 p-2 items-center rounded-lg transition-colors disabled:opacity-50"
      >
        <img src={folderIcon} alt="" className="size-12" />
        <p className="text-xs w-full text-left line-clamp-2">
          {props.title}
          <br />
          {props.children?.filter((child) => "children" in child).length}f,{' '}
          {props.children?.filter((child) => "children" in child).length}b
        </p>
      </button>
    )
  }
}

export default BookmarkFolder
