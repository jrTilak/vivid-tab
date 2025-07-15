import type { BookmarkFolderNode, Bookmarks } from "@/types/bookmark"

/**
 * Finds a specific bookmark folder by ID within nested bookmark structure
 * Params: bookmarks (Bookmarks) - the bookmark tree, id (string) - folder ID to find
 * Returns: BookmarkFolderNode or null if not found
 */
const getBookmarkFolder = (
  bookmarks: Bookmarks,
  id: string,
): BookmarkFolderNode | null => {
  const findNode = (
    nodes: BookmarkFolderNode[],
    id: string,
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

export { getBookmarkFolder }
