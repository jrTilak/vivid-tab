import type {
  Bookmark,
  BookmarkFolderNode,
  BookmarkTreeNode,
} from "@/types/bookmark"

class Bookmarks {
  searchBookmarkFoldersByName(
    bookmarks: Bookmark[],
    name: string,
  ): { bookmark: Bookmark; path: string }[] {
    const foundBookmarks: { bookmark: Bookmark; path: string }[] = []

    const findNode = (nodes: Bookmark[], name: string, currentPath: string) => {
      for (const node of nodes) {
        const newPath = currentPath
          ? `${currentPath}/${node.title}`
          : node.title

        if (node.title === name) {
          foundBookmarks.push({ bookmark: node, path: newPath })
        }

        if ((node as BookmarkFolderNode).children) {
          findNode(
            (node as BookmarkFolderNode).children as BookmarkTreeNode[],
            name,
            newPath,
          )
        }
      }
    }

    findNode(bookmarks, name, "")

    return foundBookmarks
  }
}

export const bookmarks = new Bookmarks()
