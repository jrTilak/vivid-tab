import { BACKGROUND_ACTIONS } from "@/common/constants"
import getBookmarkFolder from "@/helpers/get-bookmark-folder"
import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark-types"
import { useEffect, useState } from "react"

const useBookmarks = (id?: string) => {
  const [bookmarks, setBookmarks] = useState<Bookmarks>([])
  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: BACKGROUND_ACTIONS.GET_BOOKMARKS },
      (response: Bookmarks = []) => {
        const data =
          response[0]?.id == "0"
            ? (response[0] as BookmarkFolderNode).children
            : response

        const folder = id ? getBookmarkFolder(data, id)?.children : data

        setBookmarks(folder || [])
      }
    )
  }, [])

  return bookmarks
}

export default useBookmarks
