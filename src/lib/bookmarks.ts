// const getBookmarkFolder = (
//   bookmarks: Bookmarks,
//   id: string
// ): BookmarkFolderNode | null => {
//   const findNode = (
//     nodes: BookmarkFolderNode[],
//     id: string
//   ): BookmarkFolderNode | null => {
//     for (const node of nodes) {
//       if (node.id === id) {
//         return node
//       }
//       if (node.children) {
//         const foundNode = findNode(node.children as BookmarkFolderNode[], id)
//         if (foundNode) {
//           return foundNode
//         }
//       }
//     }
//     return null
//   }
//   return findNode(bookmarks, id)
// }

import type {
  Bookmark,
  BookmarkFolderNode,
  BookmarkTreeNode
} from "@/types/bookmark-types"

class Bookmarks {
  searchBookmarkFoldersByName(
    bookmarks: Bookmark[],
    name: string
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
            newPath
          )
        }
      }
    }

    findNode(bookmarks, name, "")
    return foundBookmarks
  }
}

const bookmarks = new Bookmarks()

export default bookmarks
