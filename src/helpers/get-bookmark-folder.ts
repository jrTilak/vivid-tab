import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark-types"

const getBookmarkFolder = (
  bookmarks: Bookmarks,
  id: string
): BookmarkFolderNode | null => {
  console.log("getBookmarkFolder -> id", id)

  const findNode = (
    nodes: BookmarkFolderNode[],
    id: string
  ): BookmarkFolderNode | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node
      }
      if (node.children) {
        const foundNode = findNode(node.children as BookmarkFolderNode[], id)
        if (foundNode) {
          return foundNode
        }
      }
    }
    return null
  }
  return findNode(bookmarks, id)
}

export default getBookmarkFolder
