import type { Bookmark, BookmarkFolderNode } from "@/types/bookmark"
import { useEffect, useState } from "react"

import { useBookmarks } from "./use-bookmarks"

type Folder = {
  id: string
  title: string
  depth: number
}

/**
 * Flattens nested bookmark folders into a flat array with depth indicators
 * Useful for displaying bookmark folders in dropdowns or lists with proper indentation
 */
const useFlattenBookmarkFolders = () => {
  const bookmarks = useBookmarks()

  const [folders, setFolders] = useState<Folder[]>([])
  useEffect(() => {
    if (bookmarks && bookmarks.length > 0) {
      const flattenBookmarks = (
        nodes: Bookmark[],
        depth: number = 0,
      ): Folder[] => {
        let flatArray: Folder[] = []

        for (const node of nodes) {
          if ((node as BookmarkFolderNode).children) {
            const indentedTitle = " ".repeat(depth) + node.title
            flatArray.push({ id: node.id, title: indentedTitle, depth })

            flatArray = flatArray.concat(
              flattenBookmarks(
                (node as BookmarkFolderNode).children,
                depth + 2,
              ),
            )
          }
        }

        return flatArray
      }

      const bookmarkFolders = flattenBookmarks(bookmarks)

      setFolders(bookmarkFolders)
    }
  }, [bookmarks])

  return folders
}

export { useFlattenBookmarkFolders }
