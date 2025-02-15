import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark-types"
import { useCallback, useEffect, useState } from "react"

import useBookmarks from "./use-bookmarks"

export function useBookmarkFolderNavigation(id?: string) {
  const bookmarks = useBookmarks(id)
  const [currentFolders, setCurrentFolders] = useState(bookmarks)
  const [folderPath, setFolderPath] = useState<Bookmarks>([])
  const [selectedFolder, setSelectedFolder] = useState<
    Bookmarks[number] | null
  >(null)

  const openFolder = useCallback(
    (folder: BookmarkFolderNode, savePath = true) => {
      if (folder.children) {
        setCurrentFolders(folder.children)
        if (savePath) {
          setFolderPath((prev) => [...prev, folder])
        }
      }
    },
    []
  )

  const goBack = useCallback(() => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath]
      newPath.pop()
      setFolderPath(newPath)
      setCurrentFolders(
        newPath.length > 0
          ? (newPath[newPath.length - 1] as BookmarkFolderNode).children || []
          : bookmarks
      )
    }
  }, [folderPath])

  const selectFolder = useCallback((folder: BookmarkFolderNode) => {
    setSelectedFolder(folder)
  }, [])

  useEffect(() => {
    setCurrentFolders(bookmarks)
    setFolderPath([])
    setSelectedFolder(null)
  }, [bookmarks])

  return {
    currentFolders,
    folderPath,
    selectedFolder,
    openFolder,
    goBack,
    selectFolder
  }
}
