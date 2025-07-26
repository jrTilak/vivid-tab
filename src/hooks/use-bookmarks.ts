import { BACKGROUND_ACTIONS } from "@/constants/background-actions"
import { getBookmarkFolder } from "@/lib/get-bookmark-folder"
import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark"
import { useCallback, useEffect, useState } from "react"

/**
 * Custom hook to fetch bookmarks from the Chrome extension's bookmarks API.
 * If id is provided, it returns the bookmarks of the given id,
 */
const useBookmarks = (id?: string) => {
  const [bookmarks, setBookmarks] = useState<Bookmarks>([])

  const fn = useCallback(() => {
    chrome.runtime.sendMessage(
      { action: BACKGROUND_ACTIONS.GET_BOOKMARKS },
      (response: Bookmarks = []) => {
        const data =
          response[0]?.id == "0"
            ? (response[0] as BookmarkFolderNode).children
            : response

        const folder = id ? getBookmarkFolder(data, id)?.children : data

        setBookmarks(folder || [])
      },
    )
  }, [id])

  useEffect(() => {
    fn()

    chrome.bookmarks.onCreated.addListener(fn)
    chrome.bookmarks.onRemoved.addListener(fn)
    chrome.bookmarks.onChanged.addListener(fn)
    chrome.bookmarks.onMoved.addListener(fn)

    return () => {
      chrome.bookmarks.onCreated.removeListener(fn)
      chrome.bookmarks.onRemoved.removeListener(fn)
      chrome.bookmarks.onChanged.removeListener(fn)
      chrome.bookmarks.onMoved.removeListener(fn)
    }
  }, [])

  return bookmarks
}

export { useBookmarks }
